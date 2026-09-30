// Reading mode per series (public link code): webtoons scroll vertically,
// some comics read like a book with horizontal page turns.
const STORAGE_KEY = 'reading_modes';

let modes = $state({});

export const readingMode = {
	init() {
		if (typeof window === 'undefined') return;
		try {
			modes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
		} catch (err) {
			console.warn('Ignoring unreadable reading modes:', err);
			modes = {};
		}
	},

	get(code) {
		return modes[code] === 'paged' ? 'paged' : 'vertical';
	},

	toggle(code) {
		modes = { ...modes, [code]: this.get(code) === 'paged' ? 'vertical' : 'paged' };
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(modes));
		} catch (err) {
			console.warn('Reading mode not saved:', err);
		}
	}
};
