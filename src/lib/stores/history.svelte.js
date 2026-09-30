const MAX_HISTORY = 10;

// { code, name, lastAccess, lastPath?: number[], lastName?: string }
let items = $state([]);

export const history = {
	get items() { return items; },

	init() {
		if (typeof window === 'undefined') return;
		try {
			const stored = localStorage.getItem('recent_links');
			items = stored ? JSON.parse(stored) : [];
		} catch {
			items = [];
		}
	},

	get(code) {
		return items.find(item => item.code === code);
	},

	add(code, name) {
		const existing = this.get(code);
		items = [
			{ ...existing, code, name, lastAccess: Date.now() },
			...items.filter(item => item.code !== code)
		].slice(0, MAX_HISTORY);
		this._save();
	},

	/** Records the episode last opened in the viewer for resume. */
	setLast(code, path, name) {
		const existing = this.get(code);
		if (!existing) return;
		if (existing.lastPath?.join('/') === path.join('/')) return;
		items = items.map(item =>
			item.code === code ? { ...item, lastPath: [...path], lastName: name } : item
		);
		this._save();
	},

	remove(code) {
		items = items.filter(item => item.code !== code);
		this._save();
	},

	_save() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem('recent_links', JSON.stringify(items));
		} catch {
			// localStorage 용량 초과 시 무시
		}
	}
};
