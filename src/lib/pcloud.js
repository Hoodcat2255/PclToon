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
	return url;
}

export async function fetchPublicLink(code) {
	const response = await fetch(`https://api.pcloud.com/showpublink?code=${code}`);
	const data = await response.json();

	if (data.error) {
		throw new Error(data.error);
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

export function processContents(metadata) {
	const contents = metadata.metadata?.contents || [];

	const folders = contents
		.filter(item => item.isfolder)
		.sort(naturalSort);

	const images = contents
		.filter(item => !item.isfolder && isImageFile(item.name))
		.sort(naturalSort);

	return { folders, images };
}

export function getFileLink(code, fileid) {
	return `https://api.pcloud.com/getpublinkdownload?code=${code}&fileid=${fileid}`;
}

export async function getImageUrl(code, fileid) {
	const response = await fetch(getFileLink(code, fileid), {
		referrerPolicy: 'no-referrer'
	});
	const data = await response.json();

	if (data.error) {
		throw new Error(data.error);
	}

	const host = data.hosts[0];
	const path = data.path;
	return `https://${host}${path}`;
}
