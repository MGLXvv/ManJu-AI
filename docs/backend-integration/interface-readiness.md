# 后端接口可接入性与成熟度矩阵

## 1. 文档目的

本文根据以下证据重新判断 ManJu-AI 当前后端接口是否适合前端接入：

1. 后端提供的 `Frontend Integration Pack`；
2. 后端提供的 `Frontend API Compat Phase1 Update Notes`；
3. 前端仓库已有 HTTP Adapter、Capability Registry、Fixture 和契约测试；
4. 2026-07-13 至 2026-07-14 通过 WireGuard 完成的真实登录、项目 CRUD、失效 Token 和 Script Workspace 联调结果。

这里的“可接入”分为两层：

- **可编写 Adapter**：接口路径和基本 DTO 已有文档，可以准备适配代码；
- **可作为真实功能开放**：接口已经完成真实成功、失败、权限、刷新恢复和业务副作用验证。

二者不能混为一谈。

## 2. 状态定义

| 状态                | 含义                                           | 前端处理原则                                               |
| ------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| `LIVE_VERIFIED`     | 已在真实测试环境完成主要业务闭环               | 可以接入并开放，但仍要保留 Capability 和错误处理           |
| `LIVE_PARTIAL`      | 真实环境只验证了部分接口或部分字段             | 只保留已验证部分，其余能力默认关闭                         |
| `CONTRACT_READY`    | 后端文档给出路径和 DTO，但前端尚未完成真实验证 | 可以准备 DTO、Mapper、Fixture 和 Adapter，不得宣称功能完成 |
| `MOCK_ONLY`         | 后端只是 Mock、Sandbox 或兼容占位行为          | 仅用于页面联调和状态机测试，不作为真实业务能力             |
| `CONTROLLED_REJECT` | 后端明确稳定拒绝该操作                         | UI 默认隐藏或禁用，不应把稳定错误当成接入完成              |
| `NO_OP`             | 接口返回成功，但没有真实业务副作用             | 只能用于兼容，不得在产品层宣称功能生效                     |
| `BLOCKED`           | 缺少真实算法、媒体、存储或生产流程             | 不编写猜测型业务 Adapter，只保留抽象和能力占位             |
| `UNKNOWN`           | 文档、代码和真实环境证据不足或互相矛盾         | 必须等待后端补充契约或提供可验证环境                       |

## 3. 核心结论

后端文档中的 `READY` 主要表示：

- Controller 或兼容路由存在；
- CommonResult 契约可以返回；
- MockMvc 或 Smoke Suite 能通过；
- Mock、Sandbox 或占位数据可以支持前端流程。

它**不等于**：

- 真实 AI 算法已经接入；
- 数据一定真实持久化；
- 页面完整业务闭环已经完成；
- 异步任务、媒体、导出和回调达到生产可用状态。

前端判断接口成熟度时，证据优先级为：

```text
真实环境可重复验证
> 后端当前部署代码与数据库副作用
> 后端版本化接口文档
> Swagger/OpenAPI 当前页面
> 前端已有猜测或预留路径
```

## 4. 当前可直接接入的接口

### 4.1 Auth：`LIVE_VERIFIED`

已真实验证：

| Method | Path                                | 结论                                            |
| ------ | ----------------------------------- | ----------------------------------------------- |
| POST   | `/system/auth/login`                | 账号密码登录可用                                |
| GET    | `/system/auth/profile`              | Bearer Token 可读取用户资料、角色和权限         |
| GET    | `/system/auth/profile` + 无效 Token | 后端会拒绝失效 Token，前端 401 清理和跳转已验证 |

当前限制：

- Token 是不透明 Session Token，不是 JWT；
- 后端重启后旧 Token 可能失效；
- 暂无可验证的 Refresh Token 换新接口；
- 低权限账号的真实 403 仍未完成验收。

### 4.2 Project 基础 CRUD：`LIVE_VERIFIED`

已真实验证：

| Method | Path                            | 结论                                  |
| ------ | ------------------------------- | ------------------------------------- |
| GET    | `/aidrama/projects`             | `data.list / data.total` 分页契约可用 |
| POST   | `/aidrama/projects`             | 可创建临时项目                        |
| GET    | `/aidrama/projects/{projectId}` | 可读取项目详情                        |
| PUT    | `/aidrama/projects/{projectId}` | 可更新项目名称                        |
| DELETE | `/aidrama/projects/{projectId}` | 可逻辑删除项目                        |

真实验证链路：

```text
login -> profile -> create -> detail -> rename -> detail -> delete -> list absence
```

前端可把 Auth 与 Project 基础 CRUD 作为当前真实后端接入基线。

## 5. 只完成部分真实验证的接口

### 5.1 Script Workspace：`LIVE_PARTIAL`

已真实确认：

- `GET /aidrama/projects/{projectId}/script/workspace` 可读取工作区；
- `PUT /aidrama/projects/{projectId}/script/draft` 可保存并回读 `rawText`、`prompt`；
- 临时项目的失败补偿删除可用。

尚未形成可靠闭环：

- `PUT /script/content` 虽可能返回 `code=0`，但生成稿没有稳定形成可确认的真实业务状态；
- `POST /script/confirm` 无法作为完整 Script 闭环验收；
- `/script/generate` 文档明确为同步 Mock 生成，不调用真实大模型；
- 后端没有确认 revision/version/409 并发冲突契约。

处理原则：

- 可以保留 Script Workspace 与 Draft 的 DTO、Mapper 和 Adapter 边界；
- 生成稿保存、确认和进入下一阶段的 HTTP Capability 默认关闭；
- 不继续通过猜字段方式修复未完成后端实现；
- 后端完成后重新执行可清理的真实闭环验证。

## 6. 可以准备 Adapter、但不能标记完成的接口

以下接口在两份后端文档中有明确路径或 Compat 说明，适合准备 DTO、Mapper、Fixture 和 HTTP Adapter，但必须保持未验证状态。

### 6.1 Project 扩展能力：`CONTRACT_READY`

- `POST /aidrama/projects/batch-delete`
- `POST /aidrama/projects/{projectId}/copy`
- `GET /aidrama/projects/statistics`
- `GET /aidrama/projects/{projectId}/overview`
- `GET /aidrama/projects/{projectId}/tasks`
- `GET /aidrama/projects/{projectId}/pipeline`

`POST /aidrama/projects/{projectId}/start-generation` 属于 Mock Pipeline，不应归入真实生成能力。

### 6.2 Storyboard 数据接口：`CONTRACT_READY`

可以准备：

- Storyboard Workspace；
- 分镜列表；
- 新增、更新、删除；
- 排序；
- 确认状态读取。

注意：

- `/storyboard/generate` 是 Mock 生成；
- 必须等待 Script 真正确认后再验收完整业务链；
- 当前前端不得把“能返回一组 Mock 分镜”视为真实生成完成。

### 6.3 Project Asset：`CONTRACT_READY`

可以准备：

- 项目资产 Workspace；
- CHARACTER、SCENE、PROP CRUD；
- 收藏、批量删除；
- `extraJson` 字符串 Mapper。

`generate-image` 只创建 Mock 任务，不能作为真实图片生成能力开放。

### 6.4 Resource Library：`CONTRACT_READY`

后端文档给出 Workspace、分页、CRUD、保存到资源库和导入项目的契约。前端已有资源库抽象和 Capability 保护，但尚未完成真实环境 CRUD 验证。

### 6.5 Voice Catalog：`CONTRACT_READY`

`/voices` 列表、创建、更新、删除属于轻量目录接口，不等于真实 TTS Provider 已完成。

### 6.6 Script Template：`CONTRACT_READY`

`/script-templates` 列表、创建、更新、删除属于模板目录，不等于 Script AI 生成能力已完成。

### 6.7 Generation Task 查询与控制：`CONTRACT_READY`

可以准备：

- `GET /generation/tasks`
- `GET /generation/tasks/{id}`
- `POST /generation/tasks/{id}/cancel`
- `POST /generation/tasks/{id}/retry`

仍需真实确认：

- 分页 Envelope；
- 状态枚举；
- 哪些状态允许取消或重试；
- 任务刷新后的恢复；
- requestId/providerTaskId；
- 轮询、SSE 或 WebSocket 策略。

## 7. 只能作为 Mock 或兼容占位的接口

### 7.1 AI 生成相关：`MOCK_ONLY`

- Script 同步 Mock 生成；
- Storyboard Mock 生成；
- Asset 图片 Mock 任务；
- Mock Pipeline；
- Provider Sandbox running/success/failed/callback；
- Mock Export。

这些接口可以验证：

- 页面 Loading、成功、失败状态；
- 任务状态机；
- 结果 Mapper；
- 刷新恢复框架；
- Callback 幂等设计。

不能验证：

- 真实模型效果；
- 真实任务耗时和并发；
- 真实媒体 URL；
- 算法错误码；
- 真实 Provider Callback；
- 真实导出成片。

### 7.2 System Messages：`NO_OP`

- 消息已读；
- 全部已读；
- 清空消息。

当前只保证兼容成功，不代表消息中心真正持久化。

## 8. 明确不能接入为真实功能的接口

### 8.1 `CONTROLLED_REJECT`

- System styles 写入、更新、删除；
- System permissions 写入、更新、删除；
- 前端直接创建通用 Generation Task；
- 前端直接 PATCH Generation Task；
- 项目导入。

前端处理：

- Capability 默认关闭；
- UI 隐藏或禁用；
- 不通过捕获稳定 400 后继续伪装成功。

### 8.2 `BLOCKED`

- 真实 Image2；
- 真实 Seedance 视频；
- 真实 TTS Provider；
- 真实 Export 合成；
- 配音混流、字幕、水印；
- 统一媒体上传和对象存储；
- 生产级 Refresh Token；
- Nginx 正式域名、HTTPS 和生产网关。

前端只保留：

- GenerationTaskGateway；
- MediaUploadService；
- 轻量生成结果；
- Workspace 刷新；
- Capability Registry；
- HTTP Adapter 空实现或明确 Unsupported 错误。

## 9. 接口开放规则

接口只有同时满足以下条件，才能从 `CONTRACT_READY` 或 `LIVE_PARTIAL` 升级为 `LIVE_VERIFIED`：

1. 后端提供版本化契约或 OpenAPI 导出；
2. 前端保存脱敏真实成功响应 Fixture；
3. 请求 Method、Path、Query、Body 已验证；
4. 数据真实写入并能重新读取；
5. 业务失败不是只看 HTTP Status，而是验证 CommonResult `code/msg`；
6. 401、403 和至少一种业务错误已验证；
7. 刷新或重新进入页面后状态可恢复；
8. Mock 模式没有回归；
9. CI 契约测试、单元测试和构建通过；
10. 写操作测试数据已清理。

未满足以上条件时，不得通过 `VITE_ENABLED_CAPABILITIES` 强制开放给用户。
