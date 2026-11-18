export default {
	name: 'plasma',
	make(rng, video) {
		const waves = [rng.int(12, 150), rng.int(12, 150), rng.int(12, 150)];
		const speeds = [rng.int(1, 8), rng.int(1, 8), rng.int(1, 8)];
		const hue = rng.int(0, 359);
		const [wr, wg, wb] = waves;
		const [sr, sg, sb] = speeds;
		return {
			title: 'Plasma waves',
			params: { waves, speeds, hue },
			source:
				`nullsrc=s=${video.size}:r=${video.fps},` +
				`geq=r='128+127*sin(X/${wr}+T*${sr})':g='128+127*sin(Y/${wg}+T*${sg})':b='128+127*sin((X+Y)/${wb}+T*${sb})',` +
				`hue=h=${hue}`
		};
	}
};
