# Backend Runtime Config

## API Mode

The front-end supports two runtime modes:

- `VITE_API_MODE=mock`
- `VITE_API_MODE=http`

Actual behavior is defined in `src/api/shared/apiMode.ts`:

```ts
import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock'
```

That means:

- when `VITE_API_MODE=http`, the front-end uses HTTP API implementations for standardized modules
- when `VITE_API_MODE` is missing or any value other than `http`, the front-end defaults to `mock`

## API Base URL

HTTP requests use `VITE_API_BASE_URL`.

Actual behavior is defined in `src/api/http.ts`:

```ts
baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
```

That means:

- when `VITE_API_BASE_URL` is set, HTTP requests use that value as the API base URL
- when `VITE_API_BASE_URL` is missing, the front-end defaults to `/api`

## Local Mock Mode

Use this mode for front-end-only development or product demos.

Example `.env.local`:

```dotenv
VITE_API_MODE=mock
```

Behavior:

- API modules use local mock implementations
- many mock flows persist data through localStorage
- no backend is required

## Backend HTTP Mode

Use this mode for backend integration.

Example `.env.local`:

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=http://localhost:3000/api
```

Behavior:

- standardized API modules use their HTTP implementations
- requests are sent through the shared axios instance
- auth/session interceptors still apply in HTTP mode

## Request Behavior Summary

- default mode: `mock`
- HTTP mode trigger: `VITE_API_MODE=http`
- default base URL in HTTP mode: `/api`
- custom backend base URL: set `VITE_API_BASE_URL`

## Standardized API Modules With Mock/HTTP Support

The following modules already support mock/http switching:

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

## Example Configurations

### Front-End Only

```dotenv
VITE_API_MODE=mock
```

### Local Backend

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=http://localhost:3000/api
```

### Reverse Proxy Or Same-Origin Backend

```dotenv
VITE_API_MODE=http
```

In this case the front-end will request `/api/...`.
