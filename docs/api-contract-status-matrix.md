# ManJu-AI 接口契约状态矩阵

> 本文记录前端代码准备度和真实后端联调成熟度。接口存在、Swagger 可见、Smoke 通过或返回 `code=0`，均不自动等于真实业务功能已经完成。
>
> 更细的接口级判断见 [`backend-integration/interface-readiness.md`](./backend-integration/interface-readiness.md)。

## 1. 状态定义

| 状态                | 含义                                                     |
| ------------------- | -------------------------------------------------------- |
| `mock-ready`        | Mock 模式可用于前端开发、演示和回归                      |
| `http-reserved`     | 已有 HTTP Adapter 或后端文档契约，但没有真实环境验证     |
| `http-partial`      | 真实环境只验证了部分接口、字段或业务副作用               |
| `readonly`          | HTTP 模式只允许已确认的读取能力                          |
| `controlled-reject` | 后端明确稳定拒绝该操作，UI 不应宣称可用                  |
| `no-op`             | 接口返回成功，但当前没有真实业务副作用                   |
| `blocked`           | 缺少真实算法、上传、存储或生产流程                       |
| `verified`          | 已完成真实环境请求、响应、写后读、清理和主要页面行为验证 |
| `deferred`          | 当前版本明确暂缓                                         |

`verified` 不代表生产上线，只表示当前测试环境的约定已被前端真实验证。

## 2. 当前模块矩阵

| 模块                                           | 当前状态            | 已确认基础                                                                 | 主要缺口                                                                  | 后续接入位置                                                    |
| ---------------------------------------------- | ------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Auth Password Login / Profile                  | `verified`          | 登录、Bearer Token、Profile、刷新恢复、无效 Token 401 已真实验证           | 缺少低权限账号的真实 403；无 Refresh Token 换新接口                       | `auth.http.ts`、Session Bridge、错误映射                        |
| Project 基础 CRUD                              | `verified`          | 列表 `data.list/total`、详情、创建、重命名、删除和删除后列表确认已真实验证 | 批量删除、复制、统计、概览、任务和 Pipeline 未真实验收                    | `project.http.ts`、DTO、Mapper                                  |
| Project Import                                 | `controlled-reject` | Phase1 提供稳定拒绝                                                        | 没有真实导入能力                                                          | Capability 默认关闭                                             |
| Project Export / Export Task                   | `blocked`           | 有 Mock/兼容查询契约                                                       | 不生成真实成片，媒体合成和下载生命周期未完成                              | Export Service、Task Gateway、Capability                        |
| Script Workspace / Draft                       | `http-partial`      | Workspace 可读；`rawText`、`prompt` 可写后回读                             | 生成稿保存和确认未形成可靠闭环；生成接口为同步 Mock；无 revision/409 契约 | Editor HTTP Adapter、Script Mapper、Persistence Service         |
| Script AI Generation                           | `blocked`           | 页面、Mock 流程和任务抽象存在                                              | 后端文档明确不调用真实大模型                                              | GenerationTaskGateway、Script Domain Service                    |
| Storyboard Data / CRUD                         | `http-reserved`     | 后端文档提供 Workspace、列表、CRUD、排序和确认路径                         | 未完成真实 CRUD、权限、刷新恢复和写后读                                   | Storyboard Adapter、Mapper、Workspace Refresh                   |
| Storyboard Generation                          | `mock-ready`        | Mock 生成契约可用于页面和状态机                                            | 无真实生成算法                                                            | GenerationTaskGateway                                           |
| Project Asset CRUD                             | `http-reserved`     | 文档提供 CHARACTER、SCENE、PROP Workspace 和 CRUD                          | 未完成真实环境 CRUD；`extraJson`、资源所有权仍需确认                      | Asset/Setting Adapter、Mapper                                   |
| Asset Image Generation                         | `blocked`           | Mock 任务入口和轻量结果框架存在                                            | 真实 Image2 未接入                                                        | GenerationTaskGateway、MediaUploadService                       |
| Resource Library                               | `http-reserved`     | 后端文档提供 Workspace、分页、CRUD、保存和导入契约                         | 未完成真实 CRUD、作用域和资源复制验收                                     | Resource Adapter、Mapper、Capability                            |
| Voice Catalog                                  | `http-reserved`     | Phase1 提供轻量 `/voices` CRUD 契约                                        | 未完成真实 CRUD；不代表真实 TTS 可用                                      | Voice Adapter、Capability                                       |
| TTS / Dubbing Generation                       | `blocked`           | 页面、Mock 卡片和任务结果框架存在                                          | 真实 TTS Provider、音频存储和台词版本未完成                               | GenerationTaskGateway、Dubbing Workspace、MediaUploadService    |
| Script Template                                | `http-reserved`     | Phase1 提供轻量模板 CRUD 契约                                              | 未完成真实 CRUD；作用域和所有权待确认                                     | Template Adapter、Mapper                                        |
| Generation Task List / Detail / Cancel / Retry | `http-reserved`     | Phase1 提供查询、取消和重试契约；前端已有统一 Task Gateway                 | 未确认真实分页、状态、可取消规则、恢复和轮询策略                          | Generation HTTP Adapter、Task Gateway                           |
| Generic Generation Task Create / Patch         | `controlled-reject` | 后端明确稳定拒绝                                                           | 只能通过具体业务生成接口创建任务                                          | Capability 默认关闭                                             |
| Video Generation                               | `blocked`           | 前端任务、批处理、刷新恢复和轻量结果边界已准备                             | 真实 Seedance、媒体 URL、异步状态和回调未完成                             | GenerationTaskGateway、Storyboard Workspace、MediaUploadService |
| Provider Sandbox                               | `mock-ready`        | 可模拟 RUNNING、SUCCESS、FAILED 和 Callback                                | 依赖合法 Mock Task；结果 URL 是占位地址                                   | 仅用于状态机测试，不作为真实能力                                |
| System Read                                    | `http-reserved`     | Phase1 提供轻量系统状态接口                                                | 未完成页面真实验收                                                        | System Adapter                                                  |
| System Messages Write                          | `no-op`             | 已读、全部已读和清空接口返回兼容成功                                       | 没有真实消息中心副作用                                                    | UI 可兼容，不宣称完成                                           |
| System Styles / Permissions Write              | `controlled-reject` | 后端明确稳定拒绝                                                           | 无真实写入能力                                                            | Capability 默认关闭                                             |
| Media Upload                                   | `blocked`           | 前端已有 MediaUploadService 和稳定媒体引用边界                             | 未冻结 multipart、预签名 URL、mediaId、删除和 URL 生命周期                | MediaUpload HTTP Adapter                                        |
| Registration / Code Login / Third-party Login  | `deferred`          | 页面或 Mock 占位保留                                                       | 不属于当前交付范围                                                        | 独立需求和接口立项                                              |
| Team / Points / Billing                        | `deferred`          | 可能存在页面占位                                                           | 业务规则、权限和后端均未确认                                              | 独立需求和接口立项                                              |

## 3. 当前真实验证基线

### Auth

```text
login
-> profile with valid token
-> profile with intentionally invalid token
-> backend rejects with 401
-> frontend clears session and returns to login
```

### Project

```text
login
-> profile
-> create temporary project
-> read detail
-> rename
-> read updated detail
-> delete
-> filtered list confirms absence
```

### Script

```text
workspace read: passed
rawText/prompt save and reload: passed
generated content save and confirmation: not closed
cleanup of temporary projects: passed
```

因此 Script 只能保持 `http-partial`，不能升级为 `verified`。

## 4. 前端已经具备的接入基础

以下基础设施已经完成，不应在后续模块中重复实现：

- `runtimeConfig`：Mock/HTTP 模式、Base URL 和严格配置；
- Shared HTTP Client：CommonResult、Bearer、401/403 和错误归一化；
- `CapabilityRegistry`：页面与 Service 双层能力保护；
- `GenerationTaskGateway`：轮询、超时、恢复、并发、取消和重试；
- `EditorPersistenceService`：分区脏状态、自动保存、flush 和冲突状态；
- `MediaUploadService`：本地媒体和未来真实上传的统一抽象；
- HTTP/Mock 依赖边界检查；
- Adapter Fixture、契约测试、Mock E2E 和视觉回归。

后续真实接口接入应主要修改：

```text
src/api/modules/<module>/*.http.ts
src/api/modules/<module>/*.types.ts
src/api/modules/<module>/*.mapper.ts
src/features/capabilities/capabilityRegistry.ts
tests/fixtures/http/*
tests/unit/api/modules/*
```

如果接入一个接口需要大面积修改页面和 Store，说明稳定 Contract 或 Domain Service 边界仍有问题。

## 5. 状态升级规则

从 `http-reserved` 或 `http-partial` 升级为 `verified`，必须同时满足：

- 后端版本或 OpenAPI 日期已记录；
- Method、Path、Query、Body 和 Content-Type 已确认；
- 保存脱敏真实成功 Fixture；
- 写操作完成写后重新读取；
- 业务状态推进可重新读取；
- 401、403 和至少一种业务失败已验证；
- 页面刷新或重新进入后可以恢复真实状态；
- Mock 模式没有回归；
- TypeScript、单元测试、契约测试、构建和 E2E 通过；
- 临时测试数据已清理。

以下行为不能作为升级依据：

- 仅新增 `*.http.ts`；
- 仅根据 Swagger 编写 DTO；
- 仅收到 HTTP 200；
- 仅收到 CommonResult `code=0`；
- 仅通过 MockMvc 或 Smoke Suite；
- 仅通过 `VITE_ENABLED_CAPABILITIES` 强制开放。

详细实施步骤见：

- [`backend-integration/frontend-adapter-playbook.md`](./backend-integration/frontend-adapter-playbook.md)
- [`backend-integration/http-module-template.md`](./backend-integration/http-module-template.md)
