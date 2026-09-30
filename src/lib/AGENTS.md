<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# lib

## Purpose
Code imported through the `$lib` alias: the pCloud API client, UI components, global stores, and bundled assets.

## Key Files
| File | Description |
|------|-------------|
| `pcloud.js` | pCloud Public API client and content helpers (see below) |
| `index.js` | Default placeholder from the template; exports nothing |

### `pcloud.js` exports
| Export | Description |
|--------|-------------|
| `extractCode(url)` | Extracts the public-link `code` from a URL (`code=` param or trailing path segment) or accepts a bare alphanumeric code; throws `Invalid pCloud link format` otherwise |
| `fetchPublicLink(code)` | `GET https://api.pcloud.com/showpublink?code=…`; throws on HTTP error, `data.error`, or missing `metadata` |
| `getImageUrl(code, fileid)` | `GET getpublinkdownload` with `referrerPolicy: 'no-referrer'`; returns `https://{hosts[0]}{path}` |
| `batchFetchImageUrls(images, code, concurrency = 5, onProgress)` | Resolves image URLs in batches of `concurrency`; failed items are dropped (`null` filtered out) |
| `classifyContents(contents)` | Splits into natural-sorted `{ folders, images }` |
| `isImageFile(name)` | Extension check: jpg, jpeg, png, gif, webp, bmp |
| `naturalSort(a, b)` | Numeric-aware name comparator |
| `processContents(metadata)` | Wrapper over `classifyContents`; currently unused |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `components/` | Svelte UI components (see `components/AGENTS.md`) |
| `stores/` | Rune-based global state with `localStorage` persistence (see `stores/AGENTS.md`) |
| `assets/` | Bundled assets — only `favicon.svg`, currently not referenced anywhere |

## For AI Agents

### Working In This Directory
- Keep every network call to pCloud inside `pcloud.js`; components should not call `fetch` directly.
- `code` and `fileid` are interpolated into the query string without `encodeURIComponent`. `extractCode` restricts `code` to `[a-zA-Z0-9]+`, so preserve that constraint (or add encoding) if loosening parsing.
- Download URLs from `getpublinkdownload` are short-lived and host-specific; do not persist them.
- Because failed images are silently dropped by `batchFetchImageUrls`, page numbering (`alt="Page N"`) can shift when fetches fail.

### Testing Requirements
- `pcloud.js` is pure/fetch-based and is the best first candidate for unit tests (not yet set up — see `docs/08-TEST-STRATEGY.md`).
- Manual check with a real public link.

### Common Patterns
- Throw `Error` with a message for failures; callers surface `err.message`.

## Dependencies

### External
- Browser `fetch`; pCloud Public API (unauthenticated, CORS-enabled)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
