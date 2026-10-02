import { test, expect } from '@playwright/test';
import { mockPcloud } from './mock-pcloud.js';

const FIREFOX_ANDROID_UA = 'Mozilla/5.0 (Android 15; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0';
const IOS_SAFARI_UA =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const installHint = (page) => page.getByRole('region', { name: 'Install app' });

/** Width and height from a PNG's IHDR chunk. */
function pngSize(buffer) {
	return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

test('manifest icons exist at their declared sizes, with a separate maskable icon', async ({ page }) => {
	await page.goto('./');
	const manifestUrl = new URL(await page.locator('link[rel="manifest"]').getAttribute('href'), page.url());
	const manifest = await (await page.request.get(manifestUrl.href)).json();
	expect(manifest).toMatchObject({ id: './', start_url: './', scope: './', display: 'standalone' });
	expect(manifest.icons.filter((icon) => icon.purpose === 'maskable')).toHaveLength(1);

	for (const icon of manifest.icons) {
		const response = await page.request.get(new URL(icon.src, manifestUrl).href);
		expect(response.ok(), icon.src).toBe(true);
		if (icon.type !== 'image/png') continue;
		const [w, h] = pngSize(await response.body());
		expect(`${w}x${h}`).toBe(icon.sizes);
	}

	const touchIcon = await page.request.get(
		new URL(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'), page.url()).href
	);
	expect(pngSize(await touchIcon.body())).toEqual([180, 180]);
});

test.describe('with the service worker', () => {
	test.use({ serviceWorkers: 'allow' });

	test('the app shell opens offline once installed', async ({ page, context }) => {
		await mockPcloud(page);
		await page.goto('./');
		await page.evaluate(() => navigator.serviceWorker.ready);
		const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
		expect(new URL(scope).pathname).toBe('/PclToon/');

		await context.setOffline(true);
		await page.reload();
		await expect(page.getByLabel('pCloud Public Link')).toBeVisible();
		// Deep links share the same shell; the query string is read on the client.
		await page.goto('./?code=TESTcode1&p=10');
		await expect(page.locator('header')).toBeVisible();
		await context.setOffline(false);
	});
});

function fireInstallPrompt() {
	const event = new Event('beforeinstallprompt', { cancelable: true });
	event.prompt = () => {
		window.__installPrompted = (window.__installPrompted ?? 0) + 1;
		return Promise.resolve({ outcome: 'accepted' });
	};
	window.dispatchEvent(event);
}

test('the install button shows the browser prompt and goes away afterwards', async ({ page }) => {
	await mockPcloud(page);
	await page.goto('./');
	await expect(page.getByLabel('pCloud Public Link')).toBeVisible();
	await expect(installHint(page)).toHaveCount(0);

	await page.evaluate(fireInstallPrompt);
	const button = installHint(page).getByRole('button', { name: 'Install', exact: true });
	await expect(button).toBeVisible();
	const box = await button.boundingBox();
	expect(box.height).toBeGreaterThanOrEqual(44);

	await button.click();
	expect(await page.evaluate(() => window.__installPrompted)).toBe(1);
	await expect(installHint(page)).toHaveCount(0);
});

test('an install prompt fired before the app starts is not lost', async ({ page }) => {
	await mockPcloud(page);
	// Runs before any page script, like a browser firing the event during load.
	await page.addInitScript(`addEventListener('DOMContentLoaded', ${fireInstallPrompt})`);
	await page.goto('./');
	await expect(installHint(page).getByRole('button', { name: 'Install', exact: true })).toBeVisible();
});

test.describe('on Firefox for Android', () => {
	test.use({ userAgent: FIREFOX_ANDROID_UA });

	test('explains the menu entry and can be dismissed for good', async ({ page }) => {
		await mockPcloud(page);
		await page.goto('./');
		await expect(installHint(page)).toContainText('Open the menu');
		await installHint(page).getByRole('button', { name: 'Dismiss install hint' }).click();
		await expect(installHint(page)).toHaveCount(0);
		await page.reload();
		await expect(page.getByLabel('pCloud Public Link')).toBeVisible();
		await expect(installHint(page)).toHaveCount(0);
	});
});

test.describe('on iOS Safari', () => {
	test.use({ userAgent: IOS_SAFARI_UA });

	test('explains Add to Home Screen, but not once launched from the home screen', async ({ page }) => {
		await mockPcloud(page);
		await page.goto('./');
		await expect(installHint(page)).toContainText('Add to Home Screen');

		await page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
		await page.reload();
		await expect(page.getByLabel('pCloud Public Link')).toBeVisible();
		await expect(installHint(page)).toHaveCount(0);
	});
});
