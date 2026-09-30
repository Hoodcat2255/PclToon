<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# routes

## Purpose
SvelteKit routes. The whole app is one route (`/`); navigation between input → folder list → image viewer is in-memory view state inside `+page.svelte`, not URL routing.

## Key Files
| File | Description |
|------|-------------|
| `+layout.js` | `prerender = true`, `ssr = false` — static, client-only rendering |
| `+layout.svelte` | Imports `app.css`, calls `theme.init()` on mount, sets `<title>PclToon</title>` and no-zoom viewport, wraps children in `<div class={theme.value}>` for dark mode |
| `+page.svelte` | App controller: owns view state (`currentView`: `'input' \| 'list' \| 'viewer'`), `code`, `rootData`, `currentFolder`, `folders`, `images`, `breadcrumb`; handles link submit, folder drill-down, back navigation, prev/next episode, keyboard shortcuts, recent-links list |

## For AI Agents

### Working In This Directory
- `breadcrumb` entries are `{ name, data }` for the root (full `showpublink` response) or `{ name, folder }` for subfolders. Contents come from `data.metadata.contents` or `folder.contents` — `showpublink` returns the whole tree, so drilling down makes no extra API calls.
- View selection rule: folder with images → `viewer`; folder with only subfolders → `list`. `handleBack()` returns from `viewer` to `list` first if the folder also has subfolders.
- Episode prev/next uses `siblingFolders` (parent's subfolders, natural-sorted) and replaces the last breadcrumb entry before calling `handleFolderSelect`.
- Keyboard: `Escape`/`Backspace` = back, `Home`/`End` = scroll top/bottom in viewer; ignored while focus is in `INPUT`/`TEXTAREA` or on the input view.
- The browser back button / URL are not wired to view state; a reload returns to the input view.
- `ImageViewer` does its fetching in `onMount`, so switching episodes relies on the `{#if}` block re-creating the component — keep that in mind if refactoring into a keyed/persistent component.
- Errors thrown by `handleLinkSubmit` propagate to `LinkInput`, which displays them. Clicking a recent-link item calls `handleLinkSubmit` directly, so errors there are not shown in the UI.

### Testing Requirements
- Manual: submit a link, drill into folders, back navigation, prev/next episode, keyboard shortcuts, recent-links reopen.
- `npm run build` must pass (prerender).

### Common Patterns
- Runes: `$state`, `$derived`, `$derived.by`, `$props`; callback props (`onSubmit`, `onSelect`, `onBack`, `onPrevEpisode`) instead of component events.
- Natural sort via `localeCompare(..., { numeric: true, sensitivity: 'base' })`.

## Dependencies

### Internal
- `$lib/pcloud.js` — `extractCode`, `fetchPublicLink`, `classifyContents`
- `$lib/stores/history.svelte.js`, `$lib/stores/theme.svelte.js`
- `$lib/components/*` — `Header`, `LinkInput`, `EpisodeList`, `ImageViewer`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
