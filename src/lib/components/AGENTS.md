<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# components

## Purpose
Svelte 5 components used by `src/routes/+page.svelte`. Navigation state lives in the page (URL); components receive data and callbacks via `$props()`.

## Key Files
| File | Description |
|------|-------------|
| `Header.svelte` | Sticky top bar: back button, truncated title, `ThemeToggle`. `hidden` slides it out (`-translate-y-full`) for the viewer's auto-hide |
| `ThemeToggle.svelte` | Sun/moon button calling `theme.toggle()` |
| `LinkInput.svelte` | Link form with mobile keyboard hints (`inputmode="url"`, no autocapitalize/autocorrect — codes are case-sensitive) and a Paste button when `navigator.clipboard.readText` exists; awaits `onSubmit(url)` and shows `err.message` with Retry |
| `EpisodeList.svelte` | Folder buttons keyed by `folderid`; `lastReadId` highlights the folder on the last-read path |
| `ImageViewer.svelte` | Episode reader (see below) |
| `FastScroller.svelte` | Right-edge drag handle for jumping through an episode: appears on scroll, fades after 2 s idle (then `pointer-events: none` so it never blocks page taps), `touch-action: none` + pointer capture while dragging, shows `pageLabel()` (e.g. `7 / 40`) in a bubble. Used inside `ImageViewer`; `onDragStart` cancels a pending bookmark restore |

### `ImageViewer.svelte`
- Renders one slot per image immediately and fills each as its URL arrives (`fetchImageUrls` → `onItem`). Slots reserve `aspect-ratio` from metadata when `width`/`height` exist, else a `60dvh` placeholder.
- Per-page states: `pending` → `ready` → `loaded` | `error`. An `<img>` error refetches the original once (expired link) by re-creating the element; a failed page keeps its slot with a Retry button so numbering stays stable.
- Bookmark: position is tracked every animation frame while scrolling and written on a 300 ms throttle, `visibilitychange` (hidden), `pagehide` and unmount (Svelte runs teardown after the DOM is detached, so teardown writes the tracked value). Restore waits until pages `0..i` have layout (dimensions or loaded), loads those eagerly, runs one frame after SvelteKit's navigation scroll reset, is cancelled by user touch/wheel, and after 15 s jumps to the best estimate. Saving is paused while a restore is pending.
- Thumbnail target width is the rendered page width (≤ `max-w-3xl`) × `devicePixelRatio`.
- `onTap` fires on taps in the page column (header toggle). `FastScroller` sits outside that column so dragging it never toggles the header; the loading counter badge is bottom-left to stay clear of it.
- The parent wraps it in `{#key}` per folder; `images` is treated as fixed for an instance.

## For AI Agents

### Working In This Directory
- Props via `$props()`; events as callback props (`onX`).
- Register listeners in a synchronous `onMount` and return the cleanup — an `async` `onMount` would drop the cleanup.
- Touch targets ≥ 44px (`p-3` around a `w-5` icon). Pair every colour with a `dark:` variant; the viewer background is always black.
- UI text is English.

### Testing Requirements
- Covered by `tests/e2e/reader.spec.js` (progressive load, retry, expired URL, bookmark restore, header toggle, touch-target size).

## Dependencies

### Internal
- `$lib/pcloud.js`, `$lib/bookmark.js` (`ImageViewer`); `$lib/stores/theme.svelte.js` (`ThemeToggle`)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
