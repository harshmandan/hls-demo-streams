const RULES = [18, 22, 30, 45, 54, 60, 73, 90, 105, 110, 126, 150, 182, 184];
const CELL_SIZES = [1, 2, 4];

export default {
	name: 'cellauto',
	make(rng, video) {
		const rule = rng.pick(RULES);
		const cell = rng.pick(CELL_SIZES);
		const on = rng.color({ light: [0.55, 0.75] });
		const off = rng.color({ light: [0.04, 0.1], sat: [0.3, 0.6] });
		const seed = rng.int(1, 999999);
		return {
			title: `Rule ${rule}`,
			params: { rule, cell, on: on.hex, off: off.hex },
			// cellauto is black and white, so lutrgb maps the two values to two colours
			source:
				`cellauto=s=${video.w / cell}x${video.h / cell}:r=${video.fps}:rule=${rule}:seed=${seed},` +
				`format=rgb24,` +
				`lutrgb=r='if(val,${on.r},${off.r})':g='if(val,${on.g},${off.g})':b='if(val,${on.b},${off.b})',` +
				`scale=${video.w}:${video.h}:flags=neighbor`
		};
	}
};
