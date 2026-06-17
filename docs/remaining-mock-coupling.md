# Remaining Mock Coupling

## Purpose

This file records the mock-layer dependencies that are still intentionally reused inside generation mock resolvers.

These are transitional couplings inside the mock implementation only.
Pages and stores should already be decoupled from these older mock helpers.

## Current Allowed Transitional Couplings

### `script.mock-resolver.ts`

- `generateMockScript`
- `optimizeMockScript`
- Source: `src/features/editor/scriptGenerationState.ts`
- Note: page and service callers no longer depend on these helpers directly; they are only reused by mock task settlement.

### `storyboard.mock-resolver.ts`

- `storyboardApi.generateShotImage`
- `storyboardApi.upscaleShotImage`
- `optimizeMockStoryboardPrompt`
- `shouldMockStoryboardGenerateFail`
- Sources:
  - `src/api/storyboard.api.ts`
  - `src/features/editor/storyboardGenerationState.ts`
- Note: page and store layers no longer call these helpers directly for generation flows. They remain in the mock resolver for result generation and mock-failure behavior.

### `settingAsset.mock-resolver.ts`

- `settingApi.generateAssetImage`
- `hasAnyMockFailureToken`
- Sources:
  - `src/api/setting.api.ts`
  - `src/features/shared/mockFailureState.ts`
- Note: the settings page and `settingAssets` store no longer depend on these helpers directly for asset generation.

## Follow-Up Cleanup Direction

1. `storyboardApi` should eventually retain only storyboard data operations, reference-image operations, upload operations, and edit operations.
2. `settingApi` should eventually retain only setting asset data operations.
3. Mock image generation and mock-failure rules can be consolidated into dedicated mock helper files under the generation mock resolver layer.
4. `video` and `dubbing` resolvers should be added only after product and backend rules are confirmed.

## Non-Goals

- This document does not require immediate refactoring.
- This document exists to prevent the false assumption that every legacy mock dependency has already been fully removed.
