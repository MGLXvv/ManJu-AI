# ManJu-AI 前端后端接入准备与风险治理计划

> 状态：前端 Mock 主流程可用于演示和验收，后端接口尚未完整交付。  
> 目标：在不猜测后端实现的前提下，先把前端改造成边界稳定、契约可替换、任务可恢复、状态可持久化、测试可验证的接口接入基础。

## 1. 当前阶段结论

当前项目已经具备以下基础：

- Vue、Pinia、Service、API Module 分层基本形成；
- 主要模块具备 Mock/HTTP 双实现入口；
- 页面和 Store 大部分不直接调用 Axios；
- 项目、文案、设定、分镜、视频、配音、完成页的 Mock 流程可以继续作为前端回归基线；
- DTO、Mapper、统一错误处理和生成任务类型已有初步结构。

但当前仍不能把“已经预留 HTTP 文件”理解为“后端接入已经完成”。真实接入前的主要风险集中在：

1. 异步生成任务尚未形成统一可恢复链路；
2. HTTP 模式下编辑器草稿只保存部分字段；
3. 登录会话、Token 刷新和明文密码存储存在风险；
4. Mock、HTTP、业务端点和通用任务端点仍有并行路径；
5. 运行模式默认回退 Mock，容易造成假联调；
6. 生成结果仍依赖完整 `shot`、`asset`、`card` 对象；
7. 上传和本地草稿可能长期保存 Base64 数据；
8. CI、浏览器主流程和契约测试尚未形成强制门禁。

因此下一阶段不应继续大量增加页面功能，而应优先完成“前端接口接入准备层”。

## 2. 本阶段目标与非目标

### 2.1 本阶段目标

- 页面、组件、Store 不感知真实后端 DTO；
- 后端字段变化只影响对应模块的 HTTP Adapter、DTO 和 Mapper；
- Mock 与 HTTP 使用同一组前端领域契约；
- 所有异步生成任务通过统一任务网关和状态机处理；
- 刷新页面后可以恢复任务、草稿和已生成媒体状态；
- 未接入能力能够明确标识为 `mock-only`、`readonly` 或 `unsupported`；
- HTTP 模式不会静默使用 Mock 结果；
- 接口到位后可以通过固定步骤完成接入、测试和验收。

### 2.2 本阶段非目标

- 不实现真实后端服务；
- 不猜测尚未确认的后端字段和响应结构；
- 不接入真实视频、TTS 或图片模型；
- 不提前实现未确认的计费、团队、积分或第三方登录；
- 不为了匹配临时接口而修改大量页面领域模型。

## 3. 风险登记表

| 编号 | 风险 | 等级 | 当前表现 | 前端准备目标 |
|---|---|---:|---|---|
| R-01 | 异步生成任务未闭环 | P0 | HTTP 模式主要是提交后立即读取结果，缺少统一轮询和恢复 | 建立统一任务网关、状态机、轮询、取消、重试和恢复接口 |
| R-02 | 草稿持久化不完整 | P0 | HTTP 保存主要覆盖文案字段，分镜、设定、视频和配音状态缺少统一保存规则 | 建立草稿分区、版本号、脏状态和保存责任矩阵 |
| R-03 | 认证与会话安全 | P0 | 记住密码保存明文；刷新 Token 和正式退出语义未确定 | 删除明文密码保存，抽离 Session Repository，预留刷新机制 |
| R-04 | 接口路径和文档漂移 | P1 | `/api`、`/admin-api`、`/projects`、`/aidrama/projects` 曾并存 | 路径常量化，文档、测试和代码统一 |
| R-05 | 默认回退 Mock | P1 | 环境变量缺失或拼错时自动进入 Mock | 测试和生产构建启用严格模式，页面显示当前 API 模式 |
| R-06 | Mock/HTTP 边界污染 | P1 | 正式入口仍可能导出 Mock 常量，HTTP 层引用 Mock 数据 | Mock 工具只允许被 Mock Adapter 使用 |
| R-07 | 结果对象耦合过重 | P1 | 生成结果要求返回完整 `shot`、`asset` 等前端对象 | 目标结果改为 ID、URL、任务信息，成功后刷新 Workspace |
| R-08 | 环境配置硬编码 | P1 | Vite 中存在固定服务器和临时域名 | 所有服务地址、代理、允许域名改为环境配置 |
| R-09 | 自动化门禁不足 | P1 | 缺少稳定 CI、E2E 和契约测试 | 建立安装、类型检查、单测、构建、主流程 E2E 门禁 |
| R-10 | Base64 和 localStorage 容量 | P2 | 上传图片可能以 Data URL 写入草稿 | 上传抽象返回文件引用；Mock 大文件使用 IndexedDB 或 Blob URL |
| R-11 | 未支持能力操作后才报错 | P1 | HTTP 写操作部分直接抛 unsupported | 建立能力注册表，页面提前禁用或隐藏 |
| R-12 | 交付范围误判 | P1 | Mock 可演示功能容易被理解为真实能力已完成 | 在页面、文档和验收清单中区分 Mock、HTTP 预留、已联调、已验收 |

## 4. 目标前端架构

### 4.1 普通业务请求

```text
Page / Component
  -> Store / Feature State
  -> Domain Service
  -> ApiContract
  -> MockAdapter | HttpAdapter
  -> Shared HTTP Client
```

约束：

- Page 和 Component 不导入 `http`、Axios、后端 DTO 或 `*.mock.ts`；
- Store 不处理后端字段兼容；
- Service 只依赖稳定前端契约；
- HttpAdapter 负责请求、DTO、Mapper 和特殊响应适配；
- MockAdapter 负责前端演示和失败场景模拟；
- MockAdapter 和 HttpAdapter 对上层返回相同领域模型。

### 4.2 AI 生成任务

```text
Page / Store
  -> Generation Domain Service
  -> GenerationTaskGateway
  -> create task
  -> poll / subscribe task
  -> success / failed / cancelled / timeout
  -> refresh related workspace
  -> map workspace to domain model
  -> update Store
```

禁止页面分别实现图片、视频、配音轮询。业务类型差异通过任务 `type`、payload Mapper 和结果处理器表达。

### 4.3 编辑器持久化

```text
Editor Store
  -> EditorPersistenceService
  -> ScriptWorkspaceAdapter
  -> AssetWorkspaceAdapter
  -> StoryboardWorkspaceAdapter
  -> DubbingWorkspaceAdapter
```

如果后端最终提供聚合草稿接口，可在 Adapter 层替换为单接口；页面和 Store 不应因此重写。

## 5. 关键前端契约

### 5.1 能力注册表

建议为每项业务能力提供统一状态：

```ts
export type CapabilityStatus =
  | 'available'
  | 'readonly'
  | 'mock-only'
  | 'unsupported'
```

至少覆盖：

- 项目导入和导出；
- 资源库增删改；
- 图片上传；
- 文案生成；
- 分镜图片生成；
- 视频生成；
- 配音生成；
- 任务取消和重试；
- 剪映工程导出；
- 注册、验证码和第三方登录。

页面必须在调用前读取能力状态，不能依赖接口抛错后再提示用户。

### 5.2 目标生成结果

当前代码仍可能要求返回完整领域对象。目标契约应逐步收敛为轻量结果：

```ts
interface GenerationArtifactResult {
  entityId: string
  taskId: string
  resultUrl?: string
  resourceId?: string
  revision?: number
}
```

处理原则：

1. 后端任务结果只返回稳定标识和资源位置；
2. 前端在任务成功后刷新对应 Workspace；
3. Workspace Mapper 负责生成完整前端领域对象；
4. Mock 模式可以继续携带完整对象，但只作为 Mock 内部实现细节；
5. 在前端完成结果解耦前，现有完整对象结果视为过渡契约，不应直接冻结为后端永久协议。

### 5.3 草稿保存契约

草稿至少需要区分以下分区：

| 分区 | 主要内容 | 建议保存触发 |
|---|---|---|
| Script | 原文、提示词、生成文案、分镜文案 | 输入防抖、显式保存、离开步骤 |
| Setting | 角色、场景、道具、候选图、音色绑定 | 资产变更后防抖保存 |
| Storyboard | 镜头顺序、标签、参考图、图片、审核状态 | 镜头变更、生成结算、离开步骤 |
| Video | 视频提示词、对白、视频地址、审核状态 | 生成结算、审核变更 |
| Dubbing | 配音卡片、角色台词、音色、音频地址、隐藏状态 | 生成结算、卡片变更 |
| Project Meta | 当前步骤、模式、比例、版本 | 步骤推进和项目设置变更 |

每次保存建议携带：

- `projectId`；
- `revision` 或 `updatedAt`；
- 保存分区；
- 客户端请求 ID；
- 是否覆盖或合并；
- 冲突处理策略。

### 5.4 认证会话契约

前端准备要求：

- 不再保存明文密码；
- 登录凭证存储通过统一 Session Repository 处理；
- Access Token、Refresh Token、Cookie 三种方案只在 Session Repository 和拦截器层体现；
- 401 需要区分“可刷新”“会话失效”“无权限”；
- 多个并发请求遇到 Token 过期时只允许触发一次刷新；
- 退出登录必须清理内存、持久化会话和敏感页面状态；
- Mock 认证数据与正式认证存储键分离。

## 6. 分阶段修复计划

## P0：基线统一和文档冻结

后端依赖：无。

任务：

- 合并并验证 PR #3 中的路径、文档和 Mock Resolver 边界修复；
- 统一 `/admin-api` 网关前缀和 `/aidrama/...` 业务资源路径；
- 增加 `.env.example`，记录 Mock、直连后端和反向代理三种配置；
- 在 `package.json` 声明 Node 与包管理器要求；
- 确认所有联调文档都引用同一接口状态矩阵；
- 建立“已确认、前端预留、后端未确认、暂缓”四种接口状态。

验收标准：

- `pnpm test` 和 `pnpm build` 通过；
- 文档路径与 HTTP 测试一致；
- 新开发者可以只根据文档启动 Mock 模式；
- 未提供环境变量时的实际行为与文档一致。

## P1：认证、运行模式和能力边界

后端依赖：无。

任务：

- 删除登录页明文密码持久化；
- 抽离 `AuthSessionRepository`，Mock 和 HTTP 共享统一会话接口；
- 把 `authStorageKeys` 和错误枚举移出 `auth.mock.ts`；
- 建立 `runtimeConfig` 校验；
- 开发模式允许默认 Mock，测试和生产模式缺少配置时明确报错；
- 页面显示当前运行模式，仅开发环境可见；
- 建立 `CapabilityRegistry`，对只读和未实现能力提前禁用。

验收标准：

- 仓库不存在保存明文密码的代码；
- HTTP 模式不会因配置拼错静默进入 Mock；
- HTTP 未实现功能不会点击后才抛异常；
- Mock 登录和 HTTP 登录使用相同 Store 行为。

## P2：统一异步生成任务层

后端依赖：无，先以 Mock Adapter 和接口桩实现。

任务：

- 建立 `GenerationTaskGateway`；
- 统一 `create`、`getById`、`listByProject`、`cancel`、`retry`；
- 建立 `queued/running/success/failed/cancelled/timeout` 状态机；
- 统一轮询间隔、最大时长、取消信号和页面卸载行为；
- 支持刷新后按 `projectId` 恢复未完成任务；
- 批量任务使用有限并发，单任务失败不终止整个批次；
- 为任务提交预留 `requestId` 或幂等键；
- 业务 Service 不再分别实现等待逻辑。

验收标准：

- Mock 模式下所有生成类型均通过同一任务网关；
- 页面刷新后可以恢复 Mock 运行中任务；
- 单个任务失败不会破坏其他批量任务；
- HTTP Adapter 尚未实现时返回明确能力状态，而不是回退 Mock。

## P3：完整编辑器持久化边界

后端依赖：无，先定义前端分区契约和 Mock 实现。

任务：

- 建立 `EditorPersistenceService`；
- 定义 Script、Setting、Storyboard、Video、Dubbing、Project Meta 六个保存分区；
- 统一脏状态、自动保存、防抖和离开页面保存；
- 引入草稿 `revision`；
- 建立保存失败、冲突、重试和未保存提示；
- Mock 模式按同一分区契约保存；
- 清理页面中分散的本地持久化调用。

验收标准：

- Mock 模式刷新页面后所有步骤状态可以恢复；
- 隐藏、审核、候选图、音色、视频和配音结果均包含在恢复测试中；
- Store 只调用 Persistence Service，不关心聚合接口还是分区接口；
- 后端到位后只需新增或替换 Adapter。

## P4：结果解耦、上传抽象和 Mock 清理

后端依赖：无。

任务：

- 将生成结果从完整领域对象逐步改为轻量结果；
- 任务成功后统一刷新 Workspace；
- 建立 `MediaUploadService`；
- 页面不再直接把文件读取为长期 Data URL；
- Mock 上传使用 Blob URL、IndexedDB 或受控测试资源；
- 清理 HTTP 层对 Mock 文件的引用；
- 清理正式 API 入口对 Mock 常量的重新导出。

验收标准：

- 后端无需构造前端完整 `shot`、`asset`、`card`；
- 上传组件只关心文件和上传结果，不关心存储方式；
- HTTP 代码路径不导入 `*.mock.ts` 或 `src/mocks/*`；
- 大图片不会直接进入 localStorage 草稿。

## P5：测试、CI 和接入门禁

后端依赖：无。

任务：

- 增加统一 CI；
- 固定 Node 和 pnpm 版本；
- 执行安装、类型检查、单元测试和构建；
- 增加 Playwright Mock 主流程；
- 增加 HTTP Adapter 契约测试和响应 Fixture；
- 增加“HTTP 模式不得引用 Mock”的静态检查；
- 增加环境变量、路径和能力矩阵一致性检查。

验收标准：

- PR 没有通过 CI 时不能合并；
- Mock 主流程从登录到完成页可自动执行；
- 每个 HTTP Adapter 至少覆盖路径、参数、Mapper、空值和错误响应；
- 修改接口路径时测试会失败，而不是等联调时发现。

## P6：真实接口接入

后端依赖：高，在接口文档和联调环境可用后执行。

执行顺序：

1. Auth；
2. Project；
3. Editor Persistence；
4. Media Upload；
5. Generation Task；
6. Setting、Voice、Storyboard；
7. Video、Dubbing；
8. Resource、System、Asset、Script Template。

每个模块只允许修改：

- `*.http.ts`；
- 后端 DTO 类型；
- Mapper；
- 契约 Fixture 和测试；
- 必要的能力状态。

如果接入一个接口需要大面积修改页面或 Store，说明前端边界尚未准备好，应先返回 P1-P4 修复，而不是继续堆兼容代码。

## 7. 下一步立即执行顺序

当前建议从以下任务开始，不等待后端：

1. 完成 PR #3 的本地 `pnpm test`、`pnpm build` 验证并合并；
2. 修复明文密码存储和认证 Mock 边界；
3. 增加 `.env.example`、Node/pnpm 版本声明和运行配置校验；
4. 建立能力注册表，先覆盖资源库写操作、注册、第三方登录、任务取消和重试；
5. 建立统一 `GenerationTaskGateway`，先迁移 Mock 生成链路；
6. 定义编辑器分区持久化契约和完整恢复测试；
7. 解耦任务结果与完整领域对象；
8. 增加 CI 和 Playwright Mock 主流程。

第一轮代码修复建议只包含第 2-4 项，保持范围小、可验证；第二轮再处理任务层；第三轮处理持久化层。

## 8. 完成定义

前端可以被认定为“后端接入准备完成”，必须同时满足：

- [ ] 页面和 Store 不直接调用 HTTP；
- [ ] HTTP 路径不依赖 Mock；
- [ ] Mock 和 HTTP 返回相同前端领域契约；
- [ ] HTTP 模式不会静默回退 Mock；
- [ ] 未支持能力在调用前可识别；
- [ ] 登录信息不存在明文密码持久化；
- [ ] 生成任务有统一状态机和恢复策略；
- [ ] 编辑器全部关键状态有明确保存责任；
- [ ] 生成结果不要求后端构造前端完整对象；
- [ ] 上传不长期依赖 Base64 + localStorage；
- [ ] 单元测试、构建和主流程 E2E 进入 CI；
- [ ] 接口状态矩阵、代码和测试保持一致。

达到以上条件后，真实接口接入的主要工作应集中在 DTO、Mapper 和 HTTP Adapter，而不是重新修改业务页面。