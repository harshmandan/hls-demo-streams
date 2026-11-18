// Zoom targets on the edge of the set. Points off the edge zoom into a flat colour.
const TARGETS = [
	[-0.743643887, 0.131825904],
	[-1.25066, 0.02012],
	[0.285, 0.01],
	[-0.1011, 0.9563],
	[-1.7497, 0],
	[-0.7453, 0.1127],
	[-0.748, 0.1]
];
const OUTER = ['normalized_iteration_count', 'iteration_count'];
const INNER = ['black', 'mincol', 'period', 'convergence'];

export default {
	name: 'mandelbrot',
	make(rng, video) {
		const [x, y] = rng.pick(TARGETS);
		const outer = rng.pick(OUTER);
		const inner = rng.pick(INNER);
		const endScale = rng.float(0.01, 0.1);
		const hue = rng.int(0, 359);
		return {
			title: 'Mandelbrot zoom',
			params: { x, y, endScale, hue, inner },
			source:
				`mandelbrot=s=${video.size}:r=${video.fps}:start_x=${x}:start_y=${y}` +
				`:start_scale=2.5:end_scale=${endScale}:end_pts=${video.frames}:outer=${outer}:inner=${inner},` +
				`hue=h=${hue}`
		};
	}
};
