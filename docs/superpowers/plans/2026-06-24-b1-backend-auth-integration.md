# B1 Backend Auth Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the frontend to the backend base infrastructure for `http` mode, unwrap backend `CommonResult` responses, and make password login work against the real backend without expanding into other business APIs.

**Architecture:** Keep backend protocol handling inside the shared API layer. `vite.config.ts` will proxy `/admin-api`, `http.ts` and `interceptors.ts` will normalize backend request/response behavior, and `auth.http.ts` will adapt frontend login payloads to the backend password-login contract while leaving other auth methods out of scope for this phase.

**Tech Stack:** Vue 3, Vite, Axios, Vitest, TypeScript, Pinia

---

## File Structure

### Files to Create

- `F:/project/ai-manga-drama-web/src/api/commonResult.ts`
  - Backend envelope type and type guard for `{ code, msg, data }`
- `F:/project/ai-manga-drama-web/tests/unit/api/modules/auth/auth.http.test.ts`
  - Unit coverage for backend password-login mapping

### Files to Modify

- `F:/project/ai-manga-drama-web/vite.config.ts`
  - Add Vite dev proxy for `/admin-api`
- `F:/project/ai-manga-drama-web/src/api/http.ts`
  - Default HTTP base URL fallback from `/api` to `/admin-api`
- `F:/project/ai-manga-drama-web/src/api/interceptors.ts`
  - Request token injection stays; response interceptor unwraps `CommonResult`
- `F:/project/ai-manga-drama-web/src/api/errors.ts`
  - Allow backend business codes to be stringified safely instead of using only enum-locked codes
- `F:/project/ai-manga-drama-web/src/api/modules/auth/auth.http.ts`
  - Map frontend password login to backend `/system/auth/login`
- `F:/project/ai-manga-drama-web/tests/unit/api/http.test.ts`
  - Add CommonResult unwrapping and error handling coverage

### Files Explicitly Out of Scope

- `F:/project/ai-manga-drama-web/src/stores/auth.ts`
  - Token persistence behavior should stay as-is unless implementation reveals a real incompatibility
- Any project, script, storyboard, asset, resource, export, or generation business adapters
- Any refresh-token or JWT parsing helper

---

### Task 1: Add backend runtime entrypoint configuration

**Files:**
- Modify: `F:/project/ai-manga-drama-web/vite.config.ts`
- Modify: `F:/project/ai-manga-drama-web/src/api/http.ts`
- Test: `F:/project/ai-manga-drama-web/tests/unit/api/http.test.ts`

- [ ] **Step 1: Write the failing configuration assertion in the HTTP test**

Add a small base URL assertion in `F:/project/ai-manga-drama-web/tests/unit/api/http.test.ts` so the shared client contract is explicit:

```ts
import { http } from '@/api/http'

it('uses /admin-api as the default HTTP base URL fallback', () => {
  expect(http.defaults.baseURL).toBe('/admin-api')
})
```

- [ ] **Step 2: Run the focused test to confirm it fails**

Run:

```bash
npm test -- tests/unit/api/http.test.ts
```

Expected: FAIL because `http.defaults.baseURL` is still `/api`.

- [ ] **Step 3: Update Vite proxy and shared base URL**

In `F:/project/ai-manga-drama-web/vite.config.ts`, extend the existing server block:

```ts
server: {
  host: '0.0.0.0',
  allowedHosts: [
    'assessing-seventh-ecommerce-goals.trycloudflare.com',
  ],
  proxy: {
    '/admin-api': {
      target: 'http://10.10.3.26:48080',
      changeOrigin: true,
    },
  },
},
```

In `F:/project/ai-manga-drama-web/src/api/http.ts`, change the fallback:

```ts
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/admin-api',
  timeout: 30000,
})
```

- [ ] **Step 4: Run the focused test again**

Run:

```bash
npm test -- tests/unit/api/http.test.ts
```

Expected: PASS for the base URL assertion, while other new assertions from later tasks may still be pending.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/api/http.ts tests/unit/api/http.test.ts
git commit -m "chore: align backend http base routing"
```

---

### Task 2: Unwrap CommonResult responses in the shared API layer

**Files:**
- Create: `F:/project/ai-manga-drama-web/src/api/commonResult.ts`
- Modify: `F:/project/ai-manga-drama-web/src/api/interceptors.ts`
- Modify: `F:/project/ai-manga-drama-web/src/api/errors.ts`
- Test: `F:/project/ai-manga-drama-web/tests/unit/api/http.test.ts`

- [ ] **Step 1: Write failing response-interceptor tests**

Extend `F:/project/ai-manga-drama-web/tests/unit/api/http.test.ts` with direct interceptor tests:

```ts
it('unwraps CommonResult success responses to body.data', async () => {
  const client = axios.create()
  attachInterceptors(client, {
    getToken: () => null,
    onUnauthorized: vi.fn(),
    onForbidden: vi.fn(),
  })

  const handler = (client.interceptors.response as unknown as {
    handlers: Array<{
      fulfilled: (value: { status: number; data: unknown }) => Promise<{ status: number; data: unknown }> | { status: number; data: unknown }
    }>
  }).handlers[0].fulfilled

  const response = await handler({
    status: 200,
    data: {
      code: 0,
      msg: 'ok',
      data: { token: 'abc' },
    },
  })

  expect(response.data).toEqual({ token: 'abc' })
})

it('throws ApiError when CommonResult business code is not zero', async () => {
  const client = axios.create()
  attachInterceptors(client, {
    getToken: () => null,
    onUnauthorized: vi.fn(),
    onForbidden: vi.fn(),
  })

  const handler = (client.interceptors.response as unknown as {
    handlers: Array<{
      fulfilled: (value: { status: number; data: unknown }) => Promise<{ status: number; data: unknown }> | { status: number; data: unknown }
    }>
  }).handlers[0].fulfilled

  await expect(
    handler({
      status: 200,
      data: {
        code: 40001,
        msg: 'Login failed',
        data: null,
      },
    }),
  ).rejects.toMatchObject({
    message: 'Login failed',
    code: '40001',
    status: 200,
  })
})

it('calls onUnauthorized when CommonResult code is 401', async () => {
  const client = axios.create()
  const onUnauthorized = vi.fn()
  attachInterceptors(client, {
    getToken: () => null,
    onUnauthorized,
    onForbidden: vi.fn(),
  })

  const handler = (client.interceptors.response as unknown as {
    handlers: Array<{
      fulfilled: (value: { status: number; data: unknown }) => Promise<{ status: number; data: unknown }> | { status: number; data: unknown }
    }>
  }).handlers[0].fulfilled

  await expect(
    handler({
      status: 200,
      data: {
        code: 401,
        msg: 'Unauthorized',
        data: null,
      },
    }),
  ).rejects.toBeTruthy()

  expect(onUnauthorized).toHaveBeenCalledTimes(1)
})

it('passes through non-CommonResult responses unchanged', async () => {
  const client = axios.create()
  attachInterceptors(client, {
    getToken: () => null,
    onUnauthorized: vi.fn(),
    onForbidden: vi.fn(),
  })

  const handler = (client.interceptors.response as unknown as {
    handlers: Array<{
      fulfilled: (value: { status: number; data: unknown }) => Promise<{ status: number; data: unknown }> | { status: number; data: unknown }
    }>
  }).handlers[0].fulfilled

  const response = await handler({
    status: 200,
    data: { session: { token: 'raw' } },
  })

  expect(response.data).toEqual({ session: { token: 'raw' } })
})
```

- [ ] **Step 2: Run the focused test to verify failure**

Run:

```bash
npm test -- tests/unit/api/http.test.ts
```

Expected: FAIL because the current interceptor returns `response` unchanged and `ApiError` currently expects enum-only codes.

- [ ] **Step 3: Add CommonResult helper and update shared interceptors**

Create `F:/project/ai-manga-drama-web/src/api/commonResult.ts`:

```ts
export interface CommonResult<T> {
  code: number
  msg: string
  data: T
}

export const isCommonResult = (value: unknown): value is CommonResult<unknown> => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.code === 'number' && 'data' in record
}
```

Update `F:/project/ai-manga-drama-web/src/api/errors.ts` to accept plain string codes:

```ts
export class ApiError extends Error {
  code: string
  status?: number
  details?: unknown

  constructor(input: { message: string; code: string; status?: number; details?: unknown }) {
    super(input.message)
    this.name = 'ApiError'
    this.code = input.code
    this.status = input.status
    this.details = input.details
  }
}

export const createApiError = (input: {
  message: string
  code: string
  status?: number
  details?: unknown
}): ApiError => new ApiError(input)
```

Update `F:/project/ai-manga-drama-web/src/api/interceptors.ts`:

```ts
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { isCommonResult } from './commonResult'
import { createApiError } from './errors'

interface AttachInterceptorOptions {
  getToken: () => string | null
  onUnauthorized: () => void
  onForbidden: () => void
}

export const attachInterceptors = (client: AxiosInstance, options: AttachInterceptorOptions): void => {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = options.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['X-Requested-With'] = 'XMLHttpRequest'
    return config
  })

  client.interceptors.response.use(
    (response) => {
      const body = response.data

      if (isCommonResult(body)) {
        if (body.code === 401) {
          options.onUnauthorized()
        }

        if (body.code === 403) {
          options.onForbidden()
        }

        if (body.code !== 0) {
          throw createApiError({
            message: body.msg || 'Request failed',
            code: String(body.code),
            status: response.status,
            details: body,
          })
        }

        response.data = body.data
      }

      return response
    },
    (error) => {
      const status = error?.response?.status as number | undefined
      const responseBody = error?.response?.data

      if (status === 401) {
        options.onUnauthorized()
      }

      if (status === 403) {
        options.onForbidden()
      }

      throw createApiError({
        message: responseBody?.msg ?? responseBody?.message ?? error?.message ?? 'Request failed',
        code: responseBody?.code ? String(responseBody.code) : 'HTTP_REQUEST_FAILED',
        status,
        details: responseBody,
      })
    },
  )
}
```

- [ ] **Step 4: Run the focused test again**

Run:

```bash
npm test -- tests/unit/api/http.test.ts
```

Expected: PASS for bearer injection, CommonResult unwrapping, and business-failure handling.

- [ ] **Step 5: Commit**

```bash
git add src/api/commonResult.ts src/api/interceptors.ts src/api/errors.ts tests/unit/api/http.test.ts
git commit -m "feat: unwrap backend common results"
```

---

### Task 3: Map password login to the backend auth contract

**Files:**
- Modify: `F:/project/ai-manga-drama-web/src/api/modules/auth/auth.http.ts`
- Test: `F:/project/ai-manga-drama-web/tests/unit/api/modules/auth/auth.http.test.ts`

- [ ] **Step 1: Write the failing auth HTTP adapter test**

Create `F:/project/ai-manga-drama-web/tests/unit/api/modules/auth/auth.http.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()

vi.mock('@/api/http', () => ({
  http: {
    post,
  },
}))

describe('authHttpApi', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('maps password login to backend /system/auth/login contract', async () => {
    post.mockResolvedValue({
      data: {
        userId: 101,
        username: 'admin',
        accessToken: 'backend-token',
      },
    })

    const { authHttpApi } = await import('@/api/modules/auth/auth.http')

    const session = await authHttpApi.loginByPassword({
      account: 'admin',
      password: '123456',
    })

    expect(post).toHaveBeenCalledWith('/system/auth/login', {
      username: 'admin',
      password: '123456',
    })

    expect(session).toEqual({
      token: 'backend-token',
      user: {
        id: '101',
        name: 'admin',
      },
    })
  })
})
```

- [ ] **Step 2: Run the focused auth adapter test to confirm failure**

Run:

```bash
npm test -- tests/unit/api/modules/auth/auth.http.test.ts
```

Expected: FAIL because `auth.http.ts` still posts to `/auth/login/password` and expects `data.session`.

- [ ] **Step 3: Implement the backend password-login adapter**

Update `F:/project/ai-manga-drama-web/src/api/modules/auth/auth.http.ts`:

```ts
import { http } from '@/api/http'
import type { AuthApiContract } from './auth.types'

interface BackendLoginData {
  userId: number | string
  username: string
  accessToken: string
  refreshToken?: string
  tokenType?: string
}

const mapBackendLoginToSession = (data: BackendLoginData) => ({
  token: data.accessToken,
  user: {
    id: String(data.userId),
    name: data.username,
  },
})

export const authHttpApi: AuthApiContract = {
  async login(payload) {
    const { data } = await http.post<BackendLoginData>('/system/auth/login', {
      username: payload.account,
      password: payload.secret,
    })
    return mapBackendLoginToSession(data)
  },

  async loginByPassword(payload) {
    const { data } = await http.post<BackendLoginData>('/system/auth/login', {
      username: payload.account,
      password: payload.password,
    })
    return mapBackendLoginToSession(data)
  },

  async loginByCode() {
    throw new Error('AUTH_HTTP_CODE_LOGIN_UNSUPPORTED')
  },

  async register() {
    throw new Error('AUTH_HTTP_REGISTER_UNSUPPORTED')
  },

  async resetPassword() {
    throw new Error('AUTH_HTTP_RESET_PASSWORD_UNSUPPORTED')
  },

  async requestCode() {
    throw new Error('AUTH_HTTP_REQUEST_CODE_UNSUPPORTED')
  },

  async loginWithThirdParty() {
    throw new Error('AUTH_HTTP_THIRD_PARTY_LOGIN_UNSUPPORTED')
  },

  async logout() {
    // No backend logout endpoint is confirmed in B1.
  },
}
```

This keeps unsupported auth flows explicit in `http` mode instead of pretending they are integrated. Do not change mock behavior.

- [ ] **Step 4: Run the focused auth adapter test again**

Run:

```bash
npm test -- tests/unit/api/modules/auth/auth.http.test.ts
```

Expected: PASS for password-login request mapping and session normalization.

- [ ] **Step 5: Commit**

```bash
git add src/api/modules/auth/auth.http.ts tests/unit/api/modules/auth/auth.http.test.ts
git commit -m "feat: connect password login to backend auth"
```

---

### Task 4: Verify the integrated B1 path and keep scope sealed

**Files:**
- Modify: `F:/project/ai-manga-drama-web/src/api/http.ts`
- Modify: `F:/project/ai-manga-drama-web/src/api/interceptors.ts`
- Modify: `F:/project/ai-manga-drama-web/src/api/modules/auth/auth.http.ts`
- Modify: `F:/project/ai-manga-drama-web/vite.config.ts`
- Create/Modify: `F:/project/ai-manga-drama-web/src/api/commonResult.ts`
- Test: `F:/project/ai-manga-drama-web/tests/unit/api/http.test.ts`
- Test: `F:/project/ai-manga-drama-web/tests/unit/api/modules/auth/auth.http.test.ts`

- [ ] **Step 1: Run the focused B1 unit tests**

Run:

```bash
npm test -- tests/unit/api/http.test.ts tests/unit/api/modules/auth/auth.http.test.ts
```

Expected: PASS with CommonResult handling and password login mapping covered.

- [ ] **Step 2: Run the full unit suite**

Run:

```bash
npm test
```

Expected: PASS for the existing full migrated test suite.

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected: PASS with no TypeScript or bundling regression.

- [ ] **Step 4: Smoke-check the final scope**

Run:

```bash
git diff --name-only HEAD~3..HEAD
```

Expected: only the B1 infrastructure files and tests touched, with no drift into project/storyboard/resource business adapters.

- [ ] **Step 5: Commit the integrated B1 pass if any verification fixes were needed**

```bash
git add vite.config.ts src/api/http.ts src/api/commonResult.ts src/api/interceptors.ts src/api/errors.ts src/api/modules/auth/auth.http.ts tests/unit/api/http.test.ts tests/unit/api/modules/auth/auth.http.test.ts
git commit -m "test: verify backend auth integration base"
```

If no verification fixes were needed because previous task commits are clean, skip this commit and keep the three feature commits above.
