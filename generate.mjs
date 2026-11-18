#!/usr/bin/env node
// Builds every clip, plus index.json and the gallery page, into the output folder.
import { spawn } from 'node:child_process';
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { makeRng } from './lib/rng.mjs';
import { patterns } from './patterns/index.mjs';

const { values: args } = parseArgs({
	options: {
		'per-pattern': { type: 'string', default: '20' },
		out: { type: 'string', default: 'dist' },
		seed: { type: 'string', default: '1' },
		'base-url': { type: 'string', default: process.env.BASE_URL ?? 'https://harshmandan.github.io/hls-demo-streams' },
		pattern: { type: 'string' },
		// how many pre-shuffled lists to write per scope
		shuffles: { type: 'string', default: '10' },
		// keep clips that already exist in the output folder; only rebuild the JSON and site
		reuse: { type: 'boolean', default: false },
		jobs: { type: 'string', default: String(Math.max(1, Math.floor(os.cpus().length / 2))) }
	}
});

const VIDEO = { w: 360, h: 640, size: '360x640', fps: 24, seconds: 6, frames: 144 };
// Each clip may use at most this much, playlist included.
const MAX_BYTES = 260 * 1024;

const perPattern = Number(args['per-pattern']);
const baseUrl = args['base-url'].replace(/\/$/, '');
const out = path.resolve(args.out);
const root = import.meta.dirname;
const active = args.pattern ? patterns.filter((p) => p.name === args.pattern) : patterns;
if (active.length === 0) {
	console.error(`No pattern named "${args.pattern}". Known: ${patterns.map((p) => p.name).join(', ')}`);
	process.exit(1);
}

function ffmpeg(source, dir) {
	const argv = [
		'-v', 'error', '-f', 'lavfi', '-i', source, '-t', String(VIDEO.seconds),
		'-c:v', 'libx264', '-preset', 'veryslow', '-crf', '32',
		// the cap keeps noisy patterns small; smooth ones stay far below it
		'-maxrate', '200k', '-bufsize', '400k',
		'-pix_fmt', 'yuv420p', '-g', '48', '-an',
		'-f', 'hls', '-hls_time', String(VIDEO.seconds), '-hls_playlist_type', 'vod',
		'-hls_segment_filename', path.join(dir, 's%d.ts'), path.join(dir, 'index.m3u8')
	];
	return new Promise((resolve, reject) => {
		const child = spawn('ffmpeg', argv, { stdio: ['ignore', 'ignore', 'pipe'] });
		let err = '';
		child.stderr.on('data', (d) => (err += d));
		child.on('error', reject);
		child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err.trim() || `ffmpeg exit ${code}`))));
	});
}

async function folderBytes(dir) {
	let total = 0;
	for (const name of await readdir(dir)) total += (await stat(path.join(dir, name))).size;
	return total;
}

async function build(job) {
	const dir = path.join(out, 'streams', job.id);
	await mkdir(dir, { recursive: true });
	const exists = await stat(path.join(dir, 'index.m3u8')).then(() => true, () => false);
	if (!(args.reuse && exists)) await ffmpeg(job.source, dir);
	const bytes = await folderBytes(dir);
	if (bytes > MAX_BYTES) throw new Error(`${Math.round(bytes / 1024)} KB is over the ${MAX_BYTES / 1024} KB limit`);
	return {
		id: job.id,
		title: job.title,
		pattern: job.pattern,
		url: `${baseUrl}/streams/${job.id}/index.m3u8`,
		path: `streams/${job.id}/index.m3u8`,
		width: VIDEO.w,
		height: VIDEO.h,
		duration: VIDEO.seconds,
		bytes,
		params: job.params
	};
}

// Round-robin across patterns so any slice of the list is a mix.
const jobs = [];
for (let n = 1; n <= perPattern; n++) {
	for (const pattern of active) {
		const id = `${pattern.name}-${String(n).padStart(3, '0')}`;
		const made = pattern.make(makeRng(`${args.seed}:${id}`), VIDEO);
		jobs.push({ id, pattern: pattern.name, ...made });
	}
}

if (!args.reuse) await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const streams = new Array(jobs.length);
const failures = [];
let cursor = 0;
let done = 0;
async function worker() {
	while (cursor < jobs.length) {
		const i = cursor++;
		try {
			streams[i] = await build(jobs[i]);
		} catch (e) {
			failures.push(`${jobs[i].id}: ${e.message}\n  source: ${jobs[i].source}`);
		}
		done++;
		if (done % 10 === 0 || done === jobs.length) console.log(`${done}/${jobs.length}`);
	}
}
await Promise.all(Array.from({ length: Number(args.jobs) }, worker));

if (failures.length) {
	console.error(`\n${failures.length} clip(s) failed:\n${failures.join('\n')}`);
	process.exit(1);
}

// The "API" is plain JSON files. Random lists are shuffled here, at build time.
const shuffles = Number(args.shuffles);
const api = path.join(out, 'api');
await rm(api, { recursive: true, force: true });

async function writeJson(file, data) {
	const full = path.join(api, file);
	await mkdir(path.dirname(full), { recursive: true });
	await writeFile(full, JSON.stringify(data) + '\n');
}

function shuffled(list, key) {
	const rng = makeRng(`${args.seed}:shuffle:${key}`);
	const copy = [...list];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = rng.int(0, i);
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

async function writeRandom(folder, list, extra) {
	for (let n = 1; n <= shuffles; n++) {
		await writeJson(`${folder}/${n}.json`, { ...extra, shuffle: n, shuffles, count: list.length, streams: shuffled(list, `${folder}:${n}`) });
	}
}

await writeJson('streams.json', { count: streams.length, streams });
await writeRandom('random', streams, {});
for (const stream of streams) await writeJson(`streams/${stream.id}.json`, stream);

const patternList = [];
for (const pattern of active) {
	const mine = streams.filter((s) => s.pattern === pattern.name);
	patternList.push({ name: pattern.name, count: mine.length, url: `${baseUrl}/api/patterns/${pattern.name}.json` });
	await writeJson(`patterns/${pattern.name}.json`, { pattern: pattern.name, count: mine.length, streams: mine });
	await writeRandom(`random/${pattern.name}`, mine, { pattern: pattern.name });
}
await writeJson('patterns.json', { count: patternList.length, patterns: patternList });

await writeJson('index.json', {
	name: 'hls-demo-streams',
	count: streams.length,
	shuffles,
	video: { width: VIDEO.w, height: VIDEO.h, fps: VIDEO.fps, duration: VIDEO.seconds, audio: false },
	patterns: patternList.map((p) => p.name),
	endpoints: {
		streams: `${baseUrl}/api/streams.json`,
		stream: `${baseUrl}/api/streams/{id}.json`,
		patterns: `${baseUrl}/api/patterns.json`,
		pattern: `${baseUrl}/api/patterns/{pattern}.json`,
		random: `${baseUrl}/api/random/{n}.json`,
		randomByPattern: `${baseUrl}/api/random/{pattern}/{n}.json`
	}
});

await cp(path.join(root, 'site'), out, { recursive: true });
// Stops GitHub Pages from running Jekyll over the output.
await writeFile(path.join(out, '.nojekyll'), '');

const total = streams.reduce((sum, s) => sum + s.bytes, 0);
console.log('');
for (const pattern of active) {
	const mine = streams.filter((s) => s.pattern === pattern.name);
	const avg = mine.reduce((sum, s) => sum + s.bytes, 0) / mine.length / 1024;
	const max = Math.max(...mine.map((s) => s.bytes)) / 1024;
	console.log(`${pattern.name.padEnd(12)} ${String(mine.length).padStart(4)} clips  avg ${avg.toFixed(0).padStart(4)} KB  max ${max.toFixed(0).padStart(4)} KB`);
}
console.log(`${'total'.padEnd(12)} ${String(streams.length).padStart(4)} clips  ${(total / 1024 / 1024).toFixed(1)} MB  avg ${(total / streams.length / 1024).toFixed(0)} KB`);
