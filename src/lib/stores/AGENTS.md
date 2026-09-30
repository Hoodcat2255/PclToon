<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# stores

## Purpose
Global client state implemented with Svelte 5 runes in `.svelte.js` modules, persisted to `localStorage`.

## Key Files
| File | Description |
|------|-------------|
| `theme.svelte.js` | `theme` object: `value` (`'dark'` or `''`), `init()` (stored value or `prefers-color-scheme`), `toggle()` (persists to `localStorage['theme']`) |
| `history.svelte.js` | `history` object: `items` (max 10 `{ code, name, lastAccess }`, most recent first), `init()`, `add(code, name)` (dedupes by code), `remove(code)` (currently unused); persisted to `localStorage['recent_links']` |

## For AI Agents

### Working In This Directory
- Pattern: module-scoped `let x = $state(...)` plus an exported object with getters and methods. Reassign the whole value (`items = [...]`) rather than mutating, to match existing code.
- Files must keep the `.svelte.js` extension or runes will not compile.
- `init()` must be called from `onMount` (`theme` in `+layout.svelte`, `history` in `+page.svelte`); guard `window` access for prerender.
- `history` wraps `localStorage` in try/catch; `theme` does not — `localStorage` failures (e.g. blocked storage) will throw there.
- `localStorage` keys in use app-wide: `theme`, `recent_links`, `bookmark_{code}_{folderId}` (the last one is written by `ImageViewer`, not a store).

### Testing Requirements
- Manual: toggle theme and reload; open several links and confirm order/limit of recent list.

## Dependencies

### External
- `svelte` 5 runes

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
