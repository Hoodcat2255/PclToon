const API = 'https://api.pcloud.com';
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

export function extractCode(url) {
	const patterns = [
		/code=([a-zA-Z0-9]+)/,
		/publink\/show\?code=([a-zA-Z0-9]+)/,
		/\/([a-zA-Z0-9]+)$/
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) return match[1];
	}

	// 폴백: 입력값이 영숫자만 포함하면 그대로 사용
	if (/^[a-zA-Z0-9]+$/.test(url)) {
		return url;
	}
	throw new Error('Invalid pCloud link format');
}

export async function fetchPublicLink(code) {
	const response = await fetch(`${API}/showpublink?${new URLSearchParams({ code })}`);

	if (!response.ok) {
		throw new Error(`Network error: ${response.status}`);
	}

	const data = await response.json();

	if (data.error) {
		throw new Error(data.error);
	}

	if (!data.metadata) {
		throw new Error('Invalid response: missing metadata');
	}

	return data;
}

export function naturalSort(a, b) {
	return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
}

export function isImageFile(filename) {
	const ext = filename.split('.').pop()?.toLowerCase();
	return IMAGE_EXTENSIONS.includes(ext);
}

export function classifyContents(contents) {
	const folders = contents
		.filter(item => item.isfolder)
		.sort(naturalSort);

	const images = contents
		.filter(item => !item.isfolder && isImageFile(item.name))
		.sort(naturalSort);

	return { folders, images };
}

// getpubthumblink limits (docs.pcloud.com): width 16–2048, height 16–1024,
// each divisible by 4 or 5.
const THUMB_MAX_WIDTH = 2048;
const THUMB_MAX_HEIGHT = 1024;

/**
 * Picks a thumbnail size that is sharp at `targetWidth` device pixels, or
 * returns null when the original should be used: unknown dimensions, the
 * original is not wider than needed, or the scaled image would be taller than
 * the API allows (typical for long webtoon strips).
 */
export function thumbSize(image, targetWidth) {
	const { width, height } = image;
	if (!width || !height || image.thumb === false) return null;

	const w = Math.min(Math.ceil(targetWidth / 4) * 4, THUMB_MAX_WIDTH);
	if (w < 16 || width <= w) return null;

	const scaledHeight = Math.ceil((height * w) / width);
	if (scaledHeight > THUMB_MAX_HEIGHT) return null;

	return `${w}x${THUMB_MAX_HEIGHT}`;
}

async function fetchDownloadUrl(url) {
	const response = await fetch(url, { referrerPolicy: 'no-referrer' });

	if (!response.ok) {
		throw new Error(`Network error: ${response.status}`);
	}

	const data = await response.json();

	if (data.error) {
		throw new Error(data.error);
	}

	if (!data.hosts?.length || !data.path) {
		throw new Error('Invalid response: missing download info');
	}

	return `https://${data.hosts[0]}${data.path}`;
}

export function getImageUrl(code, fileid) {
	const params = new URLSearchParams({ code, fileid: String(fileid) });
	return fetchDownloadUrl(`${API}/getpublinkdownload?${params}`);
}

/** Resized image when `size` is given and the thumb call succeeds, else the original. */
export async function getDisplayUrl(code, image, size) {
	if (size) {
		const params = new URLSearchParams({ code, fileid: String(image.fileid), size });
		try {
			return await fetchDownloadUrl(`${API}/getpubthumblink?${params}`);
		} catch (err) {
			console.warn(`Thumbnail unavailable for ${image.name}, using original:`, err);
		}
	}
	return getImageUrl(code, image.fileid);
}

/**
 * Resolves display URLs in page order with `concurrency` requests in flight,
 * reporting each through `onItem(index, url | null)` as soon as it arrives so
 * pages render progressively. Stops when `signal.cancelled` becomes true.
 */
export async function fetchImageUrls(
	images,
	code,
	{ concurrency = 5, targetWidth = 0, onItem, signal = { cancelled: false } } = {}
) {
	let next = 0;
	async function worker() {
		while (!signal.cancelled && next < images.length) {
			const index = next++;
			const image = images[index];
			let url = null;
			try {
				url = await getDisplayUrl(code, image, thumbSize(image, targetWidth));
			} catch (err) {
				console.warn(`Failed to resolve ${image.name}:`, err);
			}
			if (!signal.cancelled) onItem(index, url);
		}
	}
	await Promise.all(Array.from({ length: Math.min(concurrency, images.length) }, worker));
}
