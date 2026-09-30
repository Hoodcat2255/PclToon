<!-- Generated: 2026-09-30 | Updated: 2026-10-01 -->

# pcltoon

## Purpose
PclToon is a comic/webtoon reader for image folders shared via pCloud public links, with a vertical-scroll mode (webtoon) and a horizontal page-flip mode (book), chosen per series. It is a pure client-side SPA built with SvelteKit + `adapter-static`; there is no backend — the browser calls the pCloud Public API (`api.pcloud.com`) directly. It is deployed to GitHub Pages under the `/PclToon` base path.

## Key Files
| File | Description |
|------|-------------|
| `package.json` | npm scripts (`dev`/`build`/`preview`/`test`/`test:e2e`) and devDependencies. No runtime dependencies |
| `svelte.config.js` | `adapter-static` config (`build/` output, `index.html` fallback, `strict: true`); sets `paths.base = '/PclToon'` when `NODE_ENV=production` |
| `vite.config.js` | `tailwindcss()` + `sveltekit()` plugins; dev server ignores `.claude/**`/`.omc/**`; vitest `test.include` (`src/**/*.test.js`) |
| `playwright.config.js` | E2E config: Pixel 7 viewport, builds with `NODE_ENV=production` and serves `vite preview` at `http://localhost:4173/PclToon/` |
| `jsconfig.json` | Extends `.svelte-kit/tsconfig.json`; JS only (`checkJs: false`) |
| `.npmrc` | `engine-strict=true` |
| `.gitignore` | Ignores `node_modules`, `/.svelte-kit`, `/build`, `.env*`, etc. |
| `README.md` | Default `sv create` template README (no project-specific content) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/` | Application source (see `src/AGENTS.md`) |
| `docs/` | Reverse-engineered design docs 05–10, in Korean (see `docs/AGENTS.md`) |
| `static/` | Copied verbatim to the site root: `manifest.webmanifest`, `favicon.svg`, `icon-192/512.png`, `apple-touch-icon.png`, `robots.txt`. Do not put docs (incl. AGENTS.md) here — they would be deployed |
| `tests/` | Playwright E2E tests with a mocked pCloud API (see `tests/AGENTS.md`) |
| `.github/` | GitHub Pages deploy workflow (see `.github/AGENTS.md`) |

Generated/tooling directories (not documented, git-ignored): `node_modules/`, `.svelte-kit/` (SvelteKit sync output), `build/` (build output), `.omc/` (OMC runtime state; only `.omc/skills/` may be committed), `.serena/` (legacy, unused).

## For AI Agents

### Working In This Directory
- **JavaScript (ESM) only.** Do not add TypeScript files.
- Use Svelte 5 **runes** (`$state`, `$derived`, `$props`, `$effect`). Do not introduce legacy `writable` stores or `export let` props.
- Static deployment: no server-only features (`+page.server.js`, `+server.js`, form actions, server `load`). `src/routes/+layout.js` pins `prerender = true`, `ssr = false`.
- Internal links/asset paths must respect the production base path `/PclToon` (use `base` from `$app/paths`). It is case-sensitive (see commit a156a14).
- Style with Tailwind CSS v4 utility classes and the `dark:` variant.

### Testing Requirements
- `npm test` — vitest unit tests for pure helpers (`src/lib/*.test.js`).
- `npm run test:e2e` — Playwright mobile E2E against the production build with pCloud mocked (first run may need `npx playwright install chromium`).
- `npm run build` must succeed (`strict: true` fails the build on prerender errors).
- The mock cannot prove real pCloud behaviour (CORS, thumbnail response shape); spot-check with a real public link via `npm run dev`.

### Common Patterns
- **The URL is the source of truth for navigation**: `?code=<code>&p=<folderid>/<folderid>&view=list` (see `src/lib/nav.js`). Navigate with `goto`, never with local view state.
- All pCloud API calls live in `src/lib/pcloud.js`.
- Global state lives in `src/lib/stores/*.svelte.js` as module-scoped `$state` exposed through getter objects.
- Browser persistence: saved links live in IndexedDB (`pcltoon`/`links`, via `src/lib/db.js`); preferences and reading positions in `localStorage` (`theme`, `reading_modes`, `bookmark_{code}_{folderId}` = `{ i, f }` page index + fraction; `recent_links` only as a legacy/fallback key). Wrap every storage access in try/catch.

## Dependencies

### External
- `@sveltejs/kit` ^2.48 / `svelte` ^5.43 — framework (runes)
- `@sveltejs/adapter-static` ^3 — static site output
- `tailwindcss` / `@tailwindcss/vite` ^4.1 — styling
- `vite` ^7.2 — build tool / dev server
- `vitest` / `@playwright/test` — unit / E2E tests
- pCloud Public API (`showpublink`, `getpublinkdownload`, `getpubthumblink`) — the only runtime external dependency

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
