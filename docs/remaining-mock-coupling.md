# Remaining Mock Coupling

## Status

The generation mock resolver layer has been decoupled from editor feature helpers and legacy domain API entrypoints.

The following former dependencies have been removed:

- `script.mock-resolver.ts` no longer imports `generateMockScript` or `optimizeMockScript` from `src/features/editor/scriptGenerationState.ts`
- `storyboard.mock-resolver.ts` no longer imports `storyboardApi`, `optimizeMockStoryboardPrompt`, or `shouldMockStoryboardGenerateFail`
- `settingAsset.mock-resolver.ts` no longer imports `settingApi` or `hasAnyMockFailureToken`

Mock generation behavior is now implemented inside:

- `src/api/modules/generation/mock-resolvers/mockGeneration.helpers.ts`

The helper owns pure mock-only behavior for:

- script generation and optimization
- storyboard prompt optimization and failure-token checks
- storyboard image generation and upscale result construction
- setting asset image generation and failure-token checks
- mock result cloning required to avoid mutating editor state objects

## Current Dependency Boundary

The intended dependency direction is now:

```text
generation.mock
  -> mock-resolvers
    -> mockGeneration.helpers
      -> domain types and shared API enums
```

The generation mock resolver layer must not import from:

- `src/features/editor/*`
- root compatibility API files such as `src/api/storyboard.api.ts`
- other domain API implementations such as `storyboardMockApi` or `settingMockApi`

## Remaining Mock-Specific Constraints

The mock task payload currently still carries complete `shot` and `asset` objects for local settlement. This is intentional for front-end-only mode and is not a dependency on editor stores or pages.

Backend HTTP implementations should continue to treat those complete objects as optional transitional payload fields. The stable backend contract should prefer scalar identifiers and explicit input fields documented in `docs/generation-task-contract.md`.

## Maintenance Rules

1. Add new generation mock behavior to `mockGeneration.helpers.ts` or another generation-local helper.
2. Do not call a domain API from a generation mock resolver.
3. Do not import page, store, or editor feature state into the API module.
4. Keep failure-token behavior in the mock layer only.
5. Preserve the same result guards and task result shapes used by HTTP mode.
