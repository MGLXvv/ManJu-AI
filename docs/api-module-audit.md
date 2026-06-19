# API Module Audit

## Scope

This document audits the current front-end API layer from two angles:

- whether a module already has a standard `modules/<name>/<name>.mock.ts + <name>.http.ts + <name>.api.ts` switch structure
- whether the module already has a clear backend reservation point or is still implemented as a top-level local mock file

Global switch baseline:

- HTTP base URL: `VITE_API_BASE_URL || '/api'`
- API mode switch: `VITE_API_MODE === 'http' ? 'http' : 'mock'`
- Shared helper: `src/api/shared/apiMode.ts`

## A. Standardized Modules

### `generation`

- Top-level entry: `src/api/generation.api.ts`
- Real entry: `src/api/modules/generation/generation.api.ts`
- Structure: `mock + http + api + types + index`
- Mode switch: yes
- HTTP endpoints:
  - `GET /generation/tasks`
  - `GET /generation/tasks/:id`
  - `POST /generation/tasks`
  - `PATCH /generation/tasks/:id`
  - `POST /generation/tasks/:id/cancel`
  - `POST /generation/tasks/:id/retry`
- Notes:
  - This is the clearest current backend reservation point.
  - Stable generation task types already cover `script`, `script_optimize`, `setting_asset`, `storyboard`, `storyboard_optimize`, `storyboard_upscale`, `video`, `video_optimize`, `dubbing`.

### `project`

- Top-level entry: `src/api/project.api.ts`
- Real entry: `src/api/modules/project/project.api.ts`
- Structure: `mock + http + api + types + index`
- Mode switch: yes
- HTTP endpoints:
  - `GET /projects`
  - `GET /projects/:id`
  - `POST /projects`
  - `POST /projects/import`
  - `GET /projects/:id/export`
  - `PATCH /projects/:id`
  - `DELETE /projects/:id`
- Notes:
  - Import/export capability already has backend reservation points.
  - Export payload still needs to stay aligned with project draft artifact semantics.

### `storyboard`

- Top-level entry: `src/api/storyboard.api.ts`
- Real entry: `src/api/modules/storyboard/storyboard.api.ts`
- Structure: `mock + http + api + types + index`
- Mode switch: yes
- HTTP endpoints:
  - `GET /storyboard/defaults`
  - `POST /storyboard/shots/:id/reference/:referenceImageId/apply`
  - `POST /storyboard/shots/:id/image`
  - `POST /storyboard/shots/:id/video`
  - `POST /storyboard/shots/:id/edited-image`
  - `POST /storyboard/shots/:id/generate-image`
  - `POST /storyboard/shots/:id/generate-video`
  - `POST /storyboard/shots/:id/upscale-image`
- Notes:
  - Upload/reference/edit endpoints are clearly storyboard-domain APIs.
  - `generate-image / generate-video / upscale-image` are retained as legacy-compatible direct endpoints.
  - Primary AI generation entrypoint should be the generation task API rather than storyboard direct generation endpoints.

### `voice`

- Top-level entry: `src/api/voice.api.ts`
- Real entry: `src/api/modules/voice/voice.api.ts`
- Structure: `mock + http + api + types + index`
- Mode switch: yes
- HTTP endpoints:
  - `GET /voices`
  - `POST /voices`
  - `PATCH /voices/:voiceId`
  - `DELETE /voices/:voiceId`
- Notes:
  - This module is already a clean backend reservation point for voice management.
  - It is now part of the main editor flow because setting assets and dubbing both rely on consistent voice IDs and names.

### `editor`

- Top-level entry: `src/api/editor.api.ts`
- Real entry: `src/api/modules/editor/editor.api.ts`
- Structure: `mock + http + api + types + index`
- Mode switch: yes
- Current role:
  - draft loading
  - draft saving
- Notes:
  - Standardized enough for switching.
  - Still primarily supports front-end draft persistence rather than media-generation behavior.

### `resource`

- Top-level entry: `src/api/resource.api.ts`
- Real entry: `src/api/modules/resource/resource.api.ts`
- Structure: `mock + http + api + types + index`
- Mode switch: yes
- Notes:
  - Backend reservation point exists.
  - Needs separate product-level confirmation before a detailed backend contract audit.

## B. Standardized But Slightly Special

### `auth`

- Top-level entry: `src/api/auth.api.ts`
- Real entry: `src/api/modules/auth/auth.api.ts`
- Structure: `mock + http + api + types + index`
- Mode switch: yes, but resolved lazily through `resolveAuthApi()`
- Notes:
  - This module is standardized.
  - Its `index.ts` currently also re-exports parts of `auth.mock`, so the module is not as cleanly separated as `generation/project/storyboard/voice`.

## C. Additional Standardized Modules

### `setting`

- Top-level entry: `src/api/setting.api.ts`
- Real entry: `src/api/modules/setting/setting.api.ts`
- Structure: `mock + http + api + types + index`
- Mode switch: yes
- HTTP endpoints:
  - `GET /settings/defaults`
  - `POST /settings/assets`
  - `PATCH /settings/assets/:assetId`
  - `POST /settings/assets/:assetId/images`
  - `POST /settings/assets/:assetId/candidate-selection`
  - `POST /settings/assets/:assetId/generate-image`
- Notes:
  - This module is now standardized for mock/http switching.
  - Setting image generation still has a lower backend priority than the main generation-task flow.

### `system`

- Top-level entry: `src/api/system.api.ts`
- Real entry: `src/api/modules/system/system.api.ts`
- Structure: `mock + http + api + types + index`
- Mode switch: yes
- HTTP endpoints:
  - `GET /system`
  - `POST /system/styles`
  - `PATCH /system/styles/:styleId`
  - `DELETE /system/styles/:styleId`
  - `POST /system/permissions`
  - `PATCH /system/permissions/:permissionId`
  - `DELETE /system/permissions/:permissionId`
  - `POST /system/messages/:messageId/read`
  - `POST /system/messages/read-all`
  - `DELETE /system/messages`
- Notes:
  - This module is now standardized for mock/http switching.
  - Backend priority remains lower than project, editor draft, and generation flows.

### `asset`

- Top-level entry: `src/api/asset.api.ts`
- Real entry: `src/api/modules/asset/asset.api.ts`
- Structure: `mock + http + api + types + index`
- Mode switch: yes
- HTTP endpoints:
  - `GET /projects/:projectId/assets`
  - `PUT /projects/:projectId/assets`
- Notes:
  - This is a lightweight project-scoped asset persistence module.
  - It is now minimally standardized, but backend priority can stay lower than `generation/project/storyboard/voice`.

### `scriptTemplate`

- Top-level entry: `src/api/scriptTemplate.api.ts`
- Real entry: `src/api/modules/scriptTemplate/scriptTemplate.api.ts`
- Structure: `mock + http + api + types + index`
- Mode switch: yes
- HTTP endpoints:
  - `GET /script-templates`
  - `POST /script-templates`
  - `PATCH /script-templates/:templateId`
  - `DELETE /script-templates/:templateId`
- Notes:
  - Local default-template fallback remains in the mock layer.
  - This module is now minimally standardized, while ownership and backend priority can remain product-dependent.

## D. Compatibility Entrypoints And Utility Files

These top-level files currently act as compatibility surfaces or wrappers rather than business-domain implementations:

- `src/api/generation.api.ts`
- `src/api/project.api.ts`
- `src/api/storyboard.api.ts`
- `src/api/voice.api.ts`
- `src/api/editor.api.ts`
- `src/api/resource.api.ts`
- `src/api/auth.api.ts`
- `src/api/task.api.ts`

Utility/support files:

- `src/api/http.ts`
- `src/api/interceptors.ts`
- `src/api/local.ts`
- `src/api/errors.ts`

## E. Audit Summary

### Already suitable for backend switching

- `generation`
- `project`
- `storyboard`
- `voice`
- `editor`
- `resource`
- `auth`
- `setting`

### Standardized modules with lower backend priority

- `system`
- `asset`
- `scriptTemplate`

## Recommended Next Steps

1. keep `generation` as the preferred backend entry for AI generation flows
2. integrate `auth`, `project`, and `editor` draft APIs first on the backend side
3. integrate `setting`, `voice`, and storyboard auxiliary APIs after the primary generation path is stable
4. treat `system`, `asset`, and `scriptTemplate` as lower-priority backend domains unless product scope requires them earlier
