# Frontend Integration Pack

## 1. 文档目的

本文用于 `manju-ai-server` 测试环境的前端联调。接口、字段和限制以当前 `dev` 分支代码为准。

适用范围：

- 登录与鉴权
- 项目、文案、分镜、设定资产
- 资源库
- Provider Sandbox
- Mock 导出

当前不用于验收真实 Image2、Seedance 2.0、TTS 或最终视频合成质量。

## 2. 环境信息

| 项目 | 值 |
|---|---|
| 测试环境 BASE_URL | `http://10.10.3.26:48080` |
| Health URL | `http://10.10.3.26:48080/admin-api/health` |
| API 前缀 | `/admin-api` |
| 登录接口 | `POST /admin-api/system/auth/login` |
| 当前入口 | WireGuard 内网 IP + Spring Boot 端口 |
| Nginx 正式入口 | 尚未配置 |
| Provider 模式 | Image、Video、TTS 均为 Mock/Readiness，不调用真实算法 |
| Provider Sandbox | 测试环境已启用，接口仍需 Bearer Token |

联调前请确认：

1. 开发机已经连接 WireGuard。
2. `Test-NetConnection 10.10.3.26 -Port 48080` 返回成功。
3. Health 返回 HTTP 200，且响应体 `code=0`、`data.status=UP`。

### 2.1 浏览器跨域注意事项

当前后端代码没有全局 CORS 配置。前端开发服务器与 `10.10.3.26:48080` 不同源时，浏览器可能拦截直接请求，即使 curl、Postman 和 PowerShell 都能正常访问。

推荐在前端开发服务器配置代理：

```text
/admin-api -> http://10.10.3.26:48080
```

配置代理后，前端代码只请求相对路径 `/admin-api/...`。不要在各业务组件中散落硬编码 BASE_URL。

## 3. 联调准备度

本表评估“当前测试环境是否可供前端联调”，不代表真实算法或生产上线准备度。

| 模块 | 状态 | 说明 |
|---|---|---|
| Auth/Login | READY | 账号密码登录、Profile 和 Bearer 鉴权可用；Token 是不透明内存 Session，不是标准 JWT |
| Project | READY | 列表、详情、创建、更新、删除、复制、统计和概览可用；部署 Smoke 已覆盖列表与临时 CRUD |
| Script | READY | 工作区、草稿、Mock 生成、内容保存、确认可用 |
| Storyboard | READY | 工作区、Mock 生成、确认、增删改查和排序可用 |
| Asset | READY | CHARACTER、SCENE、PROP 的工作区和 CRUD 可用 |
| Resource Library | READY | 工作区、分页、CRUD、保存到资源库、导入项目可用；部署 Smoke 已覆盖列表 |
| Provider Sandbox | PARTIAL | Callback 模拟可用，但没有独立 Health 接口，必须先有合法 AI Task ID；结果 URL 只是占位地址 |
| Export | PARTIAL | 工作区、历史、详情和下载链接契约可用；当前是 Mock 导出，不生成真实成片 |

统计：

- READY：6
- PARTIAL：2
- BLOCKED：0

## 4. 通用响应契约

所有业务接口使用：

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

前端成功判断必须同时满足：

```text
HTTP 请求完成
并且 response.code === 0
```

当前全局异常处理通常仍返回 `CommonResult`。业务失败可能出现 HTTP 200，但响应体为：

```json
{
  "code": 400,
  "msg": "错误原因",
  "data": null
}
```

因此不能只根据 HTTP 状态判断业务成功。

分页响应位于 `data`：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [],
    "total": 0
  }
}
```

## 5. 登录与鉴权

### 5.1 登录

```http
POST /admin-api/system/auth/login
Content-Type: application/json
```

```json
{
  "username": "<account>",
  "password": "<password>"
}
```

`LoginReqVO` 同时支持 `account` 和 `username` 字段；当前前端建议统一使用 `username`。

成功响应关键字段：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "userId": 1,
    "username": "<username>",
    "accessToken": "<accessToken>",
    "refreshToken": "<refreshToken>",
    "tokenType": "Bearer"
  }
}
```

### 5.2 Bearer Header

除登录、短信和公开 Health 外，`/admin-api/aidrama/**` 均需要：

```http
Authorization: Bearer <accessToken>
```

示例：

```bash
curl "http://10.10.3.26:48080/admin-api/aidrama/projects?pageNo=1&pageSize=20&status=ALL" \
  -H "Authorization: Bearer <accessToken>"
```

### 5.3 当前 Token 限制

- 当前 `accessToken` 是 `dev-token-*` 格式的不透明 Session Token，不是标准 JWT。
- Session 保存在服务进程内存中，后端重启后旧 Token 失效，前端需要重新登录。
- 当前虽然返回 `refreshToken`，但没有 Refresh Token 换新接口，前端不要实现自动刷新流程。
- 前端不应解析 Token 内容，只应将其作为不透明字符串保存和发送。
- 不要在控制台、埋点或错误日志中打印 Token。

## 6. 核心接口清单

以下接口除登录外均需要 Bearer Token。

### 6.1 Auth

| Method | Path | 用途 |
|---|---|---|
| POST | `/admin-api/system/auth/login` | 账号密码登录 |
| GET | `/admin-api/system/auth/profile` | 获取当前用户信息 |
| POST | `/admin-api/system/auth/send-code` | 发送短信验证码，兼容 `/sms/send-code` |
| POST | `/admin-api/system/auth/code-login` | 验证码登录，兼容 `/sms/code-login` |
| POST | `/admin-api/system/auth/register` | 短信注册，兼容 `/sms/register` |
| POST | `/admin-api/system/auth/reset-password` | 重置密码，兼容 `/sms/reset-password` |
| POST | `/admin-api/system/auth/social/login` | 社交登录；真实平台尚未正式联调 |

### 6.2 Project

| Method | Path | 用途 |
|---|---|---|
| GET | `/admin-api/aidrama/projects?pageNo=&pageSize=&keyword=&status=` | 首页项目分页列表 |
| GET | `/admin-api/aidrama/projects/page?pageNo=&pageSize=&keyword=&status=` | 项目分页兼容入口 |
| POST | `/admin-api/aidrama/projects` | 创建项目 |
| GET | `/admin-api/aidrama/projects/{projectId}` | 项目详情 |
| PUT | `/admin-api/aidrama/projects/{projectId}` | 更新项目 |
| DELETE | `/admin-api/aidrama/projects/{projectId}` | 逻辑删除项目 |
| POST | `/admin-api/aidrama/projects/batch-delete` | 批量逻辑删除 |
| POST | `/admin-api/aidrama/projects/{projectId}/copy` | 复制项目 |
| GET | `/admin-api/aidrama/projects/statistics` | 首页项目统计 |
| GET | `/admin-api/aidrama/projects/{projectId}/overview` | 项目工作台聚合信息 |
| GET | `/admin-api/aidrama/projects/{projectId}/tasks` | 项目任务列表 |
| GET | `/admin-api/aidrama/projects/{projectId}/pipeline` | Pipeline 状态 |
| POST | `/admin-api/aidrama/projects/{projectId}/start-generation` | 启动 Mock Pipeline |

创建项目最小请求：

```json
{
  "name": "前端联调项目",
  "description": "Frontend integration",
  "aspectRatio": "16:9",
  "style": "anime",
  "language": "zh-CN",
  "durationSeconds": 60
}
```

项目响应关键字段：`id`、`name`、`status`、`statusLabel`、`statusTag`、`latestTaskStatus`、`latestErrorMessage`、`createTime`、`updateTime`。

### 6.3 Script

| Method | Path | 用途 |
|---|---|---|
| GET | `/admin-api/aidrama/projects/{projectId}/script/workspace` | 获取文案工作区 |
| PUT | `/admin-api/aidrama/projects/{projectId}/script/draft` | 保存原始文案和提示词 |
| POST | `/admin-api/aidrama/projects/{projectId}/script/generate` | 从草稿同步生成 Mock 剧本 |
| PUT | `/admin-api/aidrama/projects/{projectId}/script/content` | 手动保存剧本内容 |
| POST | `/admin-api/aidrama/projects/{projectId}/script/confirm` | 确认剧本 |
| GET | `/admin-api/aidrama/projects/{projectId}/script` | 旧剧本详情接口 |
| PUT | `/admin-api/aidrama/projects/{projectId}/script` | 旧剧本保存接口 |

保存草稿：

```json
{
  "rawText": "故事原始文案",
  "prompt": "生成三段式短剧脚本"
}
```

限制与关键字段：

- `rawText` 最大 100000 字。
- `prompt` 最大 500 字。
- `scriptStatus`：`DRAFT`、`SAVED`、`GENERATING`、`GENERATED`、`CONFIRMED`。
- `canEnterStoryboard=true` 表示剧本已确认且内容非空。
- `generate` 当前是同步 Mock 生成，不调用真实大模型。

### 6.4 Storyboard

| Method | Path | 用途 |
|---|---|---|
| GET | `/admin-api/aidrama/projects/{projectId}/storyboard/workspace` | 获取分镜工作区 |
| POST | `/admin-api/aidrama/projects/{projectId}/storyboard/generate` | 从已确认剧本 Mock 生成分镜 |
| POST | `/admin-api/aidrama/projects/{projectId}/storyboard/confirm` | 确认分镜 |
| GET | `/admin-api/aidrama/projects/{projectId}/storyboards` | 查询分镜列表 |
| POST | `/admin-api/aidrama/projects/{projectId}/storyboards` | 新增镜头 |
| PUT | `/admin-api/aidrama/projects/{projectId}/storyboards/{storyboardId}` | 在项目内更新镜头 |
| DELETE | `/admin-api/aidrama/projects/{projectId}/storyboards/{storyboardId}` | 逻辑删除镜头 |
| PUT | `/admin-api/aidrama/projects/{projectId}/storyboards/sort` | 调整镜头排序 |
| PUT | `/admin-api/aidrama/storyboards/{storyboardId}` | 旧更新兼容入口 |

新增或更新的基础字段：

```json
{
  "title": "开场",
  "content": "画面和对白描述",
  "durationSeconds": 5
}
```

关键状态和前置条件：

- 只有 `scriptStatus=CONFIRMED` 才能生成分镜。
- `storyboardStatus` 主要为 `DRAFT`、`GENERATED`、`CONFIRMED`。
- `canGenerateStoryboard` 表示剧本是否满足生成条件。
- `canEnterCharacterDesign=true` 表示至少有一条分镜且均已确认。

### 6.5 Asset

| Method | Path | 用途 |
|---|---|---|
| GET | `/admin-api/aidrama/projects/{projectId}/assets/workspace` | 设定工作区和分类统计 |
| GET | `/admin-api/aidrama/projects/{projectId}/assets` | 项目资产展示列表 |
| GET | `/admin-api/aidrama/projects/{projectId}/assets/raw?type=&keyword=&pageNo=&pageSize=` | 原始资产筛选列表 |
| POST | `/admin-api/aidrama/projects/{projectId}/assets` | 创建项目资产 |
| GET | `/admin-api/aidrama/assets/{assetId}` | 资产详情 |
| PUT | `/admin-api/aidrama/assets/{assetId}` | 更新资产 |
| DELETE | `/admin-api/aidrama/assets/{assetId}` | 逻辑删除资产 |
| POST | `/admin-api/aidrama/assets/batch-delete` | 批量逻辑删除 |
| POST | `/admin-api/aidrama/assets/{assetId}/favorite` | 收藏或取消收藏 |
| POST | `/admin-api/aidrama/assets/{assetId}/generate-image` | 创建资产图片 Mock 任务 |

创建资产：

```json
{
  "type": "CHARACTER",
  "name": "角色名称",
  "description": "角色描述",
  "imageUrl": "",
  "extraJson": "{\"prompt\":\"anime character\",\"favorite\":false}"
}
```

注意：

- `type` 只支持 `CHARACTER`、`SCENE`、`PROP`。
- 当前 DTO 中 `extraJson` 类型是字符串。请求时需要传 JSON 字符串，不要直接传对象。
- workspace 返回 `characters`、`scenes`、`props` 和 `summary`。
- `canEnterImageGeneration=true` 表示项目至少存在一个未删除资产。

### 6.6 Resource Library

| Method | Path | 用途 |
|---|---|---|
| GET | `/admin-api/aidrama/resource-library/workspace` | 资源库首页统计和最近资产 |
| GET | `/admin-api/aidrama/resource-library/assets?type=&keyword=&scope=&pageNo=&pageSize=` | 资源库分页 |
| GET | `/admin-api/aidrama/resource-library/assets/{resourceAssetId}` | 资源详情 |
| POST | `/admin-api/aidrama/resource-library/assets` | 直接创建资源 |
| PUT | `/admin-api/aidrama/resource-library/assets/{resourceAssetId}` | 更新资源 |
| DELETE | `/admin-api/aidrama/resource-library/assets/{resourceAssetId}` | 逻辑删除资源 |
| POST | `/admin-api/aidrama/assets/{assetId}/save-to-library` | 将项目资产复制到资源库 |
| POST | `/admin-api/aidrama/projects/{projectId}/assets/import-from-library` | 将资源复制到项目 |

直接创建资源：

```json
{
  "assetType": "CHARACTER",
  "name": "资源角色",
  "description": "可跨项目复用",
  "imageUrl": "",
  "extraJson": "{\"prompt\":\"anime character\"}",
  "scope": "PRIVATE"
}
```

注意：

- Resource 使用字段 `assetType`，Project Asset 使用字段 `type`，不要混用。
- `scope` 支持 `PRIVATE`、`SYSTEM`、`SHARED`，为空时默认为 `PRIVATE`。
- Phase1 创建资源时 `reviewStatus=APPROVED`。
- 保存和导入采用 COPY Snapshot；后续修改或删除一侧不会同步影响另一侧。
- `extraJson` 同样是 JSON 字符串。

### 6.7 Provider Sandbox

| Method | Path | 用途 |
|---|---|---|
| POST | `/admin-api/aidrama/provider-sandbox/tasks/{taskId}/callback` | 自定义 Callback |
| POST | `/admin-api/aidrama/provider-sandbox/tasks/{taskId}/running` | 模拟 RUNNING |
| POST | `/admin-api/aidrama/provider-sandbox/tasks/{taskId}/success` | 模拟 SUCCESS |
| POST | `/admin-api/aidrama/provider-sandbox/tasks/{taskId}/failed` | 模拟 FAILED |

Sandbox 路径属于 `/admin-api/aidrama/**`，因此必须携带 Bearer Token。它不是公开的 Provider Callback 接口。

模拟成功示例：

```http
POST /admin-api/aidrama/provider-sandbox/tasks/{taskId}/success
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "providerTaskId": "<providerTaskId>",
  "progress": 100,
  "resultUrl": "/sandbox-results/tasks/{taskId}.png"
}
```

使用限制：

- 必须先通过图片、视频或 TTS 生成接口获得合法 `taskId`。
- Sandbox 不生成真实媒体文件，`resultUrl` 只是联调占位地址。
- `providerTaskId` 已存在时，传入值必须一致。
- SUCCESS 必须有 `resultUrl`；快捷 SUCCESS 在支持的任务类型上可生成默认占位 URL。
- 重复 SUCCESS、迟到 FAILED、progress 回退受 Callback 幂等规则保护。

公开算法回调是 `POST /admin-api/aidrama/provider/callback`，该路径不要求用户 Bearer Token，但用于算法服务，不应由普通前端调用。

### 6.8 Export

| Method | Path | 用途 |
|---|---|---|
| GET | `/admin-api/aidrama/projects/{projectId}/exports/workspace` | 导出准备度、最近任务和历史 |
| POST | `/admin-api/aidrama/projects/{projectId}/export` | 创建 Mock 导出任务 |
| GET | `/admin-api/aidrama/projects/{projectId}/export/latest` | 最新导出任务兼容入口 |
| GET | `/admin-api/aidrama/projects/{projectId}/exports?pageNo=&pageSize=&status=` | 导出历史分页 |
| GET | `/admin-api/aidrama/exports/{exportTaskId}` | 导出详情 |
| GET | `/admin-api/aidrama/exports/{exportTaskId}/download-url` | 获取下载地址 |

前置条件：

- 项目至少存在一条未删除分镜。
- 所有未删除分镜必须存在 `videoUrl`。
- workspace 中 `canExport=true` 且 `missingVideoCount=0` 才能创建导出。

当前导出任务会返回 Mock `resultUrl`。前端可以联调状态、历史和按钮逻辑，但不能将该地址视为真实成片下载。

## 7. 推荐联调顺序

```text
Health
→ Login
→ Profile / Project List
→ Create Project
→ Script Draft
→ Script Generate
→ Script Confirm
→ Storyboard Generate
→ Storyboard Confirm
→ Create Character / Scene / Prop
→ Asset Workspace
→ Save Asset To Resource Library
→ Resource Library List
→ Import Resource To Project
→ Create Image / Video / Voice Task
→ Provider Sandbox Callback
→ Export Workspace / Mock Export
```

每一步的进入条件：

| 当前步骤 | 下一步条件 |
|---|---|
| 登录 | `data.accessToken` 非空 |
| 创建项目 | `data.id` 非空 |
| 文案生成 | `rawText` 非空 |
| 进入分镜 | `scriptStatus=CONFIRMED` 且 `canEnterStoryboard=true` |
| 进入设定 | `storyboardStatus=CONFIRMED` 且 `canEnterCharacterDesign=true` |
| 图片生成 | 至少存在一条分镜；资产不是强制条件，但可用于 Prompt 上下文 |
| 视频生成 | 对应分镜必须已有 `imageUrl` |
| 导出 | 所有未删除分镜必须已有 `videoUrl` |

## 8. 当前限制

### 8.1 算法与媒体

- Image2 尚未接入真实算法 HTTP 调用。
- Seedance 2.0 尚未接入真实算法 HTTP 调用。
- TTS 尚未接入真实算法 HTTP 调用。
- Mock/Sandbox 返回的图片、视频和音频 URL 不代表真实可访问媒体。
- 当前没有媒体历史版本和回滚能力。

### 8.2 导出

- Export 当前不执行真实视频合成。
- 未接配音混流、字幕、水印、CDN 或 OSS 生命周期管理。
- Mock 下载地址只用于联调字段和状态。

### 8.3 鉴权和入口

- 当前 Token 不是 JWT，服务重启后需要重新登录。
- 当前没有 Token Refresh API。
- 当前没有全局 CORS 配置，浏览器联调建议使用前端 dev proxy。
- 当前没有 Nginx 正式 API 域名，测试阶段使用 WireGuard 内网地址。

## 9. 常见问题排查

### 9.1 Health 不通

1. 确认 WireGuard 已连接。
2. 执行 `Test-NetConnection 10.10.3.26 -Port 48080`。
3. 访问 `/admin-api/health`。
4. 端口不通时联系后端检查 Java 进程和服务器监听；不要先改前端接口路径。

### 9.2 浏览器报 CORS，但 Postman 正常

原因通常是浏览器同源策略。当前后端没有全局 CORS 配置，请在 Vite/Webpack 开发服务器中代理 `/admin-api`，不要关闭浏览器安全策略。

### 9.3 `code=401`

- 账号密码错误时重新检查登录请求。
- 登录后接口出现 401，通常是 Token 不存在、格式错误、服务重启或 Session 已失效。
- Header 必须是 `Authorization: Bearer <accessToken>`。
- 清理本地 Token 后重新登录。

### 9.4 `code=403`

当前账号缺少 Controller 所需权限。记录接口路径和响应 `msg`，由后端核对权限，不要在前端绕过。

### 9.5 `code=404`

检查 `projectId`、`storyboardId`、`assetId`、`resourceAssetId` 或 `taskId` 是否存在，以及资源是否已被逻辑删除。

### 9.6 `code=400`

优先读取响应 `msg`。常见原因：

- 剧本未确认就生成分镜。
- 分镜没有图片就生成视频。
- 导出时仍有分镜缺少视频。
- `type`、`assetType` 或 `scope` 枚举不合法。
- Sandbox `providerTaskId` 不匹配。

### 9.7 `code=500`

- 保存请求 URL、Method、请求体脱敏副本、响应 `code/msg` 和发生时间。
- 不要记录密码、Token 或 API Key。
- 如果 Health 正常但单接口失败，优先按业务前置状态排查；如果 Health 也失败，再按服务故障处理。

### 9.8 HTTP 200 但页面仍失败

检查响应体 `code`。当前错误处理可能使用 HTTP 200 包装业务错误码，这是前端最容易漏掉的判断。

## 10. 当前状态摘要

### READY

- Auth/Login 测试链路
- Project
- Script Mock 工作区
- Storyboard Mock 工作区
- Asset
- Resource Library
- Health、Bearer 鉴权和 Deployment Smoke Suite

### PARTIAL

- Provider Sandbox：可模拟状态和 Callback，但依赖合法任务，结果 URL 为占位地址。
- Export：契约可联调，但没有真实成片。
- 浏览器入口：直连 API 可用，但需要前端 dev proxy；Nginx 正式入口尚未配置。

### BLOCKED

- 真实 Image2 联调：等待算法接口。
- 真实 Seedance 2.0 联调：等待算法接口。
- 真实 TTS 联调：等待算法接口。
- 真实导出和媒体质量验收：等待真实媒体链路。

## 11. 后续等待事项

1. 前端接入本文档并完成正式页面联调。
2. 算法团队提供 Image2、Seedance 2.0、TTS 的 Submit/Callback 契约和测试环境。
3. 需要统一浏览器入口时配置 Nginx 反向代理与域名/HTTPS。
4. 真实算法到位后按 Provider Integration Checklist 验证 callback、幂等、progress 和 providerTaskId。
5. 上线前将当前内存 Token 方案替换或升级为可持久化、可过期和可刷新的生产鉴权方案。
