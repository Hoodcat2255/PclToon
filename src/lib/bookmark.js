// Reading position is stored as "page index + fraction scrolled into that page"
// rather than raw scrollY, so it survives different screen widths and images
// whose heights are only known after they load.

const keyFor = (code, folderId) => `bookmark_${code}_${folderId}`;

/**
 * @param {{ top: number, height: number }[]} pages document-space boxes, in order
 * @param {number} scrollY
 */
export function computePosition(pages, scrollY) {
	if (pages.length === 0) return null;
	for (let i = 0; i < pages.length; i++) {
		const { top, height } = pages[i];
		if (scrollY < top + height || i === pages.length - 1) {
			const fraction = height > 0 ? (scrollY - top) / height : 0;
			return { i, f: Math.min(Math.max(fraction, 0), 1) };
		}
	}
	return null;
}

export function positionToScroll(position, page) {
	return Math.round(page.top + position.f * page.height);
}

/** Returns `{ i, f }` or null. Legacy numeric scrollY values are discarded. */
export function parseBookmark(raw) {
	if (!raw) return null;
	try {
		const value = JSON.parse(raw);
		if (
			value &&
			Number.isInteger(value.i) &&
			value.i >= 0 &&
			typeof value.f === 'number' &&
			value.f >= 0 &&
			value.f <= 1
		) {
			return { i: value.i, f: value.f };
		}
	} catch {
		// Malformed value — treat as no bookmark.
	}
	return null;
}

export function loadBookmark(code, folderId) {
	try {
		return parseBookmark(localStorage.getItem(keyFor(code, folderId)));
	} catch {
		return null;
	}
}

export function saveBookmark(code, folderId, position) {
	if (!position) return;
	try {
		localStorage.setItem(keyFor(code, folderId), JSON.stringify(position));
	} catch {
		// Storage full or blocked — bookmarks are best-effort.
	}
}
