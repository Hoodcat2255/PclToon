let current = $state('');

export const theme = {
	get value() {
		return current;
	},

	init() {
		if (typeof window === 'undefined') return;
		let stored = null;
		try {
			stored = localStorage.getItem('theme');
		} catch {
			// Storage blocked — fall back to the OS preference.
		}
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		// Legacy '' (pre-'light') falls through to the OS preference.
		current = stored ? (stored === 'dark' ? 'dark' : '') : prefersDark ? 'dark' : '';
	},

	toggle() {
		current = current === 'dark' ? '' : 'dark';
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem('theme', current || 'light');
		} catch {
			// Storage blocked — theme applies for this session only.
		}
	}
};
