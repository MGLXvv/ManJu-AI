# Frontend quality gates

These scripts are intentionally dependency-free and run on Windows and Linux with the Node version pinned in `package.json`.

## Local commands

```bash
pnpm check:static
pnpm typecheck
pnpm test
pnpm build:verify
pnpm test:e2e:mock
```

`pnpm check:quality` runs the static checks, type check, full Vitest suite, production build, build report, and build budget validation.

## Source asset budgets

`check-source-assets.mjs` scans `src/assets` and `public` before compilation. New images, fonts, audio, and video files must remain within the limits in `build-budget.config.mjs`.

The two existing login PNG files are temporary tracked exemptions rather than unlimited exclusions. Their maximum size cannot increase, and their recompression is tracked by Issue #17.

## Build budgets and reports

`report-build.mjs` writes:

- `artifacts/build/build-report.json`
- `artifacts/build/build-report.md`

`check-build-budget.mjs` validates individual JS, CSS, image, font, and media files, plus aggregate JavaScript, CSS, asset, and `dist` sizes.

Update a budget only when the increase is intentional and documented in the pull request. Do not raise a limit merely to make CI pass.

## Source hygiene

`check-source-hygiene.mjs` rejects production-source occurrences of:

- `debugger;`
- `console.log`, `console.debug`, or `console.trace`
- `@ts-nocheck`
- static imports of the large login background PNG files

Operational tools under `tools/` may log progress; this check applies only to `src/`.

## CI caching

The frontend workflow caches the pnpm store and Playwright Chromium download. The two Required Job names remain unchanged:

- `Static checks, types, tests, build`
- `Playwright Mock main flow`
