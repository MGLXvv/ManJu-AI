# Backend API Matrix

## Purpose

This matrix gives a backend-facing overview of which API domains are already ready for integration, which still rely on local mock structure, and where the main risks are.

## Matrix

### Generation

- Status: standardized
- Backend required: yes
- Mode switch: yes
- Runtime mode support: `mock/http supported`
- Main endpoints:
  - `GET /generation/tasks`
  - `GET /generation/tasks/:id`
  - `POST /generation/tasks`
  - `PATCH /generation/tasks/:id`
  - `POST /generation/tasks/:id/cancel`
  - `POST /generation/tasks/:id/retry`
- Main risk:
  - none at the API-switch level
- Notes:
  - This is the preferred entry point for generation flows.

### Project

- Status: standardized
- Backend required: yes
- Mode switch: yes
- Runtime mode support: `mock/http supported`
- Main endpoints:
  - `GET /projects`
  - `GET /projects/:id`
  - `POST /projects`
  - `POST /projects/import`
  - `GET /projects/:id/export`
  - `PATCH /projects/:id`
  - `DELETE /projects/:id`
- Main risk:
  - import/export payload semantics need to remain aligned with scoped project artifact behavior

### Storyboard

- Status: standardized
- Backend required: yes, but mixed responsibility
- Mode switch: yes
- Runtime mode support: `mock/http supported`
- Main endpoints:
  - `GET /storyboard/defaults`
  - `POST /storyboard/shots/:id/reference/:referenceImageId/apply`
  - `POST /storyboard/shots/:id/image`
  - `POST /storyboard/shots/:id/video`
  - `POST /storyboard/shots/:id/edited-image`
  - `POST /storyboard/shots/:id/generate-image`
  - `POST /storyboard/shots/:id/generate-video`
  - `POST /storyboard/shots/:id/upscale-image`
- Main risk:
  - `generate-image / generate-video / upscale-image` overlap with generation-task flows
- Recommendation:
  - Treat upload/reference/edit endpoints as storyboard-domain APIs
  - Treat direct generation endpoints as legacy-compatible endpoints
  - Use generation task APIs as the primary backend generation entrypoint

### Voice

- Status: standardized
- Backend required: yes
- Mode switch: yes
- Runtime mode support: `mock/http supported`
- Main endpoints:
  - `GET /voices`
  - `POST /voices`
  - `PATCH /voices/:voiceId`
  - `DELETE /voices/:voiceId`
- Main risk:
  - voice ID/name consistency must stay aligned with setting assets and dubbing cards

### Editor Draft

- Status: standardized
- Backend required: yes
- Mode switch: yes
- Runtime mode support: `mock/http supported`
- Main role:
  - editor draft load/save
- Main risk:
  - draft payload must continue to preserve hidden-card and scoped-export semantics

### Resource

- Status: standardized
- Backend required: maybe
- Mode switch: yes
- Runtime mode support: `mock/http supported`
- Main risk:
  - backend scope is not yet as clear as `generation/project/storyboard/voice`

### Auth

- Status: standardized
- Backend required: yes
- Mode switch: yes
- Runtime mode support: `mock/http supported`
- Main risk:
  - implementation is slightly special because mode resolution is lazy and `index.ts` still re-exports mock helpers

### Setting

- Status: standardized
- Backend required: yes
- Mode switch: yes
- Runtime mode support: `mock/http supported`
- Main endpoints:
  - `GET /settings/defaults`
  - `POST /settings/assets`
  - `PATCH /settings/assets/:assetId`
  - `POST /settings/assets/:assetId/images`
  - `POST /settings/assets/:assetId/candidate-selection`
  - `POST /settings/assets/:assetId/generate-image`
- Main risk:
  - image generation endpoint remains lower priority than generation-task integration
- Recommendation:
  - keep generation-task integration as the preferred backend path for setting image generation when possible

### System

- Status: standardized
- Backend required: medium
- Mode switch: yes
- Runtime mode support: `mock/http supported`
- Main endpoints:
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
- Main risk:
  - backend ownership priority is lower than project, editor draft, and generation flows
- Recommendation:
  - integrate after higher-priority project and generation domains

### Asset

- Status: standardized
- Backend required: maybe
- Mode switch: yes
- Runtime mode support: `mock/http supported`
- Main endpoints:
  - `GET /projects/:projectId/assets`
  - `PUT /projects/:projectId/assets`
- Main risk:
  - ownership versus `resource` domain is still a product-level question
- Recommendation:
  - keep as a lightweight project-scoped API unless product later merges it into a larger asset/library backend

### Script Template

- Status: standardized
- Backend required: maybe
- Mode switch: yes
- Runtime mode support: `mock/http supported`
- Main endpoints:
  - `GET /script-templates`
  - `POST /script-templates`
  - `PATCH /script-templates/:templateId`
  - `DELETE /script-templates/:templateId`
- Main risk:
  - ownership priority is still lower than generation/project/storyboard integration
- Recommendation:
  - keep the current module boundary and decide later whether templates are system-level shared data or editor-scoped data

## Recommended Order

1. backend integration environment and startup instructions
2. final delivery inventory and remaining unimplemented capability list

## Boundary Reminder

- Preferred generation entry: `generation` task API
- Storyboard-domain APIs should focus on storyboard data, uploads, reference handling, and edit operations
- If backend keeps storyboard direct-generation endpoints, they should be documented as intentionally parallel to generation-task flows rather than accidental duplicates
