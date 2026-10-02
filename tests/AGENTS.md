<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# tests

## Purpose
Playwright end-to-end tests that drive the production build on a mobile viewport (Pixel 7) with the pCloud API and image host fully mocked.

## Key Files
| File | Description |
|------|-------------|
| `e2e/mock-pcloud.js` | `mockPcloud(page, { delayForFile, failFiles, expireOnce })`; codes `EXTRA<n>` return small extra series (`extraTree`) for multi-link tests; routes `api.pcloud.com` (`showpublink`, `getpublinkdownload`, `getpubthumblink`) and a fake image host serving SVGs; returns a `calls` log. `TREE` fixture: Ep 1 (known dimensions → thumbnails), Ep 2 (no dimensions), Ep 10 (natural sort) |
| `e2e/saved-links.spec.js` | Saved links in IndexedDB: reload/new-tab persistence, >10 links kept, legacy `recent_links` migration, permanent delete, localStorage fallback when `indexedDB.open` throws. `idbLinks(page)` reads the store directly |
| `e2e/paged.spec.js` | Paged (book) mode: toggle visibility/persistence, tap zones, swipe, keyboard, slider, mode-switch position carry-over, reload restore, last page reveals the bars (no end slide), no URL refetch on switch. `settle()` waits for smooth page turns; `showChrome()` waits for the header slide-in to finish |
| `e2e/pwa.spec.js` | Manifest icons fetched and PNG sizes checked against `sizes`, separate maskable icon, 180px touch icon; service worker scope `/PclToon/` and offline shell (opts in with `serviceWorkers: 'allow'`); install button via a synthetic `beforeinstallprompt` (also one fired before startup); Firefox Android / iOS UA hints, dismissal, hidden when `navigator.standalone` |
| `e2e/reader.spec.js` | URL navigation, browser/header back, reload restore, progressive loading, episode swap, header auto-hide, bookmark restore, thumbnails, failed-page retry, recent resume/remove, mobile basics (viewport, input attrs, 44px targets, manifest) |

## For AI Agents

### Working In This Directory
- `playwright.config.js` blocks service workers (`serviceWorkers: 'block'`) so a cached shell never bypasses per-test mocks; only `pwa.spec.js` allows them.
- The app runs under `/PclToon/`; navigate with relative URLs (`page.goto('./?code=…')`), not `/`.
- Add fixture folders/images to `TREE` rather than ad-hoc routes so every test shares one fake API.
- Drags on mobile-emulated pages: use CDP `Input.dispatchTouchEvent`. Playwright's `page.mouse` on an emulated mobile page gets `pointercancel` mid-drag, unlike a real finger.
- `locator.click()` auto-scrolls first, which trips the header auto-hide; use `page.touchscreen.tap(x, y)` for in-place taps, and tap to reveal a hidden header before clicking its buttons.
- Unit tests for pure helpers live next to the code in `src/lib/*.test.js` (vitest), not here.

### Testing Requirements
- `npm run test:e2e` (builds, starts `vite preview` on port 4173, runs all specs).

## Dependencies

### External
- `@playwright/test`
