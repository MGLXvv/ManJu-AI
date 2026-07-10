# Backend Integration Checklist

## Runtime Mode

- Front-end defaults to `mock` mode unless `VITE_API_MODE=http` is set
- When `VITE_API_MODE=http`, standardized API modules use their HTTP implementations
- Backend base URL is controlled by `VITE_API_BASE_URL`
- If `VITE_API_BASE_URL` is missing, the HTTP client defaults to `/admin-api`
- Business module paths must not repeat the `/admin-api` gateway prefix

## Minimum Backend Startup Target

The recommended minimum backend startup target is:

- `GET /aidrama/projects`
- `POST /aidrama/projects`
- `GET /generation/tasks`
- `POST /generation/tasks`
- `GET /generation/tasks/:id`

After these are stable, continue with:

- editor draft APIs
- setting and voice APIs
- storyboard auxiliary APIs
- remaining management modules

## Project Resource APIs

The current front-end project module reserves the following routes:

- `GET /aidrama/projects`
- `GET /aidrama/projects/:id`
- `POST /aidrama/projects`
- `PUT /aidrama/projects/:id`
- `DELETE /aidrama/projects/:id`
- `POST /aidrama/projects/import`
- `GET /aidrama/projects/:id/export`

## Required Generation Task APIs

The current front-end expects the following backend endpoints:

- `POST /generation/tasks`
- `GET /generation/tasks/:id`
- `GET /generation/tasks?projectId=...`
- `POST /generation/tasks/:id/cancel`
- `POST /generation/tasks/:id/retry`

## Task Lifecycle Requirements

- Status flow: `queued -> running -> success | failed | cancelled`
- `progress` should remain within `0-100`
- Failed tasks must return `errorMessage`
- Successful tasks must return a type-compatible `result`
- `projectId`, `type`, `createdAt`, and `updatedAt` are required on stored tasks

## Front-End Result Guard Expectations

The front-end validates task results in `src/services/generation/generationResultGuards.ts`.

Backend responses must satisfy these minimum shapes:

- `script`: `result.script`
- `script_optimize`: `result.script`
- `setting_asset`: `result.imageUrl`, `result.asset`
- `storyboard`: `result.imageUrl`, `result.shot`
- `storyboard_optimize`: `result.prompt`
- `storyboard_upscale`: `result.imageUrl`, `result.shot`
- `video`: `result.videoUrl`, `result.shot`
- `video_optimize`: `result.value`
- `dubbing`: `result.cardId`, `result.lines`

If these fields are missing, the front-end will throw stable error codes such as:

- `SCRIPT_GENERATE_FAILED`
- `SCRIPT_OPTIMIZE_FAILED`
- `SETTING_IMAGE_GENERATE_FAILED`
- `STORYBOARD_GENERATE_FAILED`
- `STORYBOARD_OPTIMIZE_FAILED`
- `STORYBOARD_UPSCALE_FAILED`
- `VIDEO_GENERATE_FAILED`
- `VIDEO_OPTIMIZE_FAILED`
- `DUBBING_GENERATE_FAILED`

## Confirmed Task Types To Support

- `script`
- `script_optimize`
- `setting_asset`
- `storyboard`
- `storyboard_optimize`
- `storyboard_upscale`
- `video`
- `video_optimize`
- `dubbing`

## Recommended Generation Task Integration Order

1. `script`
2. `script_optimize`
3. `setting_asset`
4. `storyboard`
5. `storyboard_optimize`
6. `storyboard_upscale`
7. `video`
8. `video_optimize`
9. `dubbing`

## Generation Boundary Reminder

- Preferred backend entry for generation flows: `generation` task APIs
- `storyboard` module still exposes direct endpoints such as:
  - `POST /storyboard/shots/:id/generate-image`
  - `POST /storyboard/shots/:id/generate-video`
  - `POST /storyboard/shots/:id/upscale-image`
- These endpoints now overlap with generation-task flows at the front-end architecture level.
- Backend should implement generation task APIs first.
- The direct storyboard generation endpoints should be treated as legacy-compatible or optional endpoints.
- If they are implemented, they should internally delegate to the same generation pipeline rather than creating a second generation flow.

## Per-Type Backend Delivery Checklist

### `script`

- Accept `sourceText`, `promptText`, `modelId`
- Return `result.script`

### `script_optimize`

- Accept `scriptText`, `modelId`
- Return `result.script`

### `setting_asset`

- Accept `assetId`, `type`, `name`, `description`, `prompt`
- Return `result.assetId`, `result.imageUrl`, `result.asset`

### `storyboard`

- Accept `shotId`, `title`, `prompt`, `style`, `ratio`, `characters`, `scenes`, `props`, `referenceImages`
- Return `result.shotId`, `result.imageUrl`, `result.shot`

### `storyboard_optimize`

- Accept `prompt`, `mode`
- Return `result.prompt`

### `storyboard_upscale`

- Accept `shotId`, `title`, `imageUrl`, `prompt`, `style`, `ratio`
- Return `result.shotId`, `result.imageUrl`, `result.shot`

### `video`

- Accept `shotId`, `title`, `imageUrl`, `videoPrompt`, `dialogue`, `durationSeconds`, `voiceAssignments`, `characters`, `scenes`, `props`, `style`, `ratio`
- Return `result.shotId`, `result.videoUrl`, `result.shot`

### `video_optimize`

- Accept `shotId?`, `mode`, `value`
- Return `result.value`

### `dubbing`

- Accept `cardId`, `title`, `modelId`, `selectedVoiceId?`, `lines`
- Return `result.cardId`, `result.lines`, `result.lineIds`

## Mock-Only Payload Notes

The current front-end mock may also carry full objects for local settlement:

- `shot`
- `asset`
- `card`

Backend implementations should treat these as optional transitional fields and should not require them when the backend can reconstruct state from the required scalar payload fields.

For the front-end integration procedure and troubleshooting guide, see `docs/frontend-backend-integration-guide.md`.
