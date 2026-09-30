const MAX_HISTORY = 10;

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

	add(code, name) {
		items = [
			{ code, name, lastAccess: Date.now() },
			...items.filter(item => item.code !== code)
		].slice(0, MAX_HISTORY);
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
