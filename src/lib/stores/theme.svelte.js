let current = $state('');

export const theme = {
	get value() {
		return current;
	},

	init() {
		if (typeof window === 'undefined') return;
		const stored = localStorage.getItem('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		current = stored || (prefersDark ? 'dark' : '');
	},

	toggle() {
		current = current === 'dark' ? '' : 'dark';
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', current);
		}
	}
};
