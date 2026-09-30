// Minimal promise wrapper around IndexedDB for the saved-links list.
// Records: { code, name, addedAt, lastAccess, lastPath?, lastName? } keyed by code.

const DB_NAME = 'pcltoon';
const DB_VERSION = 1;
const LINKS = 'links';

let dbPromise = null;

function openDb() {
	dbPromise ??= new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			request.result.createObjectStore(LINKS, { keyPath: 'code' });
		};
		request.onsuccess = () => {
			const db = request.result;
			// Let a newer tab upgrade the schema instead of blocking it.
			db.onversionchange = () => {
				db.close();
				dbPromise = null;
			};
			resolve(db);
		};
		request.onerror = () => reject(request.error);
		request.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another tab'));
	});
	return dbPromise;
}

/** Runs `operation(store)` in one transaction; resolves with `getResult()` once committed. */
async function transact(mode, operation) {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(LINKS, mode);
		const getResult = operation(tx.objectStore(LINKS));
		tx.oncomplete = () => resolve(getResult());
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
	});
}

export const linksDb = {
	all: () =>
		transact('readonly', (store) => {
			const request = store.getAll();
			return () => request.result;
		}),

	/**
	 * Reads the current record, lets `merge(current | undefined)` build the new
	 * plain-object record and writes it, all in one transaction so another tab's
	 * fields are not overwritten with stale in-memory values. Resolves with it.
	 */
	update: (code, merge) =>
		transact('readwrite', (store) => {
			let merged;
			const request = store.get(code);
			request.onsuccess = () => {
				merged = merge(request.result);
				store.put(merged);
			};
			return () => merged;
		}),

	delete: (code) =>
		transact('readwrite', (store) => {
			store.delete(code);
			return () => undefined;
		})
};
