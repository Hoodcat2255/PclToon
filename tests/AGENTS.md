<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# tests

## Purpose
Playwright end-to-end tests that drive the production build on a mobile viewport (Pixel 7) with the pCloud API and image host fully mocked.

## Key Files
| File | Description |
|------|-------------|
| `e2e/mock-pcloud.js` | `mockPcloud(page, { delayForFile, failFiles })` routes `api.pcloud.com` (`showpublink`, `getpublinkdownload`, `getpubthumblink`) and a fake image host serving SVGs; returns a `calls` log. `TREE` fixture: Ep 1 (known dimensions → thumbnails), Ep 2 (no dimensions), Ep 10 (natural sort) |
| `e2e/paged.spec.js` | Paged (book) mode: toggle visibility/persistence, tap zones, swipe, keyboard, slider, mode-switch position carry-over, reload restore, end-slide episode nav, no URL refetch on switch. `settle()` waits for smooth page turns; `showChrome()` waits for the header slide-in to finish |
| `e2e/reader.spec.js` | URL navigation, browser/header back, reload restore, progressive loading, episode swap, header auto-hide, bookmark restore, thumbnails, failed-page retry, recent resume/remove, mobile basics (viewport, input attrs, 44px targets, manifest) |

## For AI Agents

### Working In This Directory
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
