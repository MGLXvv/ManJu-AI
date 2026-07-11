# ManJu-AI 前端后端接口接入指南

## 1. 文档目的

本文面向负责 ManJu-AI 前后端联调的前端开发人员，说明：

- 后端尚未完成时，前端应该先准备哪些边界；
- 接口到位后，如何冻结契约、修改 Adapter、补充 Mapper 和测试；
- 如何避免页面直接适配后端字段；
- 如何处理异步生成任务、草稿持久化、上传和认证；
- 如何判断一个模块是否真正完成联调。

配套文档：

- `docs/frontend-backend-readiness-plan.md`：风险治理和分阶段修复顺序；
- `docs/api-contract-status-matrix.md`：各模块当前接口状态；
- `docs/backend-integration-checklist.md`：接入和验收逐项清单；
- `docs/generation-task-contract.md`：当前生成任务过渡契约；
- `docs/backend-runtime-config.md`：环境变量和运行模式。

## 2. 当前阶段原则

当前后端接口尚未完整交付，因此前端的主要任务不是继续猜测请求字段，而是保证后续接入只影响适配层。

必须遵守：

1. 页面、组件和 Pinia Store 不直接依赖后端 DTO；
2. 页面、组件和 Store 不直接导入 Axios、`http` 或 `*.mock.ts`；
3. 真实接口差异优先收敛在 `src/api/modules/*` 下的 HTTP Adapter、DTO 和 Mapper；
4. Mock 和 HTTP 对上层返回相同前端领域契约；
5. 尚未确认的后端字段不得写入页面领域模型；
6. 未接入功能必须明确标识能力状态，不能静默回退 Mock；
7. “存在 HTTP 文件”只表示接口预留，不表示已经联调；
8. 一个模块只有完成真实成功、失败、权限、空值和刷新恢复测试后，才能标记为已验证。

## 3. 当前接口架构

标准模块结构：

```text
src/api/modules/<module>/
├─ <module>.api.ts       # 稳定入口，选择 Mock 或 HTTP Adapter
├─ <module>.http.ts      # 真实请求和响应适配
├─ <module>.mock.ts      # 本地演示和失败场景
├─ <module>.types.ts     # 前端契约与后端 DTO
├─ <module>.mapper.ts    # DTO 与前端领域模型转换
└─ index.ts
```

推荐调用方向：

```text
Page / Component
  -> Store / Feature State
  -> Domain Service
  -> ApiContract
  -> MockAdapter | HttpAdapter
  -> Shared HTTP Client
```

AI 生成任务推荐方向：

```text
Page / Store
  -> Generation Domain Service
  -> GenerationTaskGateway
  -> create / poll / cancel / retry
  -> refresh workspace
  -> Mapper
  -> Store
```

编辑器保存推荐方向：

```text
Editor Store
  -> EditorPersistenceService
  -> Script / Setting / Storyboard / Video / Dubbing Workspace Adapter
```

## 4. 后端未完成阶段的准备工作

在真实接口到位前，优先完成：

- 删除页面和 Store 中的 HTTP、Mock 直连；
- 建立能力注册表；
- 建立统一生成任务网关；
- 建立编辑器分区持久化契约；
- 删除明文密码持久化；
- 建立统一 Session Repository；
- 抽离文件上传服务；
- 将生成结果从完整领域对象解耦为轻量资源结果；
- 固定 Node、pnpm、测试和构建流程；
- 建立 Mock 主流程 E2E；
- 建立 HTTP Adapter Fixture 和契约测试。

具体顺序参见 `docs/frontend-backend-readiness-plan.md`。

## 5. 联调环境配置

### 5.1 Mock 模式

```dotenv
VITE_API_MODE=mock
```

用途：

- 前端独立开发；
- 页面回归；
- 失败状态模拟；
- 后端不可用时的演示。

### 5.2 直连后端

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=http://localhost:48080/admin-api
```

### 5.3 反向代理或同源部署

```dotenv
VITE_API_MODE=http
```

未设置 `VITE_API_BASE_URL` 时，当前共享客户端默认使用：

```text
/admin-api
```

基础地址只包含网关前缀，业务模块路径中不能再次写 `/admin-api`。

正确：

```ts
http.get('/aidrama/projects')
```

错误：

```ts
http.get('/admin-api/aidrama/projects')
```

### 5.4 运行配置安全要求

- 开发环境可以允许默认 Mock；
- 测试和生产环境应启用严格配置，缺少或拼错模式时启动失败；
- 不把固定服务器、临时 Tunnel 域名或个人环境地址写入通用源码；
- 新增环境变量必须同步更新 `.env.example` 和 `docs/backend-runtime-config.md`；
- 开发环境建议显示当前 API 模式和基础地址，避免假联调。

## 6. 接口到位后的标准流程

### 6.1 第一步：确认接口状态

先在 `docs/api-contract-status-matrix.md` 中确认模块当前状态：

```text
mock-ready / http-reserved / http-partial / readonly / blocked / verified / deferred
```

只新增 HTTP Adapter 不允许直接标记为 `verified`。

### 6.2 第二步：冻结接口契约

每个接口至少确认：

- HTTP Method 和完整业务路径；
- Path、Query、Body 参数；
- Content-Type；
- 成功响应和错误响应示例；
- ID 类型；
- 枚举值和大小写；
- 时间格式和时区；
- 分页结构；
- 空值和缺省规则；
- 上传和资源 URL 规则；
- 幂等键、重试和超时；
- 权限要求；
- 接口版本或 Swagger/OpenAPI 导出日期。

不要只根据 Swagger 页面当前显示内容开发，应保存本次联调对应的接口版本或导出文件。

### 6.3 第三步：确认前端稳定契约

后端 DTO 不应直接替代前端领域模型。

先确认上层需要的稳定接口：

```ts
interface ProjectApiContract {
  list(query?: ProjectQuery): Promise<Project[]>
  getById(id: string): Promise<Project | null>
  create(input: CreateProjectInput): Promise<Project>
}
```

接口差异应由 Adapter 处理，而不是让组件使用 `createTime`、`records`、`asset_type` 等后端字段。

### 6.4 第四步：定义 DTO 和 Mapper

示例：

```ts
interface BackendProjectDTO {
  id: number | string
  name?: string
  aspectRatio?: string
  createTime?: string
}
```

```ts
const mapBackendProjectToProject = (dto: BackendProjectDTO): Project => ({
  id: String(dto.id),
  name: dto.name ?? '',
  ratio: normalizeProjectRatio(dto.aspectRatio),
  createdAt: normalizeBackendTime(dto.createTime),
})
```

Mapper 负责：

- ID 转换；
- 枚举转换；
- 时间和时区；
- 空值和缺省值；
- 分页列表提取；
- 兼容字段迁移；
- DTO 到领域模型转换。

Mapper 不允许：

- 随机生成生产数据；
- 静默加载 Mock；
- 直接修改 Store；
- 调用其他业务 API；
- 把未知错误吞掉后返回看似成功的数据。

### 6.5 第五步：只修改 HTTP Adapter

真实请求写在：

```text
src/api/modules/<module>/<module>.http.ts
```

示例：

```ts
export const projectHttpApi: ProjectApiContract = {
  async getById(id) {
    const { data } = await http.get<BackendProjectDTO>(`/aidrama/projects/${id}`)
    return data ? mapBackendProjectToProject(data) : null
  },
}
```

如果接入一个接口需要修改大量页面和 Store，说明稳定契约或 Service 边界尚未准备好，应先修复架构边界。

### 6.6 第六步：补充 Fixture 和单元测试

HTTP Adapter 测试至少覆盖：

- Method 和路径；
- Path、Query、Body；
- 成功 DTO Mapper；
- 空列表和空对象；
- 401、403、422、429 和 5xx；
- 超时和网络失败；
- 未知枚举；
- 导入、导出和上传等特殊接口。

建议使用固定响应 Fixture，不要只 Mock 一个任意 `{ data: {} }`。

### 6.7 第七步：切换 HTTP 模式验证

```bash
pnpm test
pnpm build
pnpm dev
```

浏览器 Network 检查：

- URL 是否重复 `/admin-api`；
- 是否出现双斜杠；
- Token 或 Cookie 是否正确；
- 请求体字段是否符合契约；
- 响应是否已经由拦截器解包；
- 401/403 是否触发正确状态；
- 页面是否仍出现 Mock 数据；
- 刷新后是否能恢复真实状态；
- 多次点击是否造成重复提交。

### 6.8 第八步：更新接口状态

只有完成以下验证后才能把模块更新为 `verified`：

- 成功；
- 空值；
- 权限；
- 业务失败；
- 网络失败；
- 页面刷新；
- 重新进入项目；
- Mock 模式回归；
- 单元测试；
- 构建。

## 7. 统一响应与错误处理

共享 Axios 客户端位于：

- `src/api/http.ts`
- `src/api/interceptors.ts`

当前优先兼容：

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

处理原则：

- 全局统一响应格式在拦截器中解包；
- 模块特殊响应在对应 HTTP Adapter 中解包；
- 页面只处理稳定前端错误码；
- 不通过后端中文错误文案做业务判断；
- 401、403、422、429、5xx 分开处理；
- 网络错误、超时和取消请求需要不同语义；
- 错误对象保留 `code`、`status`、`message` 和必要 `details`。

## 8. 认证接入

认证接入前必须先完成：

- 删除明文密码保存；
- Session 存储从 Mock 文件中抽离；
- 统一登录后写入和刷新后恢复；
- 统一退出和会话清理。

后端需要确认：

- Bearer Token、Refresh Token 或 HttpOnly Cookie；
- Token 有效期；
- 刷新接口；
- 退出接口；
- 用户权限和角色结构；
- 多端登录和失效策略。

并发 Token 刷新应由拦截器或 Session Service 统一处理，页面不能分别刷新 Token。

## 9. 编辑器草稿和 Workspace

前端需要保持稳定的草稿分区：

- Script；
- Setting；
- Storyboard；
- Video；
- Dubbing；
- Project Meta。

后端最终可以采用：

- 单个聚合草稿接口；
- 多个 Workspace 接口；
- 聚合读取 + 分区保存；
- 事件或增量保存。

无论采用哪种后端方案，页面和 Store 都只调用 `EditorPersistenceService`。

必须确认：

- 保存覆盖哪些字段；
- 自动保存时机；
- revision 或版本冲突；
- 重试和失败提示；
- 生成结果由任务写入还是前端保存；
- 隐藏和审核状态是否持久化；
- 刷新后如何恢复。

## 10. AI 生成任务

生成行为应优先通过统一任务网关，不要在图片、视频和配音页面分别实现轮询。

推荐生命周期：

```text
queued -> running -> success | failed | cancelled
```

前端本地派生状态：

```text
timeout / disconnected / restoring
```

任务能力：

```ts
interface GenerationTaskGateway {
  create(input: CreateGenerationTaskInput): Promise<GenerationTask>
  getById(taskId: string): Promise<GenerationTask | null>
  listByProject(projectId: string): Promise<GenerationTask[]>
  cancel(taskId: string): Promise<GenerationTask | null>
  retry(taskId: string): Promise<GenerationTask | null>
}
```

需要确认：

- 状态枚举；
- 进度范围；
- 任务保存时间；
- 请求幂等；
- 轮询、SSE 或 WebSocket；
- 取消和重试语义；
- 批量并发限制；
- 任务结果和 Workspace 回填规则。

### 10.1 结果契约迁移

当前代码部分结果仍要求完整 `shot`、`asset` 或 `card`，这是过渡实现。

目标结果建议：

```ts
interface GenerationArtifactResult {
  entityId: string
  taskId: string
  resultUrl?: string
  resourceId?: string
  revision?: number
}
```

标准处理：

```text
任务成功
  -> 获取轻量结果
  -> 刷新对应 Workspace
  -> Mapper 生成完整领域对象
  -> 更新 Store
```

后端不应被要求长期构造前端完整领域对象。

## 11. 文件和媒体上传

页面不应通过长期 Data URL 表示真实资源。

建立统一接口：

```ts
interface MediaUploadService {
  upload(input: UploadMediaInput): Promise<MediaResource>
}
```

需要确认：

- multipart、预签名或直传；
- 文件限制；
- 上传进度和取消；
- 资源 ID；
- URL 是否永久；
- 删除语义；
- 图片、视频和音频是否统一资源模型。

Mock 模式建议使用 Blob URL、IndexedDB 或固定测试资源，不把大文件 Base64 长期写入 localStorage。

## 12. 能力注册表

建议统一能力状态：

```ts
export type CapabilityStatus =
  | 'available'
  | 'readonly'
  | 'mock-only'
  | 'unsupported'
```

页面行为：

- `available`：正常调用；
- `readonly`：隐藏编辑入口；
- `mock-only`：HTTP 模式禁止调用；
- `unsupported`：提前禁用并说明；
- 暂缓功能不进入当前验收。

优先覆盖资源库写操作、注册、第三方登录、取消重试、导入导出和剪映工程导出。

## 13. 常见问题

### 13.1 请求仍使用 Mock

确认：

```dotenv
VITE_API_MODE=http
```

修改环境变量后重新启动 Vite。

同时检查页面、Store 和 Service 是否直接引用：

- `*.mock.ts`；
- `generateMock*`；
- `src/mocks/*`；
- localStorage 业务辅助函数。

### 13.2 请求地址重复前缀

错误：

```text
/admin-api/admin-api/aidrama/projects
```

业务模块只写 `/aidrama/...`。

### 13.3 页面获得 undefined

确认共享拦截器是否已经解包 `{ code, msg, data }`。如果已解包，HTTP Adapter 中不要再次读取 `.data`。

### 13.4 接口成功但页面状态没有更新

检查：

- 任务是否只是提交成功；
- Workspace 是否已经写入结果；
- 前端是否刷新 Workspace；
- Mapper 是否识别状态枚举；
- Store 是否被旧草稿覆盖。

### 13.5 刷新后登录或任务丢失

检查：

- Session Repository 是否持久化；
- Token 是否过期；
- 是否支持任务按项目查询；
- 页面初始化是否恢复运行中任务；
- 草稿加载是否覆盖任务结算结果。

### 13.6 HTTP 模式点击后才提示不支持

该功能未接入能力注册表。应在渲染按钮前读取能力状态，而不是依赖 Adapter 抛出 unsupported。

## 14. 提交前检查

- [ ] Mock 模式主流程仍可运行
- [ ] HTTP 模式目标模块不调用 Mock
- [ ] 页面和 Store 未新增直接 HTTP 请求
- [ ] DTO 和领域模型通过 Mapper 隔离
- [ ] 路径、参数、响应和错误已有测试
- [ ] 未支持能力已提前禁用
- [ ] 刷新后状态正确
- [ ] `pnpm test` 通过
- [ ] `pnpm build` 通过
- [ ] 接口状态矩阵已更新
- [ ] 新环境变量已记录
- [ ] PR 描述记录接口版本和未确认项

## 15. 联调 PR 记录模板

```text
后端接口版本或导出日期：
联调环境：
本次模块：
接口状态变化：
新增或修改接口：
请求 DTO：
响应 DTO：
枚举和时间变化：
Mapper：
能力状态：
契约测试：
浏览器验证：
刷新恢复验证：
仍未确认项：
```

通过该流程，后端接口到位后的主要改动应集中在 HTTP Adapter、DTO、Mapper、能力状态和测试，而不是重新修改业务页面。