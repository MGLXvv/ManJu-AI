# Generation Entrypoint Strategy

## Recommended Entrypoint

The recommended backend entrypoint for AI generation flows is the generation task API:

- `POST /generation/tasks`
- `GET /generation/tasks/:id`
- `GET /generation/tasks?projectId=...`
- `POST /generation/tasks/:id/cancel`
- `POST /generation/tasks/:id/retry`

Front-end generation services already treat this task-based flow as the primary path for:

- `storyboard`
- `storyboard_upscale`
- `video`
- `script`
- `script_optimize`
- `storyboard_optimize`
- `video_optimize`
- `setting_asset`
- `dubbing`

## Legacy-Compatible Storyboard Direct Endpoints

The `storyboard` module still exposes these direct generation endpoints:

- `POST /storyboard/shots/:id/generate-image`
- `POST /storyboard/shots/:id/generate-video`
- `POST /storyboard/shots/:id/upscale-image`

These endpoints are retained as legacy-compatible or optional direct endpoints.
They are not the preferred backend entrypoint for new AI generation capability.

## Current Front-End Boundary

Current business flows already use generation services and generation tasks:

- storyboard image generation: `storyboardGenerationService.generateShotImage()`
- storyboard upscale: `storyboardGenerationService.upscaleShotImage()`
- video generation: `videoGenerationService.generateVideo()`

Current direct storyboard generation methods are now mainly used by:

- `storyboard` API contract and tests
- generation mock resolvers that settle local mock tasks by reusing storyboard mock behavior
- compatibility surfaces for historical direct calls

They are not the primary page/store generation path anymore.

## Backend Implementation Priority

Backend integration should implement generation task APIs first.

If the direct storyboard generation endpoints are kept, they should delegate to the same underlying generation pipeline used by generation tasks.
They should not introduce a second independent generation flow.

## Front-End Mock Compatibility

The front-end mock layer still reuses direct storyboard methods inside generation mock resolvers:

- `storyboardApi.generateShotImage()`
- `storyboardApi.generateVideo()`
- `storyboardApi.upscaleShotImage()`

This is a mock-layer compatibility choice, not the intended backend architecture.

## Migration Notes

- Do not delete the direct storyboard endpoints yet.
- Do not switch page/store code back to direct storyboard generation calls.
- Treat direct storyboard generation endpoints as compatibility-only unless product/backend explicitly choose to keep two entry styles.
