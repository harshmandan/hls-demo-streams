# hls-demo-streams

Short HLS test clips that do not go dead.

Public demo streams vanish when their host cleans up. These clips are made from code. A GitHub Action runs ffmpeg and publishes the result to GitHub Pages on every push. No video files live in this repo.

**Gallery and API:** https://harshmandan.github.io/hls-demo-streams/

## The clips

- 120 clips: 20 each of 6 patterns
- 360x640 (vertical), 24 fps, 6 seconds, H.264, no audio
- One `.m3u8` playlist and one `.ts` segment per clip
- About 120 KB each
- Made to loop

Patterns: `gradients`, `plasma`, `testcard`, `mandelbrot`, `life`, `cellauto`.

## Play one

```
https://harshmandan.github.io/hls-demo-streams/streams/gradients-001/index.m3u8
```

Ids are `<pattern>-<number>`, numbered `001` to `020`.

```js
import Hls from 'hls.js';

const video = document.querySelector('video');
const url = 'https://harshmandan.github.io/hls-demo-streams/streams/life-007/index.m3u8';

if (Hls.isSupported()) {
	const hls = new Hls();
	hls.loadSource(url);
	hls.attachMedia(video);
} else {
	video.src = url; // Safari plays HLS natively
}
```

## API

The API is static JSON files. There are no keys and no rate limits. GitHub Pages allows requests from any origin.

Base: `https://harshmandan.github.io/hls-demo-streams`

| Path | Returns |
| --- | --- |
| `/api/index.json` | Clip count, video format, pattern names, endpoint list |
| `/api/streams.json` | Every stream |
| `/api/streams/{id}.json` | One stream |
| `/api/patterns.json` | Pattern names and counts |
| `/api/patterns/{pattern}.json` | Every stream of one pattern |
| `/api/random/{n}.json` | All streams, shuffled. `n` is 1 to 10 |
| `/api/random/{pattern}/{n}.json` | One pattern, shuffled. `n` is 1 to 10 |

A static host cannot shuffle per request. So the build writes 10 fixed shuffles. Pick `n` at random on the client:

```js
const n = 1 + Math.floor(Math.random() * 10);
const res = await fetch(`https://harshmandan.github.io/hls-demo-streams/api/random/${n}.json`);
const { streams } = await res.json();
```

A stream looks like this:

```json
{
	"id": "life-007",
	"title": "Life: Maze",
	"pattern": "life",
	"url": "https://harshmandan.github.io/hls-demo-streams/streams/life-007/index.m3u8",
	"path": "streams/life-007/index.m3u8",
	"width": 360,
	"height": 640,
	"duration": 6,
	"bytes": 131072,
	"params": { "rule": "B3/S12345", "cell": 4, "alive": "#60c0ff", "dead": "#081020" }
}
```

## Build it yourself

You need Node 20.11 or newer and ffmpeg with libx264.

```bash
node generate.mjs
```

```bash
npm run preview
```

Then open http://localhost:8080. The output is in `dist/`.

Options:

| Flag | Default | What it does |
| --- | --- | --- |
| `--per-pattern` | `20` | Clips per pattern |
| `--pattern` | all | Build one pattern only. Handy while writing one |
| `--seed` | `1` | Changes every clip and every shuffle |
| `--shuffles` | `10` | Shuffled lists per scope |
| `--reuse` | off | Keep clips already in `dist/`. Rebuild only the JSON and the page |
| `--jobs` | half your cores | ffmpeg runs in parallel |
| `--out` | `dist` | Output folder |
| `--base-url` | the Pages URL | Used for the absolute URLs in the JSON |

A fork works without changes. The workflow sets the base URL from the repo owner and name. Turn on Pages with "GitHub Actions" as the source.

## Contributing

New patterns are welcome.

1. Copy a file in `patterns/`, for example [`patterns/gradients.mjs`](patterns/gradients.mjs).
2. Export `{ name, make(rng, video) }`. `make` returns:
   - `title`: a short name for the clip
   - `params`: the settings you picked, for the JSON
   - `source`: an ffmpeg [lavfi source](https://ffmpeg.org/ffmpeg-filters.html#Video-Sources), with any filters after it
3. Add it to the list in [`patterns/index.mjs`](patterns/index.mjs).
4. Run `node generate.mjs --pattern yourname` and look at the result with `npm run preview`.

Rules:

- **Use only `rng` for random values.** Never `Math.random()`. The same id must always give the same clip. See [`lib/rng.mjs`](lib/rng.mjs) for the helpers.
- **Stay under 260 KB per clip.** The build fails above that. Smooth motion compresses well. Fine noise does not.
- **Use `video.size`, `video.w`, `video.h`, `video.fps`.** Do not hardcode the size.
- **No input files.** Clips come from ffmpeg sources only.
- **Check it works on ffmpeg 6.1.** That is what the GitHub runner installs.

Changing an existing pattern changes its clips for everyone. Prefer adding a new pattern.

## License

MIT. The generated clips are free to use for anything.
