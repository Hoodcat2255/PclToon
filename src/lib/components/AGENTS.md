<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# components

## Purpose
Presentational Svelte 5 components used by `src/routes/+page.svelte`. State lives in the page; components receive data and callbacks via `$props()`.

## Key Files
| File | Description |
|------|-------------|
| `Header.svelte` | Sticky top bar: optional back button (`showBack`, `onBack`), truncated `title`, and `ThemeToggle` |
| `ThemeToggle.svelte` | Sun/moon button calling `theme.toggle()` from the theme store |
| `LinkInput.svelte` | Link form; awaits `onSubmit(url)`, manages `isLoading` and shows `err.message` with a Retry button |
| `EpisodeList.svelte` | List of folder buttons keyed by `folderid`; calls `onSelect(folder)`; shows "No folders found" when empty |
| `ImageViewer.svelte` | Fetches image URLs on mount via `batchFetchImageUrls` (progress shown), renders lazy-loaded `<img>` column (`max-w-3xl`), loaded-count badge, Prev/Next episode buttons, and scroll-position bookmark per folder |

## For AI Agents

### Working In This Directory
- Props via `let { ... } = $props()`; events as callback props (`onX`). Do not use `createEventDispatcher` or `export let`.
- `ImageViewer` bookmarks: reads `bookmark_{code}_{folderId}` on mount and restores scroll after 100 ms; saves on `beforeunload` and in the `onMount` cleanup. Note that `onMount(async …)` returns a Promise, so Svelte does **not** run the returned cleanup — unmount-time save and listener removal currently do not happen. Fix with a separate sync `onMount`/`$effect` cleanup if touching this.
- The `{#each imageUrls as url (url)}` key assumes unique URLs.
- All UI text is English; keep new strings consistent.
- Style with Tailwind utilities and pair every color with a `dark:` variant (the viewer background is always black).

### Testing Requirements
- Manual in `npm run dev`: light/dark, loading spinner/progress, error + Retry, prev/next disabled states, scroll restore.

### Common Patterns
- Inline SVG icons (no icon library).
- Button styles: `rounded-lg`, `transition-colors`, `hover:` + `dark:hover:` pairs.

## Dependencies

### Internal
- `$lib/pcloud.js` (`ImageViewer`)
- `$lib/stores/theme.svelte.js` (`ThemeToggle`)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
