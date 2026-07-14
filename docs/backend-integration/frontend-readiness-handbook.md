# 前端后端接入准备度手册

## 1. 适用范围

本文用于当前后端尚未完整交付的阶段。详细的模块结构、DTO/Mapper 示例、测试要求和联调流程继续参见：

```text
docs/frontend-backend-integration-guide.md
```

本手册补充三件事：

1. 如何判断接口是否真的可接入；
2. 当前项目已经具备哪些接入框架；
3. 后端正式交付后，后续人员按什么顺序完成接入。

## 2. 当前原则

- 页面、组件和 Store 不直接依赖 Axios 或后端 DTO；
- 后端差异只进入 `*.http.ts`、`*.types.ts` 和 `*.mapper.ts`；
- Mock 与 HTTP 对上层返回相同领域 Contract；
- HTTP 失败时不得静默回退 Mock；
- 未确认接口通过 Capability 或稳定 ApiError 显式阻断；
- HTTP 200 或业务 `code=0` 只表示请求被接受，不证明业务副作用已经发生；
- 缺少请求 DTO 时，不能根据响应字段反推请求字段；
- Mock resultUrl、Data URL 和 Blob URL 不能作为永久后端媒体。

## 3. 证据优先级

接口事实按以下顺序判断：

1. OpenAPI/Swagger 导出或后端 DTO 源码；
2. 脱敏真实成功与失败 Fixture；
3. 后端接口文档的 Method、Path、类型和限制；
4. 前端 HTTP Adapter；
5. 前端 Mock。

低优先级证据不能覆盖高优先级证据。

## 4. 状态定义

| 状态                | 含义                                               |
| ------------------- | -------------------------------------------------- |
| `verified`          | 已完成真实成功、失败、权限、刷新恢复和页面流程验收 |
| `contract-verified` | Method、Path、DTO 和基础成功链已有真实证据         |
| `documented`        | 后端文档声明存在，但缺少完整 DTO 或 Fixture        |
| `framework-ready`   | 前端边界、Capability 和测试基础已准备              |
| `mock-only`         | 仅 Mock、占位任务或占位媒体                        |
| `controlled-reject` | 后端稳定拒绝，前端必须保持关闭                     |
| `no-op`             | 返回成功但没有真实业务副作用                       |
| `blocked`           | 缺少正式后端、算法、媒体或生产协议                 |
| `mismatch`          | 前端假设与真实响应存在明确差异                     |
| `unconfirmed`       | 请求体、响应体、状态或语义尚未确认                 |

禁止仅因为存在 HTTP 文件或收到成功包就标记为 `verified`。

## 5. 当前已有框架

### 5.1 运行配置

```text
src/config/runtimeConfig.ts
```

统一管理 Mock/HTTP 模式、Base URL、严格配置和 Capability 覆盖。业务代码不得硬编码服务器地址或公共网关前缀。

### 5.2 共享 HTTP Client

```text
src/api/http.ts
src/api/interceptors.ts
src/api/errors.ts
```

统一处理 Base URL、Bearer Token、CommonResult、ApiError、401 和 403。

### 5.3 标准模块结构

```text
src/api/modules/<module>/
├─ <module>.api.ts
├─ <module>.http.ts
├─ <module>.mock.ts
├─ <module>.types.ts
├─ <module>.mapper.ts
└─ index.ts
```

调用方向：

```text
Page / Component
-> Store / Feature State
-> Domain Service
-> ApiContract
-> MockAdapter | HttpAdapter
-> Shared HTTP Client
```

### 5.4 CapabilityRegistry

```text
src/features/capabilities/capabilityRegistry.ts
```

未完成能力使用 `available`、`mock-only`、`readonly` 或 `unsupported` 控制。不能通过环境变量强行开放未确认 DTO 的接口。

### 5.5 编辑器持久化

```text
src/services/editor/editorPersistence.service.ts
src/stores/editor.ts
src/api/modules/editor/
```

分区包括 Script、Setting、Storyboard、Video、Dubbing 和 ProjectMeta。路由只加载需要的分区；未实现分区显式拒绝；401、403、500 和契约错误不得转换为空数据。

### 5.6 生成任务与媒体

GenerationTaskGateway、任务状态和媒体抽象已经存在。真实生成接入仍需业务 Submit、任务查询、Callback、结果 DTO、上传和资源 URL 生命周期。

## 6. 当前证据范围

### 6.1 已有真实证据

- Auth 账号密码登录；
- Auth Profile；
- 有效 Token 和失效 Token 401；
- Project `list/total`、详情和可清理 CRUD；
- Script Workspace 读取；
- Script Draft `rawText/prompt` 保存和回读。

### 6.2 仅后端文档声明

- Project 扩展接口；
- Storyboard Workspace、CRUD、sort 和 confirm；
- Project Asset 与 Resource Library；
- System Status；
- Voices；
- Script Templates；
- Generation Tasks list/detail/cancel/retry；
- Project export compat 查询。

这些接口必须先保存真实 Fixture，再决定是否开放。

### 6.3 Mock 或占位

- Script Generate；
- Storyboard Generate；
- Project start-generation；
- Provider Sandbox；
- Mock Export；
- 图片、视频和 TTS resultUrl。

### 6.4 受控拒绝或 No-op

受控拒绝：Project Import、System styles/permissions write、Generation create/update。

No-op：System message read、read-all 和 clear。

### 6.5 当前阻塞

- 真实 Image2、Seedance 和 TTS；
- 真实视频合成和下载；
- 媒体上传、OSS/CDN 和 URL 生命周期；
- Script Content 请求 DTO；
- revision/version 和 409；
- 生产 Session、Refresh、正式域名和 HTTPS。

## 7. Script Content 的处理

后端文档列出 `PUT /script/content`，但没有请求体示例。真实探测中，猜测的 `{ content }` 返回成功包但没有产生可回读的内容。

因此：

- 前端不再继续猜测字段；
- 生成稿非空时抛出 `EDITOR_SCRIPT_CONTENT_CONTRACT_UNCONFIRMED`；
- 已确认的 `rawText/prompt` Draft 保存继续可用；
- 后端提供 DTO 或 OpenAPI 后，只修改 Adapter、Mapper 和测试。

## 8. 标准接入步骤

1. 在状态矩阵登记为 `documented` 或 `unconfirmed`；
2. 获取后端版本、OpenAPI、Request DTO、Success/Failure Fixture；
3. 冻结前端稳定 Contract；
4. 定义 Backend DTO；
5. 编写 Mapper；
6. 只修改 HTTP Adapter；
7. 保存脱敏 Fixture；
8. 覆盖路径、Body、分页、空值、401、403、404、5xx 和未知枚举；
9. 在 HTTP 模式完成页面和刷新恢复验收；
10. 更新 Capability 和状态。

只有完成第 9 步后才能升级为 `verified`。

## 9. 后端最小交付资料

```text
backend commit:
OpenAPI export:
method + path:
request DTO:
success response:
empty response:
validation error:
401 / 403 / 404:
status enums:
timezone:
pagination:
idempotency and retry:
file and media rules:
known mock/no-op/controlled-reject behavior:
```

## 10. 推荐后续顺序

```text
Auth/Profile
-> Project 页面验收
-> Script Draft
-> Storyboard CRUD
-> Project Asset
-> Resource Library
-> Voice / Script Template
-> Generation Task 查询与控制
-> 真实生成 Submit
-> Media Upload
-> Export
```

真实 Image、Video、TTS 和 Export 必须等待算法、Callback、媒体存储和下载契约完整后再接入。
