/// <reference lib="webworker" />
// App-shell cache so the installed app starts offline and opens instantly.
// Only this site's own files are cached; pCloud API calls and images are
// cross-origin and go straight to the network.
import { base, build, files, prerendered, version } from '$service-worker';

const CACHE = `pcltoon-${version}`;
const SHELL = `${base}/`;
const ASSETS = new Set([...build, ...files, ...prerendered]);

self.addEventListener('install', (event) => {
	// Take over without waiting for every window to close: an installed app is
	// rarely closed for good, so the next launch would otherwise stay stale.
	// Pages already open keep the code they have loaded.
	event.waitUntil(
		caches
			.open(CACHE)
			// Bypass the HTTP cache (GitHub Pages sends max-age=600) so a fresh
			// deploy never stores the previous index.html under the new version.
			.then((cache) => cache.addAll([...ASSETS].map((path) => new Request(path, { cache: 'reload' }))))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
	);
});

async function respond(request) {
	const url = new URL(request.url);
	const cache = await caches.open(CACHE);

	// Hashed build output and static files never change within a version.
	if (ASSETS.has(url.pathname)) {
		const cached = await cache.match(url.pathname);
		if (cached) return cached;
	}

	try {
		return await fetch(request);
	} catch (err) {
		// Offline: every route is the same client-rendered shell; the query
		// string (?code=…&p=…) is read on the client.
		const fallback = request.mode === 'navigate' ? await cache.match(SHELL) : undefined;
		if (fallback) return fallback;
		throw err;
	}
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
	event.respondWith(respond(request));
});
