<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# lib

## Purpose
Code imported through the `$lib` alias: the pCloud API client, URL/navigation and bookmark helpers, UI components, and global stores.

## Key Files
| File | Description |
|------|-------------|
| `pcloud.js` | pCloud Public API client and content helpers (see below) |
| `nav.js` | URL ⇄ view state: `parseSearch`, `buildSearch` (`?code=…&p=id/id&view=list`), `resolvePath` (walks the showpublink tree, reports stale paths), `defaultView` (list vs viewer rule) |
| `bookmark.js` | Reading position as `{ i, f }` (page index + fraction into it): `computePosition`, `positionToScroll`, `parseBookmark`, `loadBookmark`/`saveBookmark` (`localStorage['bookmark_{code}_{folderId}']`) |
| `*.test.js` | vitest unit tests for the three modules above |
| `index.js` | Template placeholder; exports nothing |

### `pcloud.js` exports
| Export | Description |
|--------|-------------|
| `extractCode(url)` | Code from a share URL (`code=` param or trailing segment) or a bare alphanumeric code; throws `Invalid pCloud link format` otherwise |
| `fetchPublicLink(code)` | `showpublink` — returns the whole folder tree recursively; throws on HTTP error, `data.error`, missing `metadata` |
| `getImageUrl(code, fileid)` | `getpublinkdownload` → original image URL |
| `getDisplayUrl(code, image, size)` | `getpubthumblink` when `size` is given, falling back to the original on any failure |
| `thumbSize(image, targetWidth)` | `'WxH'` or null. Thumbnail only when `width`/`height` are known, the original is wider than the target, and the scaled height fits the API's 1024px limit (long webtoon strips keep originals) |
| `fetchOrder(count, startAt)` | Page indices from `startAt`, wrapping around |
| `fetchImageUrls(images, code, { concurrency, targetWidth, startAt, onItem, signal })` | Worker pool (`concurrency` in flight, `fetchOrder` from the resume page) calling `onItem(index, url \| null)` as each arrives; stops when `signal.cancelled` |
| `classifyContents(contents)` / `isImageFile` / `naturalSort` | Split and natural-sort folders/images (jpg, jpeg, png, gif, webp, bmp) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `components/` | Svelte UI components (see `components/AGENTS.md`) |
| `stores/` | Rune-based global state with `localStorage` persistence (see `stores/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Keep every pCloud network call in `pcloud.js`; build query strings with `URLSearchParams`.
- Keep `nav.js`, `bookmark.js` and the pure parts of `pcloud.js` free of DOM/Svelte imports so vitest can run them in Node.
- pCloud docs: image `width`/`height` in metadata are optional — every code path must work without them. The `getpubthumblink` response shape (`hosts`/`path`) is assumed to match `getpublinkdownload`; the fallback to originals covers it if not.
- Download URLs are short-lived; never persist them.

### Testing Requirements
- `npm test` for helpers; `npm run test:e2e` for behaviour that depends on the browser.

## Dependencies

### External
- Browser `fetch`; pCloud Public API (unauthenticated)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
