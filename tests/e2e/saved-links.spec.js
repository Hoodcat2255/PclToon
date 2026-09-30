import { test, expect } from '@playwright/test';
import { mockPcloud, CODE } from './mock-pcloud.js';

const savedHeading = (page) => page.getByRole('heading', { name: /^Saved links/ });
const savedItem = (page, name) => page.getByRole('button', { name: new RegExp(`^${name}\\b`) });

/** Records currently in the IndexedDB `links` store. */
function idbLinks(page) {
	return page.evaluate(
		() =>
			new Promise((resolve, reject) => {
				const open = indexedDB.open('pcltoon');
				open.onerror = () => reject(open.error);
				open.onsuccess = () => {
					const request = open.result.transaction('links').objectStore('links').getAll();
					request.onsuccess = () => {
						open.result.close();
						resolve(request.result);
					};
					request.onerror = () => reject(request.error);
				};
			})
	);
}

async function pasteLink(page, code) {
	await page.goto('./');
	await page.getByLabel('pCloud Public Link').fill(`https://e.pcloud.link/publink/show?code=${code}`);
	await page.getByRole('button', { name: 'Open' }).click();
	await expect(page).toHaveURL(new RegExp(`code=${code}`));
}

test('a pasted link is stored in IndexedDB and survives reloads and new tabs', async ({ page, context }) => {
	await mockPcloud(page);
	await pasteLink(page, CODE);
	await page.getByRole('button', { name: 'Go back' }).click();
	await expect(savedHeading(page)).toContainText('(1)');
	await expect(savedItem(page, 'Test Comic')).toBeVisible();

	await expect.poll(async () => (await idbLinks(page)).map((link) => link.code)).toEqual([CODE]);
	expect(await page.evaluate(() => localStorage.getItem('recent_links'))).toBeNull();

	await page.reload();
	await expect(savedItem(page, 'Test Comic')).toBeVisible();

	const other = await context.newPage();
	await mockPcloud(other);
	await other.goto('./');
	await expect(savedItem(other, 'Test Comic')).toBeVisible();
	await savedItem(other, 'Test Comic').click();
	await expect(other).toHaveURL(new RegExp(`code=${CODE}`));
});

test('keeps every opened link, not just the last ten', async ({ page }) => {
	await mockPcloud(page);
	for (let n = 1; n <= 12; n++) {
		await page.goto(`./?code=EXTRA${n}`);
		await expect(page.getByAltText('Page 1', { exact: true })).toBeVisible();
	}
	await page.goto('./');
	await expect(savedHeading(page)).toContainText('(12)');
	// Newest access first.
	await expect(page.locator('ul li button span.truncate').first()).toHaveText('Extra 12');

	await page.reload();
	await expect(savedHeading(page)).toContainText('(12)');
	expect(await idbLinks(page)).toHaveLength(12);
});

test('links saved by the old localStorage list are migrated once', async ({ page }) => {
	await mockPcloud(page);
	await page.addInitScript((code) => {
		if (sessionStorage.getItem('seeded')) return;
		sessionStorage.setItem('seeded', '1');
		localStorage.setItem(
			'recent_links',
			JSON.stringify([{ code, name: 'Test Comic', lastAccess: 1700000000000, lastPath: [11], lastName: 'Ep 2' }])
		);
	}, CODE);
	await page.goto('./');
	await expect(savedItem(page, 'Test Comic')).toContainText('Continue: Ep 2');
	await expect.poll(() => page.evaluate(() => localStorage.getItem('recent_links'))).toBeNull();
	const [record] = await idbLinks(page);
	expect(record).toMatchObject({ code: CODE, lastPath: [11], lastName: 'Ep 2', addedAt: 1700000000000 });

	await savedItem(page, 'Test Comic').click();
	await expect(page).toHaveURL(new RegExp(`p=11$`));
});

test('removing a link is permanent', async ({ page }) => {
	await mockPcloud(page);
	await pasteLink(page, CODE);
	await page.goto('./');
	await page.getByRole('button', { name: 'Remove Test Comic from saved links' }).click();
	await expect(savedHeading(page)).toHaveCount(0);
	await expect.poll(async () => (await idbLinks(page)).length).toBe(0);

	await page.reload();
	await expect(page.getByLabel('pCloud Public Link')).toBeVisible();
	await expect(savedHeading(page)).toHaveCount(0);
});

test('without IndexedDB the list still works through localStorage', async ({ page }) => {
	await page.addInitScript(() => {
		IDBFactory.prototype.open = () => {
			throw new DOMException('blocked for test', 'InvalidStateError');
		};
	});
	await mockPcloud(page);
	await pasteLink(page, CODE);
	await page.goto('./');
	await expect(savedItem(page, 'Test Comic')).toBeVisible();
	const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('recent_links')));
	expect(stored.map((link) => link.code)).toEqual([CODE]);

	await page.reload();
	await expect(savedItem(page, 'Test Comic')).toBeVisible();
});

test('opening a link in a stale tab keeps progress saved by another tab', async ({ page, context }) => {
	await mockPcloud(page);
	await pasteLink(page, CODE);
	await page.goto('./');
	await expect(savedItem(page, 'Test Comic')).toBeVisible();

	// Another tab reads Ep 2; this tab still holds the old in-memory list.
	const other = await context.newPage();
	await mockPcloud(other);
	await other.goto(`./?code=${CODE}&p=11`);
	await expect(other.getByAltText('Page 1', { exact: true })).toBeVisible();
	await expect.poll(async () => (await idbLinks(page))[0]?.lastPath).toEqual([11]);

	await savedItem(page, 'Test Comic').click();
	await expect(page).toHaveURL(new RegExp(`code=${CODE}$`));
	await expect.poll(async () => (await idbLinks(page))[0]?.lastAccess).toBeGreaterThan(0);
	const [record] = await idbLinks(page);
	expect(record.lastPath).toEqual([11]);
	expect(record.lastName).toBe('Ep 2');
});

test('migration keeps the newer copy when a link exists in both stores', async ({ page }) => {
	await mockPcloud(page);
	await pasteLink(page, CODE);
	await page.goto('./');
	await expect(savedItem(page, 'Test Comic')).toBeVisible();

	// An older legacy entry must not overwrite the newer IndexedDB record...
	await page.evaluate((code) => {
		localStorage.setItem('recent_links', JSON.stringify([{ code, name: 'Old name', lastAccess: 1 }]));
	}, CODE);
	await page.reload();
	await expect(savedItem(page, 'Test Comic')).toBeVisible();
	expect((await idbLinks(page))[0].name).toBe('Test Comic');

	// ...but a newer one (written in localStorage-fallback mode) wins.
	await page.evaluate((code) => {
		localStorage.setItem(
			'recent_links',
			JSON.stringify([{ code, name: 'Test Comic', lastAccess: Date.now() + 60000, lastPath: [12], lastName: 'Ep 10' }])
		);
	}, CODE);
	await page.reload();
	await expect(savedItem(page, 'Test Comic')).toContainText('Continue: Ep 10');
	expect((await idbLinks(page))[0].lastPath).toEqual([12]);
});
