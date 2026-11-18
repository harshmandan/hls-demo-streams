// [name, rule, starting fill ratio]. The ratio is tuned per rule so the grid stays alive.
const RULES = [
	['Conway', 'B3/S23', 0.3],
	['HighLife', 'B36/S23', 0.4],
	['Day and Night', 'B3678/S34678', 0.5],
	['Maze', 'B3/S12345', 0.05],
	['Seeds', 'B2/S', 0.002],
	['Replicator', 'B1357/S1357', 0.01],
	['Coral', 'B3/S45678', 0.3],
	['2x2', 'B36/S125', 0.3],
	['Amoeba', 'B357/S1358', 0.3]
];
const CELL_SIZES = [2, 4, 8];

export default {
	name: 'life',
	make(rng, video) {
		const [name, rule, ratio] = rng.pick(RULES);
		const cell = rng.pick(CELL_SIZES);
		const alive = rng.color({ light: [0.55, 0.75] });
		const dead = rng.color({ light: [0.04, 0.1], sat: [0.3, 0.6] });
		const mold = rng.int(0, 20);
		const seed = rng.int(1, 999999);
		return {
			title: `Life: ${name}`,
			params: { rule, cell, alive: alive.hex, dead: dead.hex },
			source:
				`life=s=${video.w / cell}x${video.h / cell}:r=${video.fps}:rule=${rule}:ratio=${ratio}:seed=${seed}` +
				`:mold=${mold}:life_color=${alive.hex}:death_color=${dead.hex}:mold_color=${alive.hex},` +
				`scale=${video.w}:${video.h}:flags=neighbor`
		};
	}
};
