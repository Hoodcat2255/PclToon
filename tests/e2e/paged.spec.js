import { test, expect } from '@playwright/test';
import { mockPcloud, CODE } from './mock-pcloud.js';

const EP1 = 10;
const EP2 = 11;
const hiddenHeader = /-translate-y-full/;
const header = (page) => page.locator('header');
const flipper = (page) => page.getByTestId('page-flipper');
const toPaged = (page) => page.getByRole('button', { name: 'Switch to page mode' });
const toScroll = (page) => page.getByRole('button', { name: 'Switch to scroll mode' });

/** 1-based page currently snapped into view. */
const currentPage = (page) =>
	flipper(page).evaluate((el) => Math.round(el.scrollLeft / el.clientWidth) + 1);

async function expectPage(page, n) {
	await expect.poll(() => currentPage(page)).toBe(n);
}

async function openPaged(page, folder = EP1) {
	await page.goto(`./?code=${CODE}&p=${folder}`);
	await toPaged(page).click();
	await expect(flipper(page)).toBeVisible();
}

/** Resolves once the page strip has stopped scrolling for a moment. */
async function settle(page) {
	if (!(await flipper(page).count())) return;
	await flipper(page).evaluate(
		(el) =>
			new Promise((resolve) => {
				let timer;
				const quiet = () => {
					clearTimeout(timer);
					timer = setTimeout(() => {
						el.removeEventListener('scroll', quiet);
						resolve();
					}, 200);
				};
				el.addEventListener('scroll', quiet);
				quiet();
			})
	);
}

async function showChrome(page) {
	// A smooth page turn still in flight would hide the header again.
	await settle(page);
	if (await header(page).evaluate((el) => el.className.includes('-translate-y-full'))) {
		await page.touchscreen.tap(206, 420);
	}
	await expect(header(page)).not.toHaveClass(hiddenHeader);
	// Wait for the slide-in to finish: clicking a button mid-transition makes
	// Playwright scroll the page to reach it, which a finger tap never does.
	await expect.poll(async () => (await header(page).boundingBox()).y).toBe(0);
}

test('mode toggle appears only in the viewer and persists per series', async ({ page }) => {
	await mockPcloud(page);
	await page.goto(`./?code=${CODE}`);
	await expect(page.getByRole('button', { name: 'Ep 1', exact: true })).toBeVisible();
	await expect(toPaged(page)).toHaveCount(0);

	await page.getByRole('button', { name: 'Ep 1', exact: true }).click();
	await expect(page.getByAltText('Page 1', { exact: true })).toBeVisible();
	const box = await toPaged(page).boundingBox();
	expect(box.width).toBeGreaterThanOrEqual(44);
	expect(box.height).toBeGreaterThanOrEqual(44);

	await toPaged(page).click();
	await expect(flipper(page)).toBeVisible();
	await expect(toScroll(page)).toBeVisible();
	expect(await page.evaluate(() => JSON.parse(localStorage.getItem('reading_modes')))).toEqual({
		[CODE]: 'paged'
	});

	await page.reload();
	await expect(flipper(page)).toBeVisible();
	// Another series keeps the default.
	expect(await page.evaluate(() => JSON.parse(localStorage.getItem('reading_modes')).other)).toBeUndefined();
});

test('tap zones turn pages, the middle toggles the header, turning hides it', async ({ page }) => {
	await mockPcloud(page);
	await openPaged(page);
	await expectPage(page, 1);

	await page.touchscreen.tap(390, 420);
	await expectPage(page, 2);
	await expect(header(page)).toHaveClass(hiddenHeader);

	await page.touchscreen.tap(390, 420);
	await expectPage(page, 3);
	await page.touchscreen.tap(20, 420);
	await expectPage(page, 2);

	await page.touchscreen.tap(206, 420);
	await expect(header(page)).not.toHaveClass(hiddenHeader);
	await expect(page.getByRole('slider', { name: 'Page' })).toBeVisible();
	await expect(page.getByText('2 / 12', { exact: true })).toBeVisible();
	await page.touchscreen.tap(206, 420);
	await expect(header(page)).toHaveClass(hiddenHeader);
	await expect(page.getByRole('slider', { name: 'Page' })).toHaveCount(0);
});

test('swiping turns the page', async ({ page }) => {
	await mockPcloud(page);
	await openPaged(page);
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 360, y: 420 }] });
	for (let x = 330; x >= 60; x -= 30) {
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: 420 }] });
	}
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
	await expectPage(page, 2);
});

test('keyboard navigates pages', async ({ page }) => {
	await mockPcloud(page);
	await openPaged(page);
	await page.keyboard.press('ArrowRight');
	await expectPage(page, 2);
	await page.keyboard.press('End');
	await expectPage(page, 12);
	await page.keyboard.press('ArrowLeft');
	await expectPage(page, 11);
	await page.keyboard.press('Home');
	await expectPage(page, 1);
});

test('the slider jumps pages and keeps the chrome up', async ({ page }) => {
	await mockPcloud(page);
	await openPaged(page);
	await showChrome(page);
	await page.getByRole('slider', { name: 'Page' }).fill('8');
	await expectPage(page, 8);
	await expect(page.getByText('8 / 12', { exact: true })).toBeVisible();
	await expect(header(page)).not.toHaveClass(hiddenHeader);
	// Wait for the slide-in to finish: clicking a button mid-transition makes
	// Playwright scroll the page to reach it, which a finger tap never does.
	await expect.poll(async () => (await header(page).boundingBox()).y).toBe(0);
});

test('switching modes keeps the reading position both ways', async ({ page }) => {
	await mockPcloud(page);
	await page.goto(`./?code=${CODE}&p=${EP1}`);
	// Put page 6 at the top of the viewport (scrollIntoView would centre it).
	await expect(page.getByAltText('Page 6', { exact: true })).toBeAttached();
	await page
		.getByAltText('Page 6', { exact: true })
		.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 20));
	await showChrome(page);
	await toPaged(page).click();
	await expectPage(page, 6);

	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await expectPage(page, 9);
	await showChrome(page);
	await toScroll(page).click();
	await expect(flipper(page)).toHaveCount(0);

	const page9 = page.getByAltText('Page 9', { exact: true });
	await expect
		.poll(async () => {
			const top = await page9.evaluate((el) => el.getBoundingClientRect().top);
			return Math.abs(top) < 60;
		})
		.toBe(true);
});

test('paged position is restored after reload', async ({ page }) => {
	await mockPcloud(page);
	await openPaged(page);
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await expectPage(page, 5);
	await page.reload();
	await expect(flipper(page)).toBeVisible();
	await expectPage(page, 5);
});

test('the end slide offers episode navigation', async ({ page }) => {
	await mockPcloud(page);
	await openPaged(page);
	await page.keyboard.press('End');
	await expectPage(page, 12);
	await page.keyboard.press('ArrowRight');
	await expect(page.getByText('End of episode')).toBeInViewport();

	await flipper(page).getByRole('button', { name: 'Next' }).click();
	await expect(page).toHaveURL(new RegExp(`p=${EP2}$`));
	await expect(flipper(page)).toBeVisible();
	await expectPage(page, 1);
});

test('switching modes reuses resolved image URLs', async ({ page }) => {
	const calls = await mockPcloud(page);
	await page.goto(`./?code=${CODE}&p=${EP2}`);
	await expect.poll(() => calls.download.length).toBe(12);

	await toPaged(page).click();
	await expect(flipper(page)).toBeVisible();
	await showChrome(page);
	await toScroll(page).click();
	await expect(page.getByAltText('Page 1', { exact: true })).toBeAttached();
	expect(calls.download).toHaveLength(12);
	expect(calls.showpublink).toBe(1);
});

test('rotating the screen keeps the current page', async ({ page }) => {
	await mockPcloud(page);
	await openPaged(page);
	await page.keyboard.press('End');
	await page.keyboard.press('ArrowLeft');
	await expectPage(page, 11);
	await settle(page);

	await page.setViewportSize({ width: 915, height: 412 });
	await expectPage(page, 11);
	await page.setViewportSize({ width: 412, height: 915 });
	await expectPage(page, 11);
});

test('switching back to scroll mode keeps the header visible', async ({ page }) => {
	await mockPcloud(page);
	await openPaged(page);
	await page.keyboard.press('End');
	await expectPage(page, 12);
	await showChrome(page);
	await toScroll(page).click();
	await expect(page.getByAltText('Page 12', { exact: true })).toBeInViewport();
	await expect(header(page)).not.toHaveClass(hiddenHeader);
});
