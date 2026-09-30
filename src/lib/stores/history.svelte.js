import { linksDb } from '$lib/db.js';

// Every link the user has opened, kept in IndexedDB until they remove it.
// { code, name, addedAt, lastAccess, lastPath?: number[], lastName?: string }
const LEGACY_KEY = 'recent_links';

let items = $state([]);
let ready = null;
// IndexedDB unavailable (e.g. some private modes): keep the old localStorage list.
let useLocalStorage = false;

const byLastAccess = (a, b) => b.lastAccess - a.lastAccess;

function readLegacy() {
	try {
		const parsed = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]');
		return Array.isArray(parsed) ? parsed.filter((item) => item?.code) : [];
	} catch (err) {
		console.warn('Ignoring unreadable legacy links:', err);
		return [];
	}
}

async function load() {
	let stored;
	try {
		stored = await linksDb.all();
	} catch (err) {
		console.warn('IndexedDB unavailable, saving links to localStorage instead:', err);
		useLocalStorage = true;
		items = readLegacy().sort(byLastAccess);
		return;
	}
	items = stored.sort(byLastAccess);
	await migrateLegacy();
}

// Move links saved by the old localStorage list into IndexedDB. The newer
// copy of a link wins; on failure the legacy key stays for the next load.
async function migrateLegacy() {
	const legacy = readLegacy();
	if (legacy.length === 0) return;
	try {
		for (const old of legacy) {
			await linksDb.update(old.code, (current) =>
				current && current.lastAccess >= old.lastAccess
					? current
					: { addedAt: old.lastAccess, ...current, ...old }
			);
		}
		items = (await linksDb.all()).sort(byLastAccess);
		localStorage.removeItem(LEGACY_KEY);
	} catch (err) {
		console.warn('Legacy link migration failed; will retry next time:', err);
	}
}

function saveLegacyList() {
	try {
		localStorage.setItem(LEGACY_KEY, JSON.stringify(items));
	} catch (err) {
		console.warn('Could not save links:', err);
	}
}

/**
 * Persists `merge` against the stored record in one IndexedDB transaction, so
 * fields another tab wrote meanwhile survive; the stored result then replaces
 * the optimistic in-memory copy.
 */
function save(code, merge) {
	if (useLocalStorage) {
		saveLegacyList();
		return;
	}
	const fallback = $state.snapshot(history.get(code));
	linksDb
		.update(code, (current) => merge(current ?? fallback))
		.then((record) => {
			items = items.map((item) => (item.code === code ? record : item));
		})
		.catch((err) => console.warn('Could not save link:', err));
}

export const history = {
	get items() { return items; },

	init() {
		if (typeof window === 'undefined') return Promise.resolve();
		ready ??= load();
		return ready;
	},

	get(code) {
		return items.find(item => item.code === code);
	},

	async add(code, name) {
		await this.init();
		const now = Date.now();
		const merge = (current) => ({ addedAt: now, ...current, code, name, lastAccess: now });
		items = [merge($state.snapshot(this.get(code))), ...items.filter(other => other.code !== code)];
		save(code, merge);
	},

	/** Records the episode last opened in the viewer for resume. */
	async setLast(code, path, name) {
		await this.init();
		const existing = this.get(code);
		if (!existing) return;
		if (existing.lastPath?.join('/') === path.join('/')) return;
		const merge = (current) => ({ ...current, lastPath: [...path], lastName: name });
		items = items.map(other => (other.code === code ? merge($state.snapshot(other)) : other));
		save(code, merge);
	},

	/**
	 * Asks the browser not to evict saved links under storage pressure. Call it
	 * from an explicit user action: Firefox may show a permission prompt.
	 */
	async requestPersistence() {
		try {
			if (!navigator.storage?.persist || (await navigator.storage.persisted())) return;
			await navigator.storage.persist();
		} catch (err) {
			console.warn('Persistent storage request failed:', err);
		}
	},

	async remove(code) {
		await this.init();
		items = items.filter(item => item.code !== code);
		if (useLocalStorage) saveLegacyList();
		else linksDb.delete(code).catch((err) => console.warn('Could not delete link:', err));
	}
};
