// Renders static/icon.svg into the PNG icons and favicon.svg with the
// Chromium that Playwright already installs (`npm run icons`).
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const STATIC = new URL('../static/', import.meta.url);
// Corner radius of the non-maskable icons, relative to the icon size.
const CORNER = 112 / 512;

const source = await readFile(new URL('icon.svg', STATIC), 'utf8');
// Same artwork with rounded corners, for browser tabs and "any" icons.
const rounded = source.replace('<rect id="background"', `<rect id="background" rx="${512 * CORNER}"`);
if (rounded === source) throw new Error('icon.svg: <rect id="background"> not found');

const targets = [
	{ file: 'icon-192.png', size: 192, svg: rounded, transparent: true },
	{ file: 'icon-512.png', size: 512, svg: rounded, transparent: true },
	// Launchers apply their own mask; iOS rounds the touch icon itself.
	{ file: 'icon-maskable-512.png', size: 512, svg: source, transparent: false },
	{ file: 'apple-touch-icon.png', size: 180, svg: source, transparent: false }
];

const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	for (const { file, size, svg, transparent } of targets) {
		await page.setViewportSize({ width: size, height: size });
		await page.setContent(
			`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
		);
		await page.screenshot({ path: new URL(file, STATIC).pathname, omitBackground: transparent });
		console.log(`static/${file} (${size}x${size})`);
	}
} finally {
	await browser.close();
}

await writeFile(new URL('favicon.svg', STATIC), rounded);
console.log('static/favicon.svg');
