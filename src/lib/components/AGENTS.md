<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# components

## Purpose
Svelte 5 components used by `src/routes/+page.svelte`. Navigation state lives in the page (URL); components receive data and callbacks via `$props()`.

## Key Files
| File | Description |
|------|-------------|
| `Header.svelte` | Sticky top bar: back button, truncated title, optional `actions` snippet (the viewer's reading-mode toggle), `ThemeToggle`. `hidden` slides it out (`-translate-y-full`) for the viewer's auto-hide |
| `ThemeToggle.svelte` | Sun/moon button calling `theme.toggle()` |
| `LinkInput.svelte` | Link form with mobile keyboard hints (`inputmode="url"`, no autocapitalize/autocorrect — codes are case-sensitive) and a Paste button when `navigator.clipboard.readText` exists; awaits `onSubmit(url)` and shows `err.message` with Retry |
| `EpisodeList.svelte` | Folder buttons keyed by `folderid`; `lastReadId` highlights the folder on the last-read path |
| `ImageViewer.svelte` | Episode reader (see below) |
| `PageFlipper.svelte` | Book-style layout used by `ImageViewer` when `mode === 'paged'`: fixed full-screen horizontal scroll-snap strip (native swipe), one page per screen (`object-contain`), outer-third taps turn pages, middle tap toggles the header, Arrow/Page/Home/End keys, bottom range slider + `N / total` while the header is visible, end slide with `EpisodeNav`. `pending` target lets rapid taps/keys queue; slider jumps are `quiet` (no `onPageTurn`, chrome stays up). Pages within ±2 load eagerly. `touch-pan-x touch-pinch-zoom` keeps pinch zoom |
| `EpisodeNav.svelte` | Prev/Next episode buttons shared by the vertical layout and the paged end slide |
| `PageStatus.svelte` | Pending placeholder / "failed to load" + Retry overlay for a page slot, shared by both layouts (Retry stops propagation so it never toggles the header or turns the page) |
| `FastScroller.svelte` | Right-edge drag handle for jumping through an episode: shown while `pinned` (the header is visible — tap toggles both), otherwise appears on scroll and fades after 2 s idle (then `pointer-events: none` so it never blocks page taps), `touch-action: none` + pointer capture while dragging, shows `pageLabel()` (e.g. `7 / 40`) in a bubble. Used inside `ImageViewer`; `onDragStart` cancels a pending bookmark restore |

### `ImageViewer.svelte`
- Renders one slot per image immediately and fills each as its URL arrives (`fetchImageUrls` → `onItem`). Slots reserve `aspect-ratio` from metadata when `width`/`height` exist, else a `60dvh` placeholder.
- Per-page states: `pending` → `ready` → `loaded` | `error`. An `<img>` error refetches the original once (expired link) by re-creating the element; a failed page keeps its slot with a Retry button so numbering stays stable.
- Bookmark: position is tracked every animation frame while scrolling and written on a 300 ms throttle, `visibilitychange` (hidden), `pagehide` and unmount (Svelte runs teardown after the DOM is detached, so teardown writes the tracked value). Restore waits until pages `0..i` have layout (dimensions or loaded), loads those eagerly, runs one frame after SvelteKit's navigation scroll reset, is cancelled by user touch/wheel, and after 15 s jumps to the best estimate. Saving is paused while a restore is pending.
- Thumbnail target width is the rendered page width (≤ `max-w-3xl`) × `devicePixelRatio`.
- `onTap` fires on taps in the page column (header toggle). `FastScroller` sits outside that column so dragging it never toggles the header; there is no loading counter badge (removed at the user's request).
- The parent wraps it in `{#key}` per folder; `images` is treated as fixed for an instance.
- `mode` prop (`'vertical' | 'paged'`) switches layouts in place: `pages` (resolved URLs, statuses) are shared, so switching never refetches. `switchLayout` carries the page over (vertical → paged: page at the viewport top; paged → vertical: restore target `{ i, f: 0 }`). In paged mode the bookmark is `{ i, f: 0 }`, saved on every page change.
- The bookmark is read during script init, not `onMount`, because child components (`PageFlipper`) mount first and need their start page.
- URLs are fetched starting at the bookmarked page (`fetchImageUrls({ startAt })`).

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
