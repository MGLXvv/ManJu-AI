# Local Dev and Backend Integration

## Front-End Mock Startup

Use mock mode when no backend is available.

Setup:

```bash
npm install
```

Example `.env.local`:

```dotenv
VITE_API_MODE=mock
```

Start:

```bash
npm run dev
```

## Front-End Backend Startup

Use HTTP mode when integrating with a real backend.

Example `.env.local`:

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=http://localhost:3000/api
```

Start:

```bash
npm run dev
```

## Recommended Backend Integration Order

Recommended order for backend delivery:

1. `auth`
2. `project`
3. `editor` draft load/save
4. `setting` and `voice`
5. `generation` task APIs
6. `storyboard` auxiliary APIs such as defaults, upload, reference, and edit
7. `system`, `asset`, and `scriptTemplate`
8. `dubbing` downstream settlement and complete/export validation

This order gets project creation, draft persistence, and the main AI generation path stable before less critical domains.

## Minimum Backend Startup Target

The smallest useful backend integration target is:

1. `GET /projects`
2. `POST /projects`
3. `GET /generation/tasks`
4. `POST /generation/tasks`
5. `GET /generation/tasks/:id`

After these are stable, continue with:

1. editor draft APIs
2. setting and voice APIs
3. storyboard auxiliary APIs
4. remaining management modules

## Generation Task Integration Order

Recommended generation task rollout order:

1. `script`
2. `script_optimize`
3. `setting_asset`
4. `storyboard`
5. `storyboard_optimize`
6. `storyboard_upscale`
7. `video`
8. `video_optimize`
9. `dubbing`

This order matches the current front-end production path from script to settings to storyboard to video to dubbing.

## Request Path Notes

- mock mode does not call the backend
- HTTP mode uses `VITE_API_BASE_URL` when present
- otherwise HTTP mode falls back to `/api`

## Troubleshooting

### Front-end still uses mock

Check `VITE_API_MODE`.

Only `VITE_API_MODE=http` enables HTTP mode.
Any other value, or a missing value, falls back to `mock`.

### Request URL is wrong

Check `VITE_API_BASE_URL`.

If it is missing, the front-end defaults to `/api`.

### 401 or 403 responses

Check:

- login/session state
- token propagation
- backend auth response format
- whether the backend is returning unauthorized or forbidden intentionally

### Generation task stays in running

Check whether `GET /generation/tasks/:id` returns an updated task status.

Task status must eventually move to one of:

- `success`
- `failed`
- `cancelled`

### Task succeeds but the page still throws

Check whether `result` matches the front-end result guard expectations.

Examples:

- `storyboard` requires `result.imageUrl` and `result.shot`
- `storyboard_upscale` requires `result.imageUrl` and `result.shot`
- `video` requires `result.videoUrl` and `result.shot`
- `dubbing` requires `result.cardId` and `result.lines`

### CORS errors in local dev

Allow the front-end dev origin in the backend CORS config.

Typical local origin:

- `http://localhost:5173`
