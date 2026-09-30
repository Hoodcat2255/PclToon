<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# tests

## Purpose
Playwright end-to-end tests that drive the production build on a mobile viewport (Pixel 7) with the pCloud API and image host fully mocked.

## Key Files
| File | Description |
|------|-------------|
| `e2e/mock-pcloud.js` | `mockPcloud(page, { delayForFile, failFiles })` routes `api.pcloud.com` (`showpublink`, `getpublinkdownload`, `getpubthumblink`) and a fake image host serving SVGs; returns a `calls` log. `TREE` fixture: Ep 1 (known dimensions → thumbnails), Ep 2 (no dimensions), Ep 10 (natural sort) |
| `e2e/reader.spec.js` | URL navigation, browser/header back, reload restore, progressive loading, episode swap, header auto-hide, bookmark restore, thumbnails, failed-page retry, recent resume/remove, mobile basics (viewport, input attrs, 44px targets, manifest) |

## For AI Agents

### Working In This Directory
- The app runs under `/PclToon/`; navigate with relative URLs (`page.goto('./?code=…')`), not `/`.
- Add fixture folders/images to `TREE` rather than ad-hoc routes so every test shares one fake API.
- Unit tests for pure helpers live next to the code in `src/lib/*.test.js` (vitest), not here.

### Testing Requirements
- `npm run test:e2e` (builds, starts `vite preview` on port 4173, runs all specs).

## Dependencies

### External
- `@playwright/test`
