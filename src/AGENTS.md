<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# src

## Purpose
SvelteKit application source root: HTML shell, global CSS, routes, and `$lib` modules.

## Key Files
| File | Description |
|------|-------------|
| `app.html` | HTML shell template (`%sveltekit.head%` / `%sveltekit.body%`, `data-sveltekit-preload-data="hover"`) |
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
