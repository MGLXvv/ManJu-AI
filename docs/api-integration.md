# API Integration Notes

## Runtime Mode Switch

The project currently uses `VITE_API_MODE` to switch between local mock behavior and backend-oriented HTTP behavior.

- `VITE_API_MODE=mock`
  - uses mock API implementations
  - intended for local feature development and interaction testing
- `VITE_API_MODE=http`
  - uses HTTP API implementations
  - intended for backend integration

## API Module Structure

The current API layer follows a module split under `src/api/modules/*` for the migrated domains.

Typical structure:

- `*.api.ts`
  - stable import entry for callers
- `*.mock.ts`
  - mock implementation
- `*.http.ts`
  - backend HTTP implementation
- `*.types.ts`
  - module-local API contract types

Not every older domain has been fully migrated into `src/api/modules/*` yet.
Some transitional root-level API files still exist and are reused internally by mock resolvers.

## Generation Service Layer

The generation service layer lives under:

- `src/services/generation/`

Current stabilized services:

- `scriptGeneration.service.ts`
- `storyboardGeneration.service.ts`
- `storyboardPrompt.service.ts`
- `settingAssetGeneration.service.ts`
- `generationTaskRunner.ts`

Supporting files:

- `generationPayload.types.ts`
- `generationResult.types.ts`
- `generationResultGuards.ts`

## Responsibility Split

### Pages

Pages should only:

- trigger store actions
- show loading and error feedback
- avoid direct generation task creation

### Stores

Stores should only:

- locate local target entities
- apply local `generating` and `failed` status transitions
- replace local entities after service success

Stores should not:

- create generation tasks directly
- manually advance task progress
- call mock generation helpers directly

### Generation Services

Generation services own:

- task creation
- task polling and settlement wait
- payload construction
- result validation
- stable error throwing

### Generation Task APIs

Generation task APIs own:

- task creation
- task lookup
- task cancellation
- task retry
- task status persistence

## Generation Task Contract

The current backend-facing contract draft is documented in:

- `docs/generation-task-contract.md`

That file is the main reference for:

- task lifecycle endpoints
- task status enums
- task type enums
- stable payloads
- stable results
- stable error codes

## Current Stable Generation Types

Confirmed and already wired through the service boundary:

- `script`
- `script_optimize`
- `setting_asset`
- `storyboard`
- `storyboard_optimize`
- `storyboard_upscale`

## Why Video And Dubbing Are Deferred

`video` and `dubbing` are intentionally not being service-ified further yet because product rules are still not confirmed.

Open product questions include:

1. Whether video generation is image-driven only or audio-driven.
2. Whether dubbing happens before or after video generation.
3. Whether dubbing changes require video regeneration.
4. Whether lip sync is required.
5. Whether video and dubbing are per-shot or composed later.

Until those rules are confirmed, expanding video or dubbing service boundaries would risk rework.
