<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# routes

## Purpose
SvelteKit routes. The app is a single route (`/`); which screen is shown (input → folder list → viewer) is derived from the URL query, so browser back/forward, reload and shared links all work.

## Key Files
| File | Description |
|------|-------------|
| `+layout.js` | `prerender = true`, `ssr = false` — static, client-only |
| `+layout.svelte` | Imports `app.css`, `theme.init()` on mount, `<title>`, `theme-color` meta following the in-app theme, wraps children in `<div class={theme.value}>` for dark mode |
| `+page.svelte` | App controller (see below) |

### `+page.svelte`
- `route = parseSearch(page.url.searchParams)`; everything else (`resolved` nodes, `content`, `currentView`, siblings, `lastReadId`) is `$derived` from `route` + the cached tree `root = { code, data }`.
- Effects: fetch the tree when the URL's code is not loaded (errors → `loadError` on the input view); redirect stale paths to the deepest existing folder; record last-read path; auto-hide the header while scrolling down in the viewer.
- Navigation goes through `navigate(target, { replace, fromParent })` → `goto`. `page.state.fromParent` marks entries pushed from their parent, so header back uses `history.back()` only then; otherwise (deep link, resume) it replaces the entry with the parent URL. Episode Prev/Next replaces the entry.
- A folder with both images and subfolders opens its viewer; back from there switches to its list (`view=list`).
- Keyboard: `Escape`/`Backspace` back, `Home`/`End` in viewer.

## For AI Agents

### Working In This Directory
- Do not add local view state; change the URL and let the derived values follow.
- `showpublink` returns the full tree, so folder navigation never refetches.
- `ImageViewer` must stay inside `{#key}` on the folder so episode changes re-mount it.

### Testing Requirements
- `npm run test:e2e` covers navigation, back behaviour, reload, resume and errors.

### Common Patterns
- Runes only; callback props; natural sort via `classifyContents`.

## Dependencies

### Internal
- `$lib/nav.js`, `$lib/pcloud.js`, `$lib/stores/*`, `$lib/components/*`

### External
- `$app/state` (`page`), `$app/navigation` (`goto`), `$app/paths` (`base`)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
