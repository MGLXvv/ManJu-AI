# Backend Runtime Config

## API Mode

The front-end supports two runtime modes:

- `VITE_API_MODE=mock`
- `VITE_API_MODE=http`

Actual behavior is defined in `src/api/shared/apiMode.ts`:

```ts
import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock'
```

When the variable is missing or is not exactly `http`, the application intentionally falls back to local mock mode.

## API Base URL

All HTTP modules share the Axios client in `src/api/http.ts`:

```ts
baseURL: import.meta.env.VITE_API_BASE_URL || '/admin-api'
```

Rules:

- Set `VITE_API_BASE_URL` to an absolute URL for direct local-backend access.
- Omit it when the development or production reverse proxy exposes the backend at `/admin-api`.
- Do not append module paths such as `/aidrama` or `/projects` to the base URL. Those paths belong to each `*.http.ts` module.
- Avoid a trailing slash to prevent double-slash request URLs in logs and proxy rules.

## Local Mock Mode

Use this mode for front-end-only development or product demonstrations:

```dotenv
VITE_API_MODE=mock
```

API modules use local mock implementations, and many mock flows persist state through `localStorage`. No backend is required.

## Direct Local Backend

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=http://localhost:48080/admin-api
```

A project-list request is then resolved as:

```text
http://localhost:48080/admin-api/aidrama/projects
```

## Reverse Proxy Or Same-Origin Backend

```dotenv
VITE_API_MODE=http
```

The browser requests `/admin-api/...`. Vite, Nginx, or the deployment gateway must proxy that prefix to the backend service.

## Shared Request Behavior

The shared client currently provides:

- 30-second timeout
- `Authorization: Bearer <token>` injection when a session token exists
- `X-Requested-With: XMLHttpRequest`
- unwrapping of `{ code, msg, data }` responses when `code === 0`
- normalized API errors
- centralized handling of HTTP or business-code `401` and `403`

## Standardized Modules

The following modules already support mock/HTTP switching:

- `auth`
- `editor`
- `generation`
- `project`
- `resource`
- `storyboard`
- `voice`
- `setting`
- `system`
- `asset`
- `scriptTemplate`

For the complete integration workflow, see `docs/frontend-backend-integration-guide.md`.
