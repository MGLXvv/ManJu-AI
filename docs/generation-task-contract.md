# Generation Task Contract

## Scope

This document describes the current front-end generation task contract that is already stable in mock mode and ready to align with a backend implementation.

Confirmed task types:

- `script`
- `script_optimize`
- `storyboard`
- `storyboard_optimize`
- `storyboard_upscale`
- `setting_asset`

Pending product confirmation:

- `video`
- `dubbing`

## Task Model

Each generation task uses the same envelope:

```ts
interface GenerationTask {
  id: string
  projectId: string
  shotId?: string
  type: GenerationTaskType
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled'
  progress: number
  payload?: Record<string, unknown>
  result?: unknown
  errorMessage?: string
  createdAt: string
  updatedAt: string
}
```

## API Draft

### Create task

`POST /generation/tasks`

```ts
interface CreateGenerationTaskInput {
  projectId: string
  type: GenerationTaskType
  shotId?: string
  payload?: Record<string, unknown>
}
```

Returns the created `GenerationTask`.

### Query task

`GET /generation/tasks/:id`

Returns `GenerationTask | null`.

### List tasks by project

`GET /generation/tasks?projectId=...`

Returns `GenerationTask[]`.

### Cancel task

`POST /generation/tasks/:id/cancel`

Returns the updated `GenerationTask | null`.

### Retry task

`POST /generation/tasks/:id/retry`

Returns the updated `GenerationTask | null`.

## Payload Contract

### `script`

```ts
interface ScriptGeneratePayload {
  sourceText: string
  promptText: string
  modelId: string
}
```

### `script_optimize`

```ts
interface ScriptOptimizePayload {
  scriptText: string
  modelId: string
}
```

### `storyboard`

```ts
interface StoryboardGeneratePayload {
  shotId: string
  title: string
  prompt: string
  style: string
  ratio: '16:9' | '9:16'
  characters: StoryboardTag[]
  scenes: StoryboardTag[]
  props: StoryboardTag[]
  referenceImages: StoryboardReferenceImage[]
}
```

Note:

- The front-end mock currently carries `shot` for local mock reuse.
- A real backend contract should not require the full `shot` object if the backend can reconstruct it from `shotId` plus payload fields.

### `storyboard_optimize`

```ts
interface StoryboardOptimizePayload {
  prompt: string
  mode: 'active-shot' | 'insert-shot'
}
```

### `storyboard_upscale`

```ts
interface StoryboardUpscalePayload {
  shotId: string
  title: string
  imageUrl?: string
  prompt: string
  style: string
  ratio: '16:9' | '9:16'
}
```

Note:

- The front-end mock currently carries `shot` for local mock reuse.

### `setting_asset`

```ts
interface SettingAssetGeneratePayload {
  assetId: string
  type: 'character' | 'scene' | 'prop'
  name: string
  description: string
  prompt: string
}
```

Note:

- The front-end mock currently carries `asset` for local mock reuse.

## Result Contract

### `script`

```ts
interface ScriptGenerateResult {
  script: string
}
```

### `script_optimize`

```ts
interface ScriptOptimizeResult {
  script: string
}
```

### `storyboard`

```ts
interface StoryboardImageResult {
  shotId: string
  imageUrl: string
  shot: StoryboardShot
}
```

### `storyboard_optimize`

```ts
interface StoryboardPromptOptimizeResult {
  prompt: string
}
```

### `storyboard_upscale`

```ts
interface StoryboardUpscaleResult {
  shotId: string
  imageUrl: string
  shot: StoryboardShot
}
```

### `setting_asset`

```ts
interface SettingAssetImageResult {
  assetId: string
  imageUrl: string
  asset: SettingAsset
}
```

## Error Codes

Confirmed current generation errors:

- `SCRIPT_GENERATE_FAILED`
- `SCRIPT_OPTIMIZE_FAILED`
- `SETTING_IMAGE_GENERATE_FAILED`
- `STORYBOARD_GENERATE_FAILED`
- `STORYBOARD_OPTIMIZE_FAILED`
- `STORYBOARD_UPSCALE_FAILED`
- `STORYBOARD_UPSCALE_IMAGE_REQUIRED`

Pending future task errors:

- `VIDEO_GENERATE_FAILED`
- `VIDEO_OPTIMIZE_FAILED`
- `DUBBING_GENERATE_FAILED`

## Current Front-End Rules

- Store/page layers should not directly create or advance generation tasks.
- Service layers own task creation and waiting.
- Store layers own local UI state transitions such as `generating`, `failed`, and replacing updated entities.
- Result validation is centralized in `src/services/generation/generationResultGuards.ts`.
