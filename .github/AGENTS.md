<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# .github

## Purpose
GitHub Actions CI/CD configuration. `workflows/` contains a single GitHub Pages deploy workflow.

## Key Files
| File | Description |
|------|-------------|
| `workflows/deploy.yml` | On push to `main` or manual dispatch: Node 24 (vitest 5 needs ≥ 22.12; `.npmrc` has `engine-strict=true`) → `npm ci` → `NODE_ENV=production npm run build` → upload `build/` as Pages artifact → deploy with `deploy-pages@v4` |

## For AI Agents

### Working In This Directory
- `NODE_ENV: production` must stay in the build step env so `svelte.config.js` applies the `/PclToon` base path; removing it breaks asset paths on the deployed site.
- The upload path `build` must match the adapter's `pages`/`assets` in `svelte.config.js`.
- There is no test/lint step. If adding one, put it in the `build` job before `Build`.
- A push to `main` deploys to production — change workflows carefully.

### Testing Requirements
- Validate via the GitHub Actions run (reproduce locally with `NODE_ENV=production npm run build`).

## Dependencies

### External
- `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
