import { writable } from 'svelte/store';

function createThemeStore() {
	const { subscribe, set, update } = writable('');

	return {
		subscribe,
		init: () => {
			if (typeof window !== 'undefined') {
				const stored = localStorage.getItem('theme');
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				const theme = stored || (prefersDark ? 'dark' : '');
				set(theme);
			}
		},
		toggle: () => {
			update(current => {
				const newTheme = current === 'dark' ? '' : 'dark';
				if (typeof window !== 'undefined') {
					localStorage.setItem('theme', newTheme);
				}
				return newTheme;
			});
		},
		set: (value) => {
			if (typeof window !== 'undefined') {
				localStorage.setItem('theme', value);
			}
			set(value);
		}
	};
}

export const theme = createThemeStore();
