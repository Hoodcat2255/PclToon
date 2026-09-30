<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-30 | Updated: 2026-09-30 -->

# static

## Purpose
Static files copied verbatim into the root of `build/`.

## Key Files
| File | Description |
|------|-------------|
| `robots.txt` | Allows all crawlers (empty `Disallow:`) |

## For AI Agents

### Working In This Directory
- In production these are served at `/PclToon/<file>`. Prefix references with `base` from `$app/paths`.
- Assets that should go through the bundler (imported images, etc.) belong in `src/lib/assets/`.

### Testing Requirements
- After `npm run build`, confirm the file appears in `build/`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
