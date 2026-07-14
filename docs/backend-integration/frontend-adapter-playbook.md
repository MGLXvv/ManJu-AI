# 前端后端接口接入实施手册

## 1. 适用范围

本文用于指导后续开发人员在后端接口逐步完成后，将 ManJu-AI 前端从 Mock 模式安全接入真实 HTTP 接口。

当前前端阶段目标不是继续猜测未完成的后端字段，而是保证：

- 后端接口到位后，主要修改集中在 Adapter、DTO、Mapper 和 Capability；
- 页面、组件和 Pinia Store 不因为后端字段变化而大面积修改；
- Mock 模式继续支持前端独立开发和回归；
- HTTP 模式绝不静默回退 Mock；
- 未验证接口不会被误认为真实功能已经完成。

接口成熟度先查看：

- [`interface-readiness.md`](./interface-readiness.md)
- [`endpoint-matrix.md`](./endpoint-matrix.md)
- [`verification-log.md`](./verification-log.md)

## 2. 仓库已经具备的接入框架

项目此前已经完成一轮后端接入准备，主要痕迹如下。

### 2.1 运行模式隔离

文件：

```text
src/config/runtimeConfig.ts
```

统一管理：

- `VITE_API_MODE=mock|http`；
- `VITE_API_BASE_URL`；
- 严格运行配置；
- `VITE_ENABLED_CAPABILITIES`；
- `VITE_DISABLED_CAPABILITIES`。

原则：

- Mock 和 HTTP 是两种明确模式；
- HTTP 请求失败不能自动切换 Mock；
- 生产环境缺少合法模式时应启动失败；
- 业务源码不得硬编码个人服务器 IP。

### 2.2 Shared HTTP Client

主要文件：

```text
src/api/http.ts
src/api/interceptors.ts
src/api/errors.ts
```

负责：

- Base URL；
- Bearer Token；
- CommonResult 解包；
- 401 Session 清理；
- 403 权限状态；
- 网络错误和业务错误归一化；
- 敏感信息脱敏。

业务 Adapter 只写业务路径，例如：

```ts
http.get('/aidrama/projects')
```

禁止写：

```ts
http.get('/admin-api/aidrama/projects')
```

因为 `/admin-api` 属于共享 Base URL。

### 2.3 API Contract 与双 Adapter

标准调用关系：

```text
Page / Component
  -> Pinia Store / Domain Service
  -> XxxApiContract
  -> xxx.mock.ts | xxx.http.ts
  -> Shared HTTP Client
```

标准模块目录：

```text
src/api/modules/<module>/
├─ <module>.api.ts
├─ <module>.http.ts
├─ <module>.mock.ts
├─ <module>.types.ts
├─ <module>.mapper.ts
└─ index.ts
```

职责：

| 文件          | 职责                                        |
| ------------- | ------------------------------------------- |
| `*.api.ts`    | 根据运行模式选择 Mock 或 HTTP，实现稳定入口 |
| `*.http.ts`   | 发送真实请求、调用 Mapper、转换错误         |
| `*.mock.ts`   | 提供本地演示、失败场景和可重复测试数据      |
| `*.types.ts`  | 定义前端稳定 Contract、Input、Query、Result |
| `*.mapper.ts` | 后端 DTO 与前端领域模型互转                 |
| `index.ts`    | 只导出该模块对外使用的稳定类型和入口        |

### 2.4 Capability Registry

文件：

```text
src/features/capabilities/capabilityRegistry.ts
```

当前状态：

```text
available
mock-only
readonly
unsupported
```

它解决的是“当前页面是否允许用户操作”，不是“后端文档是否写了该接口”。

正确开放顺序：

```text
后端实现
-> 契约冻结
-> Adapter + Mapper
-> Fixture + 契约测试
-> 真实环境验证
-> 更新接口成熟度
-> 更新 Capability 默认状态
-> 页面开放
```

禁止只通过：

```dotenv
VITE_ENABLED_CAPABILITIES=xxx
```

强行开放一个尚未真实验证的功能。

### 2.5 GenerationTaskGateway

用于承接未来真实 AI 异步任务：

```text
Page / Store
  -> Generation Domain Service
  -> GenerationTaskGateway
  -> create / list / get / cancel / retry / wait
  -> refresh Workspace
  -> Store
```

已经准备的能力包括：

- requestId；
- 轮询；
- 超时；
- AbortSignal；
- 最大并发；
- 刷新后恢复；
- 单项失败隔离；
- 轻量任务结果。

后端真实算法到位后，不应在每个页面重新编写轮询逻辑。

### 2.6 EditorPersistenceService

编辑器已经定义六个前端持久化分区：

```text
script
setting
storyboard
video
dubbing
project-meta
```

现有边界负责：

- 800ms 自动保存；
- 手动保存；
- 路由离开前 flush；
- dirty partitions；
- 保存失败保留脏状态；
- revision 和 409 冲突前端状态；
- 重新加载或覆盖策略。

注意：这些是前端稳定语义，不要求后端必须提供六个物理接口。后端可以使用聚合草稿或多个 Workspace，差异由 HTTP Adapter 处理。

### 2.7 MediaUploadService

已经抽象：

```text
upload
uploadFile
uploadDataUrl
captureUrl
restore
```

真实上传接口未冻结时：

- HTTP 模式不猜测 multipart 路径；
- 不把 Data URL、Blob URL 或 `mock-media://` 发给后端；
- 本地临时媒体不写入长期草稿；
- 后端稳定 URL 可以继续通过。

## 3. 接口证据与判断规则

后续人员接到一个“后端说已经完成”的接口时，先确认其证据类型。

| 证据                | 能证明什么                | 不能证明什么                       |
| ------------------- | ------------------------- | ---------------------------------- |
| 后端文档表格        | Method、Path 和设计意图   | 当前部署一定可用                   |
| Swagger/OpenAPI     | 当前声明的 DTO            | 数据库副作用和业务闭环正确         |
| MockMvc             | Controller 层自动测试通过 | WireGuard 测试环境部署了同一版本   |
| Smoke Suite         | 某些示例请求可通过        | 页面刷新、权限、异常和真实算法可用 |
| HTTP 200 + `code=0` | 请求被后端接受            | 数据一定保存或业务一定执行         |
| 写后重新读取        | 数据副作用可观察          | 权限、并发和异常已覆盖             |
| 页面完整真实流程    | 主要用户链路可用          | 所有边界场景都已验证               |

必须遵守：

```text
接口返回成功
≠ 数据真实保存
≠ 业务状态真实推进
≠ 真实 AI 已执行
≠ 功能可以上线
```

## 4. 新模块的标准接入流程

### 4.1 建立接入记录

每个模块先记录：

```text
模块名称：
后端提交或 OpenAPI 日期：
测试环境：
负责人：
成熟度：CONTRACT_READY / LIVE_PARTIAL / LIVE_VERIFIED / ...
Method + Path：
Path 参数：
Query 参数：
Request Body：
成功响应：
空响应：
业务错误：
401：
403：
ID 类型：
枚举：
时间格式与时区：
分页 Envelope：
文件和资源 URL：
幂等键：
任务状态：
未确认项：
```

没有这些信息时，不要直接修改页面。

### 4.2 定义前端稳定 Contract

Contract 只描述前端真正需要的业务能力。

```ts
export interface ExampleApiContract {
  list(query: ExampleQuery): Promise<ExamplePage>
  getById(id: string): Promise<Example | null>
  create(input: CreateExampleInput): Promise<Example>
  update(id: string, input: UpdateExampleInput): Promise<Example>
  remove(id: string): Promise<void>
}
```

不要把以下后端字段直接扩散到页面：

- `createTime`；
- `updateTime`；
- `records`；
- `statusLabel`；
- `extraJson`；
- 数据库数字 ID；
- 后端特有枚举大小写。

### 4.3 定义后端 DTO

DTO 可以忠实描述后端响应，即使字段设计不理想。

```ts
export interface BackendExampleDTO {
  id?: string | number | null
  displayName?: string | null
  status?: string | null
  createTime?: string | null
  updateTime?: string | null
}
```

原则：

- 后端可能缺失的字段写成可选或 nullable；
- 不为了通过 TypeScript 假设字段必然存在；
- DTO 不直接在页面、Store 或组件中使用。

### 4.4 编写 Mapper

```ts
export const mapBackendExample = (dto: BackendExampleDTO): Example => ({
  id: String(dto.id ?? ''),
  name: dto.displayName?.trim() ?? '',
  status: mapBackendExampleStatus(dto.status),
  createdAt: normalizeBackendTime(dto.createTime),
  updatedAt: normalizeBackendTime(dto.updateTime),
})
```

Mapper 负责：

- ID 转字符串；
- 枚举归一；
- 时间和时区；
- nullable 和默认值；
- 分页提取；
- `extraJson` 安全解析；
- 兼容迁移字段。

Mapper 禁止：

- 随机生成真实数据；
- 读取 Mock 文件；
- 调用其他 API；
- 修改 Store；
- 吞掉错误后返回看似成功的空对象。

### 4.5 编写 HTTP Adapter

```ts
export const exampleHttpApi: ExampleApiContract = {
  async list(query) {
    const { data } = await http.get<BackendPageDTO<BackendExampleDTO>>('/examples', {
      params: mapExampleQuery(query),
    })

    return {
      list: (data?.list ?? []).map(mapBackendExample),
      total: Number(data?.total ?? 0),
    }
  },

  async getById(id) {
    const { data } = await http.get<BackendExampleDTO | null>(`/examples/${encodeURIComponent(id)}`)
    return data ? mapBackendExample(data) : null
  },
}
```

Adapter 必须：

- 只使用业务路径；
- 对 Path 参数使用 `encodeURIComponent`；
- 显式映射 Query 和 Body；
- 返回前端 Contract；
- 让 Shared HTTP Client 处理通用错误；
- 对模块特殊业务错误做明确转换。

Adapter 禁止：

- 导入 `*.mock.ts`；
- 在请求失败后返回 Mock 数据；
- 直接弹 Toast；
- 直接操作 Router；
- 直接修改 Pinia Store；
- 在多个组件中重复 Axios 请求。

### 4.6 通过稳定入口选择 Adapter

```ts
import { runtimeConfig } from '@/config/runtimeConfig'
import { exampleHttpApi } from './example.http'
import { exampleMockApi } from './example.mock'

export const exampleApi: ExampleApiContract = runtimeConfig.apiMode === 'http' ? exampleHttpApi : exampleMockApi
```

上层只导入 `exampleApi` 或 Domain Service。

### 4.7 接入 Capability

存在以下任一情况时，必须增加或更新 Capability：

- 后端只读；
- 写接口尚未验证；
- 接口是 Mock；
- 接口是 NO_OP；
- 接口是 CONTROLLED_REJECT；
- 依赖真实算法或媒体；
- 功能仅对特定角色开放。

页面和 Service 应双层保护：

```text
页面：隐藏、禁用或显示说明
Service/API：requireCapability 阻止绕过 UI 的调用
```

## 5. Fixture 与契约测试

### 5.1 Fixture 来源

优先级：

1. 脱敏真实环境响应；
2. 后端版本化 OpenAPI 示例；
3. 后端测试 Fixture；
4. 前端根据契约人工构造。

真实 Fixture 必须删除：

- password；
- token；
- Authorization；
- Cookie；
- API Key；
- 个人手机号、邮箱或敏感业务内容。

### 5.2 Adapter 测试最低覆盖

- Method；
- Path；
- Query；
- Body；
- 成功 Mapper；
- 空列表；
- nullable；
- 未知枚举；
- HTTP 401；
- HTTP 403；
- HTTP 5xx；
- HTTP 200 + 业务 `code != 0`；
- 超时和网络失败。

写接口还要覆盖：

- 写后重新读取；
- 重复提交；
- 清理测试数据；
- 更新时是否要求完整对象；
- 删除是物理删除还是逻辑删除。

### 5.3 HTTP/Mock 依赖边界

现有 CI 会递归检查 `*.http.ts`，禁止直接或间接依赖：

```text
src/mocks/*
*.mock.ts
```

新增模块必须通过：

```bash
pnpm check:http-mock-boundary
pnpm check:integration-consistency
pnpm test:contracts
```

## 6. 真实环境验证

### 6.1 安全原则

- 凭据只通过环境变量或 `Get-Credential`；
- 命令历史中不写明文密码；
- 报告不保存 Token；
- 写操作必须显式设置 `MANJU_ALLOW_WRITE=true`；
- 临时数据使用唯一前缀；
- 中途失败必须在 `finally` 中补偿删除；
- 报告使用 UTF-8；
- 不在 CI 中连接内网测试环境。

### 6.2 推荐验证层级

```text
Level 1：Health / Login / Profile
Level 2：单接口读取
Level 3：临时数据 CRUD
Level 4：跨接口业务闭环
Level 5：页面真实流程与刷新恢复
Level 6：权限、超时、并发和故障恢复
```

接口至少达到 Level 4，才适合标记为 `LIVE_VERIFIED`；核心页面还需要 Level 5。

### 6.3 写后读验证

对任何保存接口，不允许只检查：

```text
HTTP 200
code = 0
```

必须继续：

```text
写入
-> 重新 GET
-> 比对标记值
-> 推进业务状态
-> 再次 GET
-> 删除临时数据
-> 列表确认不存在
```

Script Workspace 联调已经证明：返回 `code=0` 仍可能没有产生预期业务副作用。

## 7. 错误处理规范

### 7.1 CommonResult

业务成功判断：

```text
HTTP 请求成功
AND response.code === 0
```

不能只判断 HTTP Status。

### 7.2 401

- 清除本地 Session；
- 记录会话过期原因；
- 跳转登录页；
- 保留原访问地址；
- 不自动使用 Mock 数据。

### 7.3 403

- 保留登录态；
- 显示权限不足；
- 不循环重试；
- 不通过前端隐藏权限判断绕过后端权限。

### 7.4 400/422

- 使用后端稳定错误码做程序判断；
- `msg` 只用于用户提示和诊断；
- 不根据中文文案分支业务逻辑。

### 7.5 429/5xx/网络失败

- 区分可重试与不可重试；
- AI 任务重试交给 GenerationTaskGateway；
- 表单保存失败保留脏状态；
- 不吞掉异常并返回默认成功数据。

## 8. 异步 AI 接入规范

真实 Image、Video、TTS 到位后，后端至少提供：

```text
submit endpoint
业务 taskId
providerTaskId（如有）
requestId / idempotency key
status enum
progress
error code/message
result resource ID or stable URL
cancel/retry rules
callback contract
```

前端实现原则：

- 页面不直接轮询；
- 不把完整 Shot/Asset/Card 作为任务结果的唯一格式；
- 任务成功后刷新所属 Workspace；
- 结果优先使用资源 ID 或稳定 URL；
- 页面刷新后恢复 queued/running 任务；
- 批量任务限制并发且单项失败隔离。

## 9. Workspace 持久化规范

后端到位时需要明确：

- 聚合草稿还是分区 Workspace；
- revision/version 字段；
- 409 冲突响应；
- 保存是 PATCH、PUT 还是全量覆盖；
- 更新是否需要完整对象；
- 空字符串表示清空还是忽略；
- 自动保存是否允许频繁调用；
- 确认后是否仍允许编辑；
- 页面刷新读取哪个接口作为事实来源。

在这些字段未确认前，前端保留 EditorPersistenceService，但 HTTP Adapter 不伪造版本号或确认状态。

## 10. 媒体上传规范

后端需要至少确认一种模式：

```text
multipart 上传
或
预签名 URL 直传
或
统一媒体资源服务
```

必须冻结：

- 文件大小；
- MIME；
- 图片尺寸和视频编码；
- 返回 mediaId/resourceId；
- 预览 URL；
- URL 过期；
- 删除和引用计数；
- 上传进度；
- 取消和重试；
- CDN/OSS 跨域。

接口未确认时，不要在业务 Adapter 中临时发 Base64。

## 11. Pull Request 要求

每个真实接口 PR 应包含：

- 后端版本或 OpenAPI 日期；
- 接入接口列表；
- 前端 Contract；
- DTO 和 Mapper；
- HTTP Adapter；
- Capability 变化；
- 脱敏 Fixture；
- 契约测试；
- Mock 回归；
- 真实环境验证步骤；
- 写操作清理策略；
- 已确认项和未确认项。

禁止在同一个 PR 中同时接入多个尚未验证的大模块。

推荐拆分：

```text
Auth
Project
Script data
Storyboard data
Asset data
Resource Library
Generation Task read/control
Image generation
Video generation
TTS
Export
```

## 12. 完成定义

一个模块只有满足以下条件，才能宣称“前后端联调完成”：

- [ ] 后端契约版本已记录；
- [ ] Contract、DTO、Mapper 和 Adapter 已分层；
- [ ] HTTP 模式没有 Mock 依赖；
- [ ] Capability 状态正确；
- [ ] 成功、空值和业务错误已测试；
- [ ] 401 已测试；
- [ ] 403 已测试或明确缺少低权限账号；
- [ ] 写后重新读取已验证；
- [ ] 页面刷新恢复已验证；
- [ ] 重复提交和幂等已验证；
- [ ] 临时数据已清理；
- [ ] Mock 模式回归通过；
- [ ] TypeScript、单元测试、构建和 E2E 通过；
- [ ] 接口成熟度矩阵和验证日志已更新。

任一项缺失时，只能标记为 `CONTRACT_READY` 或 `LIVE_PARTIAL`，不能标记为 `LIVE_VERIFIED`。
