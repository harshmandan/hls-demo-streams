const TYPES = ['linear', 'radial', 'circular', 'spiral'];

export default {
	name: 'gradients',
	make(rng, video) {
		const type = rng.pick(TYPES);
		const colors = rng.int(2, 8);
		const speed = rng.float(0.01, 0.06);
		const seed = rng.int(1, 999999);
		return {
			title: `${type[0].toUpperCase()}${type.slice(1)} gradient`,
			params: { type, colors, speed },
			source: `gradients=s=${video.size}:r=${video.fps}:type=${type}:n=${colors}:speed=${speed}:seed=${seed}`
		};
	}
};
