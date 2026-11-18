const CARDS = ['testsrc2', 'testsrc', 'smptehdbars', 'smptebars', 'pal75bars', 'colorspectrum', 'rgbtestsrc', 'yuvtestsrc'];
const MOTIONS = ['hue spin', 'scroll sideways', 'scroll up', 'scroll diagonal'];

export default {
	name: 'testcard',
	make(rng, video) {
		const card = rng.pick(CARDS);
		const motion = rng.pick(MOTIONS);
		const dir = rng.bool() ? 1 : -1;
		const rate = rng.float(0.002, 0.008);
		const hue = rng.int(0, 359);

		let fx;
		if (motion === 'hue spin') fx = `hue=H=${dir}*2*PI*t/${rng.int(2, 6)}`;
		else if (motion === 'scroll sideways') fx = `hue=h=${hue},scroll=h=${dir * rate}`;
		else if (motion === 'scroll up') fx = `hue=h=${hue},scroll=v=${dir * rate}`;
		else fx = `hue=h=${hue},scroll=h=${dir * rate}:v=${rate}`;

		return {
			title: `Test card, ${motion}`,
			params: { card, motion },
			source: `${card}=s=${video.size}:r=${video.fps},${fx}`
		};
	}
};
