<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# pcltoon

## Purpose
PclToon is a vertical-scroll comic/webtoon reader for image folders shared via pCloud public links. It is a pure client-side SPA built with SvelteKit + `adapter-static`; there is no backend — the browser calls the pCloud Public API (`api.pcloud.com`) directly. It is deployed to GitHub Pages under the `/PclToon` base path.

## Key Files
| File | Description |
|------|-------------|
| `package.json` | npm scripts (`dev`/`build`/`preview`/`prepare`) and devDependencies. No runtime dependencies |
| `svelte.config.js` | `adapter-static` config (`build/` output, `index.html` fallback, `strict: true`); sets `paths.base = '/PclToon'` when `NODE_ENV=production` |
| `vite.config.js` | `tailwindcss()` + `sveltekit()` plugins; dev server ignores `.claude/**` in file watching |
| `jsconfig.json` | Extends `.svelte-kit/tsconfig.json`; JS only (`checkJs: false`) |
| `.npmrc` | `engine-strict=true` |
| `.gitignore` | Ignores `node_modules`, `/.svelte-kit`, `/build`, `.env*`, etc. |
| `README.md` | Default `sv create` template README (no project-specific content) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/` | Application source (see `src/AGENTS.md`) |
| `docs/` | Reverse-engineered design docs 05–10, in Korean (see `docs/AGENTS.md`) |
| `static/` | Files copied verbatim into the build (see `static/AGENTS.md`) |
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
- No test framework is installed (see `docs/08-TEST-STRATEGY.md`).
- At minimum, verify `npm run build` succeeds (`strict: true` fails the build on prerender errors).
- Verify UI manually via `npm run dev` with a real pCloud public link.

### Common Patterns
- All pCloud API calls live in `src/lib/pcloud.js`.
- Global state lives in `src/lib/stores/*.svelte.js` as module-scoped `$state` exposed through getter objects.
- Browser persistence uses `localStorage` only (`theme`, `recent_links`, `bookmark_{code}_{folderId}`).

## Dependencies

### External
- `@sveltejs/kit` ^2.48 / `svelte` ^5.43 — framework (runes)
- `@sveltejs/adapter-static` ^3 — static site output
- `tailwindcss` / `@tailwindcss/vite` ^4.1 — styling
- `vite` ^7.2 — build tool / dev server
- pCloud Public API (`showpublink`, `getpublinkdownload`) — the only runtime external dependency

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
