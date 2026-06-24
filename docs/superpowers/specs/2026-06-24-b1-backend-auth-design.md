# B1 Backend Auth Integration Design

## Scope

This phase only establishes the minimum backend integration path needed to run the frontend in `http` mode and complete password login against the real backend.

Included:

- Vite dev proxy for `/admin-api`
- Default HTTP base URL fallback aligned to `/admin-api`
- CommonResult response unwrapping for HTTP APIs
- Unified ApiError creation when backend business code is not successful
- Password login adapter mapped to backend `POST /system/auth/login`
- Access token persistence through the existing auth store
- Automatic `Authorization: Bearer <token>` injection on later requests
- Unit coverage for CommonResult handling and auth HTTP mapping

Excluded:

- Project list, project creation, project detail, editor draft, script, storyboard, asset, resource, export, and generation business APIs
- Refresh token flows
- Token parsing or JWT decoding
- Reworking the editor flow
- Making code-login, register, reset-password, or third-party login work against the backend in this phase

## Architecture

The backend integration remains layered:

- `vite.config.ts` handles local proxying from `/admin-api` to the backend host
- `src/api/http.ts` owns the shared Axios instance
- `src/api/commonResult.ts` defines backend envelope detection
- `src/api/interceptors.ts` unwraps successful CommonResult responses and throws unified `ApiError` instances for business failures
- `src/api/modules/auth/auth.http.ts` maps frontend password-login payloads to backend request/response fields
- `src/stores/auth.ts` keeps ownership of token and user persistence, unchanged in responsibility

This keeps backend-specific protocol handling inside the API layer. Pages and stores continue to consume normalized frontend shapes.

## Data Flow

Password login in `http` mode will work like this:

1. Login page submits `{ account, password }`
2. Auth store calls `authApi.loginByPassword(...)`
3. `auth.http.ts` posts to `/system/auth/login` using `{ username, password }`
4. Axios sends the request through the shared HTTP client whose base URL is `/admin-api`
5. Vite proxy forwards `/admin-api/*` to `http://10.10.3.26:48080`
6. Response interceptor checks for `{ code, msg, data }`
7. If `code === 0`, interceptor rewrites `response.data` to `body.data`
8. Auth adapter maps backend login data to `{ token, user }`
9. Auth store persists token and user through the existing bridge
10. Later HTTP requests automatically attach `Authorization: Bearer <token>`

## Error Handling

The API layer will support two failure classes:

- Backend business failure inside HTTP 200 responses
  - `code !== 0`
  - converted to `ApiError`
  - `message` comes from backend `msg`
  - `code` is stringified from backend code
  - `details` keeps the raw response body
- Transport or HTTP failure
  - still converted to `ApiError`
  - `401` triggers `onUnauthorized`
  - `403` triggers `onForbidden`

Non-CommonResult responses will continue to pass through untouched so existing frontend-only or non-enveloped calls are not broken by this phase.

## Testing

Tests added or updated in this phase:

- `tests/unit/api/http.test.ts`
  - detects CommonResult payloads
  - unwraps `data` when `code === 0`
  - throws `ApiError` when `code !== 0`
  - triggers unauthorized/forbidden hooks where applicable
- `tests/unit/api/modules/auth/auth.http.test.ts`
  - verifies password login uses `/system/auth/login`
  - verifies frontend `account` maps to backend `username`
  - verifies backend `accessToken` maps to `AuthSession.token`
  - verifies `userId` and `username` map to normalized frontend user shape

Validation commands for this phase:

- `npm test -- tests/unit/api/http.test.ts tests/unit/api/modules/auth/auth.http.test.ts`
- `npm test`
- `npm run build`

## Acceptance Criteria

This phase is complete when:

- Mock mode still works
- HTTP mode password login uses `/admin-api/system/auth/login`
- Password login request body uses `username/password`
- Successful login persists backend `accessToken` as the frontend session token
- Later HTTP requests attach `Authorization: Bearer <token>`
- CommonResult success is unwrapped to `data`
- CommonResult business failure becomes unified `ApiError`
- No refresh-token or token-decoding logic is introduced
