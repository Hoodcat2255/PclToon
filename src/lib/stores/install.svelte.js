// Add-to-home-screen state. Chromium browsers hand us a deferred install
// prompt; Safari on iOS and Firefox on Android only install from their own
// menus, so for those we can only explain where to tap.

const DISMISS_KEY = 'install_hint_dismissed';

let deferred = $state.raw(null);
let platform = $state('');
let standalone = $state(false);
let dismissed = $state(false);
let listening = false;

function detectPlatform() {
	const ua = navigator.userAgent;
	if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
		return 'ios';
	}
	if (/Android/.test(ua) && /Firefox\//.test(ua)) return 'firefox-android';
	return '';
}

export const install = {
	/** 'prompt' (install button), 'ios' / 'firefox-android' (menu hint) or '' (nothing to show). */
	get mode() {
		if (standalone || dismissed) return '';
		if (deferred) return 'prompt';
		return platform;
	},

	init() {
		if (typeof window === 'undefined') return;
		platform = detectPlatform();
		standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
		try {
			dismissed = localStorage.getItem(DISMISS_KEY) === '1';
		} catch {
			// Storage blocked — the hint shows again next time.
		}
		// App-lifetime listeners; register them once even if init runs again.
		if (listening) return;
		listening = true;
		// Caught by the inline script in app.html if it fired before startup.
		deferred = window.__installPrompt ?? null;
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferred = e;
		});
		window.addEventListener('appinstalled', () => {
			deferred = null;
			window.__installPrompt = null;
			standalone = true;
		});
	},

	async prompt() {
		const event = deferred;
		if (!event) return;
		// A prompt can only be shown once; the browser fires a new event if the
		// app is still installable afterwards.
		deferred = null;
		window.__installPrompt = null;
		try {
			await event.prompt();
		} catch (err) {
			console.warn('Install prompt failed:', err);
		}
	},

	dismiss() {
		dismissed = true;
		try {
			localStorage.setItem(DISMISS_KEY, '1');
		} catch {
			// Storage blocked — hidden for this session only.
		}
	}
};
