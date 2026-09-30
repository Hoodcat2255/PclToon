// Fake pCloud Public API + image host so the reader can be exercised offline.

export const CODE = 'TESTcode1';
export const IMAGE_HOST = 'img.pcltoon.test';

function images(prefix, count, dims) {
	return Array.from({ length: count }, (_, i) => ({
		isfolder: false,
		fileid: prefix * 100 + i + 1,
		name: `${String(i + 1).padStart(3, '0')}.jpg`,
		...(dims ? { width: dims[0], height: dims[1], thumb: true } : {})
	}));
}

// Ep 1: wide images with known dimensions (thumbnail path).
// Ep 2: no dimensions (layout waits for loads). Ep 10 checks natural sort.
export const TREE = {
	name: 'Test Comic',
	folderid: 1,
	isfolder: true,
	contents: [
		{ isfolder: true, folderid: 12, name: 'Ep 10', contents: images(12, 3, [800, 1200]) },
		{ isfolder: true, folderid: 10, name: 'Ep 1', contents: images(10, 12, [3000, 2000]) },
		{ isfolder: true, folderid: 11, name: 'Ep 2', contents: images(11, 12, null) }
	]
};

function extraTree(code) {
	const n = Number(code.slice('EXTRA'.length));
	return { name: `Extra ${n}`, folderid: 9000 + n, isfolder: true, contents: images(90 + n, 2, [800, 1200]) };
}

function svg(width, height, label) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#ddd"/><text x="20" y="80" font-size="60">${label}</text></svg>`;
}

const allImages = () => TREE.contents.flatMap((folder) => folder.contents);

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ delayForFile?: (fileid: number) => number, failFiles?: number[], expireOnce?: number[] }} [options]
 *   expireOnce: image files whose first download 404s, like an expired link
 */
export async function mockPcloud(page, { delayForFile = () => 0, failFiles = [], expireOnce = [] } = {}) {
	const expired = new Set();
	const calls = { showpublink: 0, download: [], thumb: [] };

	await page.route('https://api.pcloud.com/**', async (route) => {
		const url = new URL(route.request().url());
		const code = url.searchParams.get('code');
		const fileid = Number(url.searchParams.get('fileid'));
		const json = (body) =>
			route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });

		if (url.pathname === '/showpublink') {
			calls.showpublink++;
			if (code === CODE) return json({ result: 0, metadata: TREE });
			// EXTRA<n>: additional small series for multi-link tests.
			if (/^EXTRA\d+$/.test(code)) return json({ result: 0, metadata: extraTree(code) });
			return json({ result: 7001, error: 'Invalid link code.' });
		}

		const delay = delayForFile(fileid);
		if (delay) await new Promise((resolve) => setTimeout(resolve, delay));

		if (failFiles.includes(fileid)) return json({ result: 7002, error: 'This link is deleted by the owner.' });

		if (url.pathname === '/getpublinkdownload') {
			calls.download.push(fileid);
			return json({ result: 0, hosts: [IMAGE_HOST], path: `/orig/${fileid}.svg` });
		}
		if (url.pathname === '/getpubthumblink') {
			calls.thumb.push({ fileid, size: url.searchParams.get('size') });
			return json({ result: 0, hosts: [IMAGE_HOST], path: `/thumb/${fileid}.svg` });
		}
		return route.abort();
	});

	await page.route(`https://${IMAGE_HOST}/**`, (route) => {
		const fileid = Number(route.request().url().match(/(\d+)\.svg$/)[1]);
		if (expireOnce.includes(fileid) && !expired.has(fileid)) {
			expired.add(fileid);
			return route.fulfill({ status: 404, body: 'expired' });
		}
		const image = allImages().find((img) => img.fileid === fileid);
		const [w, h] = image?.width ? [image.width / 4, image.height / 4] : [700, 1400];
		return route.fulfill({ contentType: 'image/svg+xml', body: svg(w, h, `#${fileid}`) });
	});

	return calls;
}
