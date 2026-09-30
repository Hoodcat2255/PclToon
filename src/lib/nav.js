// App navigation state lives in the URL query so that browser back/forward,
// reloads and shared links all restore the same view.
//   ?code=<publink code>&p=<folderid>/<folderid>&view=list

const CODE_PATTERN = /^[a-zA-Z0-9]+$/;

export function parseSearch(searchParams) {
	const rawCode = searchParams.get('code');
	const code = rawCode && CODE_PATTERN.test(rawCode) ? rawCode : null;
	const path = (searchParams.get('p') || '')
		.split('/')
		.filter((segment) => /^\d+$/.test(segment))
		.map(Number);
	return {
		code,
		invalidCode: rawCode !== null && code === null,
		path,
		list: searchParams.get('view') === 'list'
	};
}

export function buildSearch({ code, path = [], list = false }) {
	if (!code) return '';
	const params = new URLSearchParams({ code });
	if (path.length > 0) params.set('p', path.join('/'));
	if (list) params.set('view', 'list');
	// Keep "/" readable in the path segment.
	return '?' + params.toString().replace(/%2F/g, '/');
}

/**
 * Walks the showpublink tree along `path` (folder ids).
 * Returns every node from the root to the deepest folder that exists, and
 * whether the full path was found.
 */
export function resolvePath(rootMetadata, path) {
	const nodes = [rootMetadata];
	for (const folderid of path) {
		const parent = nodes[nodes.length - 1];
		const next = (parent.contents || []).find(
			(item) => item.isfolder && item.folderid === folderid
		);
		if (!next) return { nodes, valid: false };
		nodes.push(next);
	}
	return { nodes, valid: true };
}

/**
 * Root: open the viewer only when it holds images and no subfolders.
 * Subfolder: open the viewer whenever it holds images, unless the list
 * view was requested explicitly.
 */
export function defaultView(isRoot, { folders, images }, listRequested) {
	if (images.length === 0) return 'list';
	if (folders.length === 0) return 'viewer';
	if (isRoot || listRequested) return 'list';
	return 'viewer';
}
