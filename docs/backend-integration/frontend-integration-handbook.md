# ManJu-AI 前端后端接口接入手册

## 1. 文档目的

本文用于指导后续前端开发人员在后端接口正式交付后，将 ManJu-AI 从 Mock 模式切换到真实 HTTP 模式。

当前阶段的目标不是继续猜测未完成接口，而是保证：

- 后端 DTO 变化只影响 Adapter、Types 和 Mapper；
- 页面、组件和 Store 不直接依赖 Axios 或后端字段；
- Mock 与 HTTP 返回相同的前端领域契约；
- 未确认能力在 HTTP 模式显式关闭，而不是静默回退 Mock；
- 每个接口都有 Fixture、契约测试和可追溯的验收记录；
- 后续人员能按固定流程完成接入，而不需要重新理解整个项目。

## 2. 当前阶段结论

截至 2026-07-14，后端提供的两份文档可以作为“接口清单和阶段说明”，但不能单独作为请求 DTO 的最终依据。

原因：

- 文档中的 `READY` 包含 Mock 工作区、占位 URL 和同步模拟生成；
- 部分接口只说明路径和用途，没有请求体、完整响应体和错误样例；
- 真实 Script Content 联调已经证明，接口返回 `code=0` 不代表请求字段已被实际保存；
- 与 Image、Video、TTS、Export 相关的真实算法和媒体链路尚未完成；
- `CONTROLLED_REJECT` 和 `NO_OP_SUCCESS` 只用于兼容，不代表真实业务能力。

因此，前端以以下证据优先级判断接口是否可接入：

1. OpenAPI/Swagger 导出文件或后端 DTO 源码；
2. 脱敏的真实成功与失败响应 Fixture；
3. 后端接口文档中的 Method、Path、状态和限制；
4. 前端已有 HTTP Adapter；
5. 前端 Mock 实现。

低优先级证据不能覆盖高优先级证据。

## 3. 接口状态定义

项目统一使用以下状态：

| 状态 | 含义 | 是否允许默认开放 |
| --- | --- | --- |
| `verified` | 已完成真实请求、响应、失败、权限、刷新恢复和页面验收 | 是 |
| `contract-verified` | Method、Path、DTO 和基础成功链已通过真实请求确认，但页面或异常验收未完成 | 只读或受控开放 |
| `documented` | 后端文档声明存在，但缺少真实 Fixture 或完整 DTO | 否 |
| `mock-only` | 后端明确为 Mock、占位任务或占位媒体 | 仅 Mock 模式 |
| `controlled-reject` | 后端稳定拒绝，用于兼容旧前端路径 | 否 |
| `no-op` | 返回成功但没有真实业务副作用 | 仅用于兼容，不宣传为可用能力 |
| `blocked` | 缺少算法、媒体、上传、生产会话或正式业务实现 | 否 |
| `mismatch` | 前端实现与真实响应或后端契约存在明确差异 | 否 |
| `unconfirmed` | 路径可能存在，但请求体、响应体或语义未确认 | 否 |

禁止仅因为存在 `*.http.ts`、收到 HTTP 200 或业务 `code=0` 就标记为 `verified`。

## 4. 当前已经存在的接入框架

### 4.1 运行配置

统一入口：

```text
src/config/runtimeConfig.ts
```

关键变量：

```dotenv
VITE_API_MODE=mock|http
VITE_API_BASE_URL=/admin-api
VITE_DEV_PROXY_TARGET=http://10.10.3.26:48080
VITE_STRICT_RUNTIME_CONFIG=true
VITE_ENABLED_CAPABILITIES=
VITE_DISABLED_CAPABILITIES=
```

规则：

- 开发环境未指定模式时默认 Mock；
- 测试和生产环境应使用严格配置；
- `VITE_API_BASE_URL` 只包含公共网关前缀；
- 业务 Adapter 中不能重复写 `/admin-api`；
- 服务器地址不得硬编码进页面、Store 或业务 Service。

### 4.2 统一 HTTP Client

统一入口：

```text
src/api/http.ts
src/api/interceptors.ts
src/api/errors.ts
```

当前能力：

- 统一 Base URL 和超时；
- 自动添加 Bearer Token；
- 兼容 `{ code, msg, data }`；
- `code !== 0` 转换为统一 ApiError；
- 401 清理或过期 Session；
- 403 保留 Session 并标记无权限；
- 不记录密码、Token、Cookie 和完整 Authorization Header。

### 4.3 标准模块目录

每个模块应保持：

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

- `api.ts`：选择 Mock 或 HTTP Adapter；
- `http.ts`：Method、Path、Query、Body 和响应适配；
- `mock.ts`：本地演示和失败场景；
- `types.ts`：前端稳定契约、输入类型和后端 DTO；
- `mapper.ts`：ID、枚举、时间、分页、空值和兼容字段转换；
- `index.ts`：对外导出稳定入口。

### 4.4 推荐调用方向

```text
Page / Component
  -> Store / Feature State
  -> Domain Service
  -> ApiContract
  -> MockAdapter | HttpAdapter
  -> Shared HTTP Client
```

页面和 Store 禁止：

- 直接导入 Axios；
- 直接导入 `http`；
- 直接导入 `*.mock.ts`；
- 使用 `createTime`、`statusTag`、`records` 等后端字段；
- 在错误时自行切换 Mock。

### 4.5 能力注册表

统一入口：

```text
src/features/capabilities/capabilityRegistry.ts
```

未完成接口应通过能力状态控制：

```text
available
mock-only
readonly
unsupported
```

使用规则：

- UI 根据 Capability 决定显示、禁用或提示；
- HTTP Adapter 不应假装成功；
- 环境变量覆盖只用于已确认的联调环境；
- 不能通过 `VITE_ENABLED_CAPABILITIES` 强行开放未确认 DTO 的接口。

### 4.6 编辑器持久化边界

统一入口：

```text
src/services/editor/editorPersistence.service.ts
src/stores/editor.ts
src/api/modules/editor/
```

编辑器分区：

```text
script
setting
storyboard
video
dubbing
projectMeta
```

规则：

- 路由只加载当前页面需要的分区；
- 每个分区由独立 Workspace Adapter 负责；
- 未实现分区必须明确拒绝；
- 401、403、500 和契约错误不能被转换为空数据；
- revision/version 只使用后端真实返回值；
- 后端未确认并发版本时，不构造虚假 expectedRevision。

### 4.7 异步任务边界

统一入口：

```text
src/services/generation/
src/api/modules/generation/
```

推荐流程：

```text
业务页面
  -> 具体生成 Service
  -> GenerationTaskGateway
  -> 业务 Submit 接口
  -> 任务查询 / 轮询 / 取消 / 重试
  -> 结果 Mapper
  -> 重新读取 Workspace
```

禁止直接调用通用 `POST /generation/tasks`，因为 Phase1 后端明确将该接口标记为 `CONTROLLED_REJECT`。

### 4.8 媒体边界

真实图片、视频和音频接入前必须确认：

- multipart、预签名上传或对象存储直传方式；
- 文件大小、格式、分辨率和时长限制；
- 资源 ID、永久 URL 和临时签名 URL 的关系；
- URL 过期和刷新策略；
- 删除与引用计数；
- 上传进度、取消、重试和断点续传；
- CORS、CDN 和鉴权规则。

在这些内容未确认前，不得将 Data URL、Blob URL 或 Mock resultUrl 当作永久后端资源。

## 5. 后端接口到位后的标准接入流程

### 步骤 1：登记接口状态

先更新：

```text
docs/backend-integration/endpoint-matrix.md
docs/api-contract-status-matrix.md
```

初始状态只能是 `documented` 或 `unconfirmed`。

### 步骤 2：收集后端资料

每个接口至少需要：

- 后端 commit 或版本号；
- OpenAPI/Swagger 导出日期；
- Method 和完整业务路径；
- Path、Query 和 Body DTO；
- Content-Type；
- 成功响应；
- 业务失败响应；
- 401、403 和 404；
- ID 类型；
- 枚举值；
- 时间格式和时区；
- 分页结构；
- 空值规则；
- 权限要求；
- 幂等、重试和超时；
- 上传和资源 URL 生命周期。

缺少请求 DTO 时，不允许根据响应字段反推请求字段。

### 步骤 3：冻结前端稳定 Contract

示例：

```ts
export interface ProjectApiContract {
  list(query?: ProjectListQuery): Promise<Project[]>
  getById(id: string): Promise<Project | null>
  create(input: CreateProjectInput): Promise<Project>
  update(input: UpdateProjectInput): Promise<Project | null>
  remove(id: string): Promise<void>
}
```

Contract 面向页面业务，不复制后端 DTO。

### 步骤 4：定义 Backend DTO

示例：

```ts
export interface BackendProjectDTO {
  id: number | string
  name?: string | null
  status?: string | null
  createTime?: string | null
  updateTime?: string | null
}
```

DTO 中允许保留后端空值和兼容字段，领域模型中统一归一化。

### 步骤 5：实现 Mapper

Mapper 负责：

- 数字 ID 转字符串；
- 后端枚举转前端枚举；
- 时间和时区转换；
- `list/total` 等分页提取；
- 空值和缺省值；
- 兼容字段迁移；
- URL 和资源 ID 归一化。

Mapper 不允许：

- 调用 HTTP；
- 修改 Store；
- 随机生成生产字段；
- 读取 Mock 数据；
- 吞掉未知错误。

### 步骤 6：只修改 HTTP Adapter

真实请求只写在：

```text
src/api/modules/<module>/<module>.http.ts
```

示例：

```ts
const { data } = await http.get<BackendProjectDTO>(`/aidrama/projects/${id}`)
return data ? mapBackendProjectToProject(data) : null
```

如果接入一个接口需要修改大量页面和 Store，先修复 Contract 或 Service 边界。

### 步骤 7：保存脱敏 Fixture

目录：

```text
tests/fixtures/http/<module>/
```

至少保存：

```text
success.json
empty.json
validation-error.json
unauthorized.json
forbidden.json
not-found.json
server-error.json
```

Fixture 禁止包含：

- 密码；
- Token；
- Cookie；
- Authorization Header；
- 私有 API Key；
- 无关个人数据。

### 步骤 8：补契约测试

至少验证：

- Method 和路径；
- Query 和 Body；
- CommonResult 解包；
- 分页 Mapper；
- 空列表和空对象；
- 401、403、404、业务错误和 5xx；
- 未知枚举；
- 网络失败和超时；
- Mock 模式不回归。

### 步骤 9：HTTP 环境验收

使用：

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=/admin-api
VITE_DEV_PROXY_TARGET=http://<backend-host>:<port>
VITE_STRICT_RUNTIME_CONFIG=true
```

浏览器 Network 必须检查：

- URL 没有重复 `/admin-api`；
- Token 正确；
- 页面没有出现 Mock 数据；
- 刷新后状态可恢复；
- 重复点击不会重复提交；
- 401 跳转登录；
- 403 保留登录状态；
- 错误提示不依赖中文文案判断。

### 步骤 10：更新 Capability 和状态

只有完成成功、空值、失败、权限、刷新恢复、页面流程、单元测试和构建后，才能：

- 将状态升级为 `verified`；
- 修改 Capability 默认状态；
- 移除临时兼容字段；
- 在 UI 宣称功能可用。

## 6. 当前接口可接入范围

### 6.1 已有真实证据

当前已有真实测试环境证据：

- Auth 账号密码登录；
- Auth Profile；
- 有效 Token 和失效 Token 401；
- Project `list/total` 分页；
- Project 详情；
- Project 创建、重命名、删除和删除后列表校验；
- Script Workspace 读取；
- Script Draft 的 `rawText/prompt` 保存与重新读取。

其中 Auth 和 Project 已达到 Contract 级验证；完整页面和低权限 403 仍需后续验收。

### 6.2 仅后端文档声明

以下接口可以保留 Adapter 或待接入任务，但在没有真实 Fixture 前不默认开放：

- Project copy、batch-delete、statistics、overview、tasks、pipeline；
- Storyboard Workspace、CRUD、sort、confirm；
- Project Asset Workspace 与 CRUD；
- Resource Library Workspace、分页、CRUD、保存和导入；
- `GET /system`；
- Voices CRUD；
- Script Templates CRUD；
- Generation Tasks list/detail/cancel/retry；
- Project export compat 查询。

### 6.3 Mock 或占位能力

以下接口不能视为真实生产能力：

- Script generate；
- Storyboard generate；
- Project start-generation；
- Provider Sandbox；
- Export workspace、history 和 Mock export；
- Mock resultUrl；
- 图片、视频和 TTS 生成结果。

### 6.4 受控拒绝或 No-op

受控拒绝：

- System styles/permissions 写入；
- Project import；
- 通用 Generation Task create/update。

No-op：

- System message read；
- System message read-all；
- System message clear。

UI 不应将这些接口的成功响应解释为真实业务完成。

### 6.5 当前明确阻塞

- 真实 Image2；
- 真实 Seedance 2.0；
- 真实 TTS Provider；
- 真实视频合成和下载；
- 媒体上传和 OSS/CDN 生命周期；
- Script Content 保存请求 DTO；
- Script revision/version 和 409 冲突协议；
- 生产级 Session、过期和 Refresh；
- 正式 Nginx、HTTPS 和生产域名。

## 7. Script Workspace 当前处理规则

后端文档只给出：

```text
PUT /aidrama/projects/{projectId}/script/content
```

但没有提供请求体示例。

真实联调中：

- `{ content: value }` 返回 `code=0`，Workspace 的 `scriptContent` 仍为空；
- 根据响应字段猜测 `{ scriptContent: value }` 仍不能作为正式契约依据；
- 因此前端 HTTP Adapter 不再发送猜测请求；
- 生成稿非空时抛出 `EDITOR_SCRIPT_CONTENT_CONTRACT_UNCONFIRMED`；
- 后端提供 DTO 或 OpenAPI 后，只需修改 `editor.http.ts` 和对应测试。

已确认的 Script Draft 仍可使用：

```json
{
  "rawText": "...",
  "prompt": "..."
}
```

## 8. 后端交付给前端的最小资料包

每次交付至少包含：

```text
backend commit:
OpenAPI export:
environment:
method + path:
request DTO:
success response:
empty response:
validation error:
401:
403:
404:
status enums:
timezone:
pagination:
idempotency:
file/media rules:
known mock/no-op behavior:
```

没有这些内容时，前端只建立 Contract、Capability 和测试占位，不编写猜测性字段。

## 9. PR 接入清单

每个真实接口 PR 必须回答：

- [ ] 后端版本和接口来源是什么？
- [ ] 状态是 documented、contract-verified 还是 verified？
- [ ] 是否保存了脱敏 Fixture？
- [ ] 页面和 Store 是否仍只使用领域 Contract？
- [ ] DTO 和 Mapper 是否隔离？
- [ ] 是否覆盖空值和未知枚举？
- [ ] 是否覆盖 401 和 403？
- [ ] 是否避免静默回退 Mock？
- [ ] 是否更新 CapabilityRegistry？
- [ ] 是否更新 endpoint-matrix？
- [ ] 是否通过类型检查、单元测试、构建和 Mock E2E？
- [ ] 是否完成 HTTP 页面刷新恢复？

## 10. 后续推荐顺序

后端资料完整后，按以下顺序接入：

```text
Auth/Profile
-> Project CRUD
-> Script Draft
-> Storyboard CRUD
-> Project Asset
-> Resource Library
-> Voice / Script Template
-> Generation Task 查询与控制
-> 真实业务生成 Submit
-> Media Upload
-> Export
```

真实 Image、Video、TTS 和 Export 不应在算法、媒体存储和 Callback 契约到位前提前实现。
