# Frontend Handoff Summary

## Architecture

- Vue 3 + Vite + Pinia
- API layer switches between mock and HTTP with `VITE_API_MODE`
- shared HTTP client uses `VITE_API_BASE_URL || '/api'`
- generation services own task creation and polling
- store and page layers should only manage local UI state and entity replacement

## Important Directories

- `src/api/modules`
- `src/services/generation`
- `src/features/editor`
- `src/stores`
- `src/pages/editor/steps`
- `docs`

## Main Workflow

Primary editor flow:

`script -> settings -> storyboard -> video -> dubbing -> complete`

## Key Conventions

1. AI generation should use generation task APIs through service layers
2. page/store code should not manually create generation tasks
3. result validation belongs in `src/services/generation/generationResultGuards.ts`
4. batch eligibility and batch-boundary rules belong in feature-state files
5. hidden and soft-delete behavior belongs in visibility/persist state files
6. top-level `src/api/*.api.ts` files should remain compatibility re-exports when a module has been standardized

## Current API Layer State

- `auth`, `editor`, `generation`, `project`, `resource`, `storyboard`, `voice`, `setting`, `system`, `asset`, and `scriptTemplate` all have mock/http module structure
- generation task APIs are the preferred backend entrypoint for AI generation capabilities
- storyboard direct generation endpoints remain compatibility-only

## Suggested Onboarding Order For A New Developer

1. read `docs/generation-task-contract.md`
2. read `docs/generation-entrypoint-strategy.md`
3. read `docs/backend-runtime-config.md`
4. inspect `src/services/generation`
5. inspect `src/stores/storyboard.ts`, `src/stores/editor.ts`, and `src/stores/settingAssets.ts`
6. inspect the editor step pages under `src/pages/editor/steps`
