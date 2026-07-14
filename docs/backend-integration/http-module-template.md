# HTTP 模块接入模板

本文提供一个可复制的最小模板。使用时将 `example` 替换为实际模块名，并根据真实后端契约删改字段。

## 1. 推荐目录

```text
src/api/modules/example/
├─ example.api.ts
├─ example.http.ts
├─ example.mock.ts
├─ example.mapper.ts
├─ example.types.ts
└─ index.ts

tests/unit/api/modules/example/
├─ example.http.test.ts
├─ example.mapper.test.ts
└─ example.api.test.ts

tests/fixtures/http/
├─ example-list.success.json
├─ example-detail.success.json
├─ example-empty.success.json
├─ example-unauthorized.error.json
└─ example-forbidden.error.json
```

## 2. 前端稳定类型

`example.types.ts`

```ts
export interface Example {
  id: string
  name: string
  status: 'draft' | 'ready' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface ExampleQuery {
  page: number
  pageSize: number
  keyword?: string
  status?: Example['status'] | 'all'
}

export interface ExamplePage {
  list: Example[]
  total: number
}

export interface CreateExampleInput {
  name: string
}

export interface UpdateExampleInput {
  name?: string
}

export interface ExampleApiContract {
  list(query: ExampleQuery): Promise<ExamplePage>
  getById(id: string): Promise<Example | null>
  create(input: CreateExampleInput): Promise<Example>
  update(id: string, input: UpdateExampleInput): Promise<Example>
  remove(id: string): Promise<void>
}
```

## 3. 后端 DTO 与 Mapper

`example.mapper.ts`

```ts
import type { Example } from './example.types'

export interface BackendExampleDTO {
  id?: string | number | null
  name?: string | null
  status?: string | null
  createTime?: string | null
  updateTime?: string | null
}

const mapStatus = (value: string | null | undefined): Example['status'] => {
  switch (value?.toUpperCase()) {
    case 'READY':
      return 'ready'
    case 'FAILED':
      return 'failed'
    default:
      return 'draft'
  }
}

export const mapBackendExample = (dto: BackendExampleDTO): Example => ({
  id: String(dto.id ?? ''),
  name: dto.name?.trim() ?? '',
  status: mapStatus(dto.status),
  createdAt: dto.createTime ?? '',
  updatedAt: dto.updateTime ?? '',
})
```

Mapper 中不要：

- 导入 Mock；
- 调用 HTTP；
- 修改 Store；
- 随机生成 ID；
- 吞掉结构错误后返回虚假成功数据。

## 4. HTTP Adapter

`example.http.ts`

```ts
import { http } from '@/api/http'
import { mapBackendExample, type BackendExampleDTO } from './example.mapper'
import type {
  CreateExampleInput,
  ExampleApiContract,
  ExamplePage,
  ExampleQuery,
  UpdateExampleInput,
} from './example.types'

interface BackendPageDTO<T> {
  list?: T[] | null
  total?: number | string | null
}

const mapQuery = (query: ExampleQuery) => ({
  pageNo: query.page,
  pageSize: query.pageSize,
  keyword: query.keyword?.trim() || undefined,
  status: query.status === 'all' ? 'ALL' : query.status?.toUpperCase(),
})

const mapCreateBody = (input: CreateExampleInput) => ({
  name: input.name.trim(),
})

const mapUpdateBody = (input: UpdateExampleInput) => ({
  name: input.name?.trim(),
})

export const exampleHttpApi: ExampleApiContract = {
  async list(query): Promise<ExamplePage> {
    const { data } = await http.get<BackendPageDTO<BackendExampleDTO>>('/examples', {
      params: mapQuery(query),
    })

    return {
      list: (data?.list ?? []).map(mapBackendExample),
      total: Number(data?.total ?? 0),
    }
  },

  async getById(id) {
    const { data } = await http.get<BackendExampleDTO | null>(
      `/examples/${encodeURIComponent(id)}`,
    )
    return data ? mapBackendExample(data) : null
  },

  async create(input) {
    const { data } = await http.post<BackendExampleDTO>('/examples', mapCreateBody(input))
    return mapBackendExample(data)
  },

  async update(id, input) {
    const { data } = await http.put<BackendExampleDTO>(
      `/examples/${encodeURIComponent(id)}`,
      mapUpdateBody(input),
    )
    return mapBackendExample(data)
  },

  async remove(id) {
    await http.delete(`/examples/${encodeURIComponent(id)}`)
  },
}
```

实际接入时必须按真实后端确认：

- `POST`、`PUT` 或 `PATCH`；
- 创建和更新返回对象、ID 还是 `null`；
- 分页是 `list/total`、`records/total` 还是其他结构；
- 删除是否需要 Body；
- Update 是否允许部分字段。

## 5. Mock Adapter

`example.mock.ts`

```ts
import type { ExampleApiContract } from './example.types'

export const exampleMockApi: ExampleApiContract = {
  async list() {
    return { list: [], total: 0 }
  },
  async getById() {
    return null
  },
  async create() {
    throw new Error('EXAMPLE_MOCK_NOT_IMPLEMENTED')
  },
  async update() {
    throw new Error('EXAMPLE_MOCK_NOT_IMPLEMENTED')
  },
  async remove() {},
}
```

Mock 可以更完整，但必须和 HTTP Adapter 返回同一个前端 Contract。

## 6. 稳定入口

`example.api.ts`

```ts
import { runtimeConfig } from '@/config/runtimeConfig'
import { exampleHttpApi } from './example.http'
import { exampleMockApi } from './example.mock'
import type { ExampleApiContract } from './example.types'

export const exampleApi: ExampleApiContract =
  runtimeConfig.apiMode === 'http' ? exampleHttpApi : exampleMockApi
```

`index.ts`

```ts
export { exampleApi } from './example.api'
export type {
  CreateExampleInput,
  Example,
  ExampleApiContract,
  ExamplePage,
  ExampleQuery,
  UpdateExampleInput,
} from './example.types'
```

## 7. Mapper 测试模板

```ts
import { describe, expect, it } from 'vitest'
import { mapBackendExample } from '@/api/modules/example/example.mapper'

describe('mapBackendExample', () => {
  it('normalizes id, nullable fields and status', () => {
    expect(
      mapBackendExample({
        id: 18,
        name: null,
        status: 'READY',
        createTime: '2026-07-14T10:00:00',
      }),
    ).toEqual({
      id: '18',
      name: '',
      status: 'ready',
      createdAt: '2026-07-14T10:00:00',
      updatedAt: '',
    })
  })

  it('falls back safely for an unknown status', () => {
    expect(mapBackendExample({ id: '1', status: 'NEW_STATUS' }).status).toBe('draft')
  })
})
```

## 8. HTTP Adapter 测试模板

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'
import { exampleHttpApi } from '@/api/modules/example/example.http'

vi.mock('@/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('exampleHttpApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps list query and list/total response', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: {
        list: [{ id: 1, name: 'Example', status: 'READY' }],
        total: 1,
      },
    })

    const result = await exampleHttpApi.list({
      page: 1,
      pageSize: 20,
      status: 'all',
    })

    expect(http.get).toHaveBeenCalledWith('/examples', {
      params: {
        pageNo: 1,
        pageSize: 20,
        keyword: undefined,
        status: 'ALL',
      },
    })
    expect(result.total).toBe(1)
    expect(result.list[0]?.id).toBe('1')
  })

  it('encodes path parameters', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: null })
    await exampleHttpApi.getById('id/with space')
    expect(http.get).toHaveBeenCalledWith('/examples/id%2Fwith%20space')
  })
})
```

错误测试仍需覆盖共享 HTTP Client 对以下场景的处理：

- HTTP 401；
- HTTP 403；
- HTTP 5xx；
- HTTP 200 + `code != 0`；
- 网络断开；
- 超时；
- 请求取消。

## 9. Capability 接入模板

为未验证写能力增加 Capability：

```ts
export type CapabilityKey =
  | 'example.read'
  | 'example.write'
```

默认状态示例：

```ts
'example.read': {
  mock: 'available',
  http: 'readonly',
  message: 'Example 读取接口尚未完成真实联调',
},
'example.write': {
  mock: 'mock-only',
  http: 'unsupported',
  message: 'Example 写接口尚未完成真实联调',
},
```

只有真实环境验收完成后，才能把 HTTP 状态改为 `available`。

## 10. 接入检查表

- [ ] 已记录后端提交或 OpenAPI 日期；
- [ ] 已确认 Method 和业务路径；
- [ ] 已确认 Query、Body 和 Content-Type；
- [ ] 已定义稳定前端 Contract；
- [ ] 已定义 nullable 后端 DTO；
- [ ] 已编写纯 Mapper；
- [ ] HTTP Adapter 不依赖 Mock；
- [ ] 页面和 Store 不直接使用 DTO；
- [ ] Capability 默认状态正确；
- [ ] 已保存脱敏 Fixture；
- [ ] 已测试成功、空值、未知枚举和错误；
- [ ] 写接口已完成写后读；
- [ ] 写测试数据已自动清理；
- [ ] Mock 回归通过；
- [ ] `pnpm check:http-mock-boundary` 通过；
- [ ] `pnpm check:integration-consistency` 通过；
- [ ] TypeScript、Vitest、Build 和 E2E 通过；
- [ ] 接口成熟度矩阵和验证日志已更新。
