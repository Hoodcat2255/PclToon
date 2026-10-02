<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-10-03 -->

# src

## Purpose
SvelteKit application source root: HTML shell, global CSS, routes, and `$lib` modules.

## Key Files
| File | Description |
|------|-------------|
| `app.html` | HTML shell template (`%sveltekit.head%` / `%sveltekit.body%`, `data-sveltekit-preload-data="hover"`). An inline script stashes an early `beforeinstallprompt` in `window.__installPrompt` for `stores/install.svelte.js` |
| `service-worker.js` | SvelteKit service worker (auto-registered at `${base}/service-worker.js`, scope `/PclToon/`). Precaches `build` + `files` + `prerendered` into `pcltoon-${version}`, activates immediately (`skipWaiting`) and deletes older caches, serves those paths cache-first (the shell `${base}/` covers every `?code=…` URL), offline navigations fall back to the shell. Ignores non-GET and cross-origin requests, so pCloud API calls and images always hit the network and are never cached |
| `app.css` | `@import 'tailwindcss'` plus `--bg-primary` / `--text-primary` CSS variables with a `.dark` override |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `routes/` | SvelteKit routes — a single-page app (see `routes/AGENTS.md`) |
| `lib/` | API client, components, and stores imported via `$lib` (see `lib/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Dark mode is class-based: `+layout.svelte` applies `dark` to the root `<div class={theme.value}>`. When touching theming, confirm Tailwind's `dark:` variant still keys off this class.
- `app.html` holds the only viewport meta (pinch-zoom allowed — do not add `maximum-scale`/`user-scalable`) plus the favicon, apple-touch-icon and manifest links (`%sveltekit.assets%` resolves the `/PclToon` base).

### Testing Requirements
- `npm run build` passes; toggle light/dark in `npm run dev`.

### Common Patterns
- Keep global CSS minimal; style components with Tailwind utilities.

## Dependencies

### External
- `tailwindcss` v4 (CSS `@import` style, no config file)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
