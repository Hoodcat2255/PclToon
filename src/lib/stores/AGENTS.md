<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-10-03 -->

# stores

## Purpose
Global client state implemented with Svelte 5 runes in `.svelte.js` modules, persisted to IndexedDB (saved links) and `localStorage` (preferences).

## Key Files
| File | Description |
|------|-------------|
| `theme.svelte.js` | `theme` object: `value` (`'dark'` or `''`), `init()` (stored value or `prefers-color-scheme`), `toggle()` (persists `'dark'` or `'light'` to `localStorage['theme']`; a legacy `''` means follow the OS); storage access is try/catch-guarded |
| `install.svelte.js` | `install` object for add-to-home-screen: `mode` (`'prompt'` when a deferred `beforeinstallprompt` exists, `'ios'` / `'firefox-android'` for a menu hint, `''` when running standalone, dismissed or nothing applies), `init()` (picks up `window.__installPrompt` from `app.html`, listens for `beforeinstallprompt` / `appinstalled` once), `prompt()`, `dismiss()` (persists `localStorage['install_hint_dismissed']`) |
| `reading-mode.svelte.js` | `readingMode` object: `init()`, `get(code)` (`'vertical'` default \| `'paged'`), `toggle(code)`; per-series map in `localStorage['reading_modes']` |
| `history.svelte.js` | Saved links, `history` object (imported as `recent` in `+page.svelte`): `items` (all `{ code, name, addedAt, lastAccess, lastPath?, lastName? }`, newest access first, no cap), `init()` (returns the load promise; migrates legacy `localStorage['recent_links']` into IndexedDB — newer `lastAccess` wins, key removed only after success), `get(code)`, async `add` / `setLast` / `remove` (each awaits `init()` so early calls are not lost), `requestPersistence()` (call from explicit user actions only; skips when already persisted). Writes go through `linksDb.update` (read-merge-write in one transaction) so another tab's `lastPath` is not clobbered. Falls back to `localStorage['recent_links']` if IndexedDB cannot open |

## For AI Agents

### Working In This Directory
- Pattern: module-scoped `let x = $state(...)` plus an exported object with getters and methods. Reassign the whole value (`items = [...]`) rather than mutating, to match existing code.
- Files must keep the `.svelte.js` extension or runes will not compile.
- `init()` must be called from `onMount` (`theme` in `+layout.svelte`, `history` in `+page.svelte`); guard `window` access for prerender.
- Wrap every `localStorage` access in try/catch (blocked storage throws).
- Calling store methods inside an `$effect` subscribes the effect to `items`; use `untrack` when only writing.
- Store `$state.snapshot(...)` values in IndexedDB — reactive proxies throw `DataCloneError`.
- Persistent data app-wide: IndexedDB `pcltoon`/`links` (saved links); `localStorage` `theme`, `reading_modes`, `install_hint_dismissed`, `bookmark_{code}_{folderId}` (`recent_links` only as legacy/fallback). Bookmarks are written by `ImageViewer`, not a store.
- iOS Safari may clear site data (IndexedDB included) after ~7 days without use unless the app was added to the home screen (unverified; general knowledge). Recommend installing the PWA.

### Testing Requirements
- `tests/e2e/saved-links.spec.js` covers the saved-links store; manual: toggle theme and reload.

## Dependencies

### External
- `svelte` 5 runes

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
