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
	const response = await fetch(`https://api.pcloud.com/showpublink?code=${code}`);

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

export function processContents(metadata) {
	const contents = metadata.metadata?.contents || [];
	return classifyContents(contents);
}

function getFileLink(code, fileid) {
	return `https://api.pcloud.com/getpublinkdownload?code=${code}&fileid=${fileid}`;
}

export async function getImageUrl(code, fileid) {
	const response = await fetch(getFileLink(code, fileid), {
		referrerPolicy: 'no-referrer'
	});

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

	const host = data.hosts[0];
	const path = data.path;
	return `https://${host}${path}`;
}

export async function batchFetchImageUrls(images, code, concurrency = 5, onProgress = null) {
	const results = [];
	for (let i = 0; i < images.length; i += concurrency) {
		const batch = images.slice(i, i + concurrency);
		const batchResults = await Promise.all(
			batch.map(async (img) => {
				try {
					return await getImageUrl(code, img.fileid);
				} catch {
					return null;
				}
			})
		);
		results.push(...batchResults);
		if (onProgress) {
			onProgress(Math.min(i + concurrency, images.length), images.length);
		}
	}
	return results.filter(Boolean);
}
