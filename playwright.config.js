import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	reporter: 'list',
	use: {
		...devices['Pixel 7'],
		// Preview serves the production build under the GitHub Pages base path.
		baseURL: 'http://localhost:4173/PclToon/'
	},
	webServer: {
		command: 'NODE_ENV=production npm run build && npm run preview -- --port 4173 --strictPort',
		url: 'http://localhost:4173/PclToon/',
		reuseExistingServer: !process.env.CI
	}
});
