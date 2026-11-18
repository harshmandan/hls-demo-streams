// Seeded random helpers. Same key in, same values out, on every machine.

function hash(str) {
	let h = 1779033703 ^ str.length;
	for (let i = 0; i < str.length; i++) {
		h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	h = Math.imul(h ^ (h >>> 16), 2246822507);
	h = Math.imul(h ^ (h >>> 13), 3266489909);
	return (h ^ (h >>> 16)) >>> 0;
}

function hslToRgb(h, s, l) {
	const a = s * Math.min(l, 1 - l);
	const f = (n) => {
		const k = (n + h / 30) % 12;
		return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
	};
	return [f(0), f(8), f(4)];
}

export function makeRng(key) {
	let a = hash(key);
	const next = () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};

	const rng = {
		/** Float in [min, max), rounded to `digits` decimals. */
		float: (min, max, digits = 3) => Number((min + next() * (max - min)).toFixed(digits)),
		/** Integer in [min, max], both ends included. */
		int: (min, max) => Math.floor(min + next() * (max - min + 1)),
		pick: (list) => list[Math.floor(next() * list.length)],
		bool: (chance = 0.5) => next() < chance,
		/** Random colour. `light` is the lightness range, 0 to 1. */
		color: ({ light = [0.5, 0.7], sat = [0.7, 1] } = {}) => {
			const [r, g, b] = hslToRgb(rng.int(0, 359), rng.float(...sat), rng.float(...light));
			const hex = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
			return { r, g, b, hex };
		}
	};
	return rng;
}
