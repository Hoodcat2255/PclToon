import { test, expect } from '@playwright/test';
import { mockPcloud, CODE } from './mock-pcloud.js';

const EP1 = 10;
const EP2 = 11;
const header = (page) => page.locator('header');
// Episode buttons may carry a trailing "Last read" badge.
const episode = (page, name) => page.getByRole('button', { name: new RegExp(`^${name}( Last read)?$`) });
const pageImage = (page, n) => page.getByAltText(`Page ${n}`, { exact: true });

async function openLink(page) {
	await page.goto('./');
	await page.getByLabel('pCloud Public Link').fill(`https://e.pcloud.link/publink/show?code=${CODE}`);
	await page.getByRole('button', { name: 'Open' }).click();
	await expect(page).toHaveURL(new RegExp(`\\?code=${CODE}$`));
}

test('opens a link, lists episodes in natural order and reflects state in the URL', async ({ page }) => {
	await mockPcloud(page);
	await openLink(page);
	const names = await page.locator('ul button span.truncate').allTextContents();
	expect(names).toEqual(['Ep 1', 'Ep 2', 'Ep 10']);

	await episode(page, 'Ep 1').click();
	await expect(page).toHaveURL(new RegExp(`p=${EP1}$`));
	await expect(pageImage(page, 1)).toBeVisible();
});

test('browser back returns to the previous in-app view instead of leaving', async ({ page }) => {
	await mockPcloud(page);
	await openLink(page);
	await episode(page, 'Ep 1').click();
	await expect(pageImage(page, 1)).toBeVisible();

	await page.goBack();
	await expect(page).toHaveURL(new RegExp(`\\?code=${CODE}$`));
	await expect(episode(page, 'Ep 2')).toBeVisible();

	await page.goBack();
	await expect(page.getByLabel('pCloud Public Link')).toBeVisible();
});

test('reload restores the viewer from the URL', async ({ page }) => {
	await mockPcloud(page);
	await page.goto(`./?code=${CODE}&p=${EP1}`);
	await expect(pageImage(page, 1)).toBeVisible();
	await page.reload();
	await expect(pageImage(page, 1)).toBeVisible();
	await expect(header(page)).toContainText('Ep 1');
});

test('header back on a deep link steps up without leaving the app', async ({ page }) => {
	await mockPcloud(page);
	await page.goto(`./?code=${CODE}&p=${EP1}`);
	await expect(pageImage(page, 1)).toBeVisible();

	await page.getByRole('button', { name: 'Go back' }).click();
	await expect(page).toHaveURL(new RegExp(`\\?code=${CODE}$`));
	await expect(episode(page, 'Ep 1')).toBeVisible();
});

test('invalid or unknown codes show an error on the input view', async ({ page }) => {
	await mockPcloud(page);
	await page.goto('./?code=bad%3Ccode');
	await expect(page.getByRole('alert')).toHaveText('Invalid pCloud link format');

	await page.goto('./?code=unknown1');
	await expect(page.getByRole('alert')).toHaveText('Invalid link code.');
	await expect(page.getByLabel('pCloud Public Link')).toBeVisible();
});

test('pages appear progressively before every URL is resolved', async ({ page }) => {
	// Batches after the first are slow; the first pages must render meanwhile.
	const calls = await mockPcloud(page, { delayForFile: (id) => (id % 100 > 5 ? 3000 : 0) });
	await page.goto(`./?code=${CODE}&p=${EP2}`);
	await expect(pageImage(page, 1)).toBeVisible();
	expect(calls.download.length).toBeLessThan(12);
	await expect(page.getByText('Page 12')).toBeVisible();
});

test('next episode swaps in the new images and replaces the history entry', async ({ page }) => {
	await mockPcloud(page);
	await openLink(page);
	await episode(page, 'Ep 1').click();
	await expect(pageImage(page, 1)).toBeVisible();

	await page.getByRole('button', { name: 'Next' }).click();
	await expect(page).toHaveURL(new RegExp(`p=${EP2}$`));
	await expect(header(page)).toContainText('Ep 2');
	await expect(page.locator(`img[src$="/${EP2 * 100 + 1}.svg"]`)).toBeVisible();

	await page.goBack();
	await expect(page).toHaveURL(new RegExp(`\\?code=${CODE}$`));
});

test('header hides on scroll down, shows on scroll up and toggles on tap', async ({ page }) => {
	await mockPcloud(page);
	await page.goto(`./?code=${CODE}&p=${EP1}`);
	await expect(pageImage(page, 3)).toBeAttached();

	await page.mouse.wheel(0, 600);
	await expect(header(page)).toHaveClass(/-translate-y-full/);
	await page.mouse.wheel(0, -200);
	await expect(header(page)).not.toHaveClass(/-translate-y-full/);

	// Tap in place: locator.click() would auto-scroll first and trip the scroll-up rule.
	await page.touchscreen.tap(200, 400);
	await expect(header(page)).toHaveClass(/-translate-y-full/);
	await page.touchscreen.tap(200, 400);
	await expect(header(page)).not.toHaveClass(/-translate-y-full/);
});

for (const [label, folder] of [
	['known dimensions', EP1],
	['unknown dimensions', EP2]
]) {
	test(`reading position is restored (${label})`, async ({ page }) => {
		await mockPcloud(page);
		await page.goto(`./?code=${CODE}&p=${folder}`);
		const target = pageImage(page, 6);
		await expect(pageImage(page, 1)).toBeVisible();
		await target.scrollIntoViewIfNeeded();
		await page.evaluate(() => window.scrollBy(0, 10));
		const before = await page.evaluate(() => window.scrollY);
		await page.waitForTimeout(500); // throttled save

		await page.reload();
		await expect
			.poll(() => page.evaluate(() => window.scrollY), { timeout: 10000 })
			.toBeGreaterThan(before - 50);
		const after = await page.evaluate(() => window.scrollY);
		expect(Math.abs(after - before)).toBeLessThan(50);
	});
}

test('reading position is saved when leaving the episode in-app', async ({ page }) => {
	await mockPcloud(page);
	await openLink(page);
	await episode(page, 'Ep 1').click();
	await pageImage(page, 6).scrollIntoViewIfNeeded();
	const before = await page.evaluate(() => window.scrollY);

	// If scrolling hid the header, tap to bring it back like a reader would.
	if (await header(page).evaluate((el) => el.className.includes('-translate-y-full'))) {
		await page.touchscreen.tap(200, 400);
	}
	await expect(header(page)).not.toHaveClass(/-translate-y-full/);
	await expect.poll(async () => (await header(page).boundingBox()).y).toBe(0);
	await page.getByRole('button', { name: 'Go back' }).click();
	await expect(episode(page, 'Ep 1')).toBeVisible();
	await episode(page, 'Ep 1').click();
	await expect
		.poll(() => page.evaluate(() => window.scrollY), { timeout: 10000 })
		.toBeGreaterThan(before - 50);
});

test('an expired image URL is resolved again once', async ({ page }) => {
	const expiredId = EP2 * 100 + 1;
	const calls = await mockPcloud(page, { expireOnce: [expiredId] });
	await page.goto(`./?code=${CODE}&p=${EP2}`);
	await expect(pageImage(page, 1)).toBeVisible();
	await expect.poll(() => pageImage(page, 1).evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
	expect(calls.download.filter((id) => id === expiredId)).toHaveLength(2);
});

test('thumbnails are requested only for wide images with known size', async ({ page }) => {
	const calls = await mockPcloud(page);
	await page.goto(`./?code=${CODE}&p=${EP1}`);
	await expect(pageImage(page, 1)).toBeVisible();
	expect(calls.thumb.length).toBeGreaterThan(0);
	for (const { size } of calls.thumb) {
		const [w, h] = size.split('x').map(Number);
		expect(w % 4).toBe(0);
		expect(h).toBe(1024);
	}

	await page.goto(`./?code=${CODE}&p=${EP2}`);
	await expect(pageImage(page, 1)).toBeVisible();
	expect(calls.thumb.every(({ fileid }) => Math.floor(fileid / 100) === EP1)).toBe(true);
});

test('a failed page stays in place with a retry button', async ({ page }) => {
	await mockPcloud(page, { failFiles: [EP2 * 100 + 2] });
	await page.goto(`./?code=${CODE}&p=${EP2}`);
	await expect(page.getByText('Page 2 failed to load')).toBeVisible();
	await expect(pageImage(page, 3)).toBeVisible();
	await expect(page.locator('[data-page="1"]').getByRole('button', { name: 'Retry' })).toBeVisible();
});

test('recent list resumes the last episode and can remove entries', async ({ page }) => {
	await mockPcloud(page);
	await page.goto(`./?code=${CODE}&p=${EP2}`);
	await expect(pageImage(page, 1)).toBeVisible();

	await page.goto('./');
	const resume = page.getByRole('button', { name: /^Test Comic/ });
	await expect(resume).toContainText('Continue: Ep 2');
	await resume.click();
	await expect(page).toHaveURL(new RegExp(`p=${EP2}$`));

	await page.getByRole('button', { name: 'Go back' }).click();
	await expect(episode(page, 'Ep 2')).toContainText('Last read');

	await page.goto('./');
	await page.getByRole('button', { name: 'Remove Test Comic from saved links' }).click();
	await expect(page.getByText('Saved links')).toHaveCount(0);
});

test('mobile basics: zoom allowed, url keyboard, 44px targets, manifest', async ({ page }) => {
	await mockPcloud(page);
	await page.goto('./');
	const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
	expect(viewport).not.toMatch(/user-scalable|maximum-scale/);
	expect(await page.locator('meta[name="viewport"]').count()).toBe(1);

	const input = page.getByLabel('pCloud Public Link');
	await expect(input).toHaveAttribute('inputmode', 'url');
	await expect(input).toHaveAttribute('autocapitalize', 'off');

	const toggle = await page.getByRole('button', { name: 'Toggle theme' }).boundingBox();
	expect(toggle.width).toBeGreaterThanOrEqual(44);
	expect(toggle.height).toBeGreaterThanOrEqual(44);

	const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
	const manifest = await (await page.request.get(new URL(manifestHref, page.url()).href)).json();
	expect(manifest.display).toBe('standalone');
	expect(manifest.icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
	await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1);
});

test('choosing light theme sticks even when the OS prefers dark', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	await mockPcloud(page);
	await page.goto('./');
	const root = page.locator('body > div > div').first();
	await expect(root).toHaveClass('dark');

	await page.getByRole('button', { name: 'Toggle theme' }).click();
	await expect(root).not.toHaveClass('dark');
	await page.reload();
	await expect(page.getByLabel('pCloud Public Link')).toBeVisible();
	await expect(root).not.toHaveClass('dark');
});

test('fast scroller follows the header and dragging it jumps through the episode', async ({ page }) => {
	await mockPcloud(page);
	await page.goto(`./?code=${CODE}&p=${EP1}`);
	await expect(pageImage(page, 12)).toBeAttached();
	const scroller = page.getByTestId('fast-scroller');
	const hiddenHeader = /-translate-y-full/;

	// Shown together with the header on open.
	await expect(header(page)).not.toHaveClass(hiddenHeader);
	await expect(scroller).toHaveCSS('pointer-events', 'auto');

	// Scrolling down hides the header; the handle fades once scrolling stops.
	await page.mouse.wheel(0, 600);
	await expect(header(page)).toHaveClass(hiddenHeader);
	await expect(scroller).toHaveCSS('pointer-events', 'none', { timeout: 5000 });

	// A tap brings both back, another tap hides both.
	await page.touchscreen.tap(200, 400);
	await expect(header(page)).not.toHaveClass(hiddenHeader);
	await expect(scroller).toHaveCSS('pointer-events', 'auto');
	await page.touchscreen.tap(200, 400);
	await expect(header(page)).toHaveClass(hiddenHeader);
	await expect(scroller).toHaveCSS('pointer-events', 'none');

	// Drag with real touch events: Playwright's mouse on an emulated mobile page
	// gets pointercancel mid-drag, which a finger on a phone does not.
	await page.touchscreen.tap(200, 400);
	await expect(scroller).toHaveCSS('pointer-events', 'auto');
	const box = await scroller.boundingBox();
	const x = box.x + box.width / 2;
	let y = box.y + box.height / 2;
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
	for (; y < page.viewportSize().height; y += 80) {
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
	}
	await expect(scroller).toContainText(/\d+ \/ 12/);
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

	const { scrollY, max } = await page.evaluate(() => ({
		scrollY: window.scrollY,
		max: document.documentElement.scrollHeight - window.innerHeight
	}));
	expect(scrollY).toBeGreaterThan(max - 5);
	await expect(scroller).not.toContainText('/');
});

test('no loading counter badge is shown', async ({ page }) => {
	await mockPcloud(page, { delayForFile: () => 1500 });
	await page.goto(`./?code=${CODE}&p=${EP1}`);
	await expect(page.getByText('Page 1', { exact: true })).toBeVisible();
	await expect(page.getByText(/^\d+ \/ 12$/)).toHaveCount(0);
});
