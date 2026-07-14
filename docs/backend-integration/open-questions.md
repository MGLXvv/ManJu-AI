# 恢复真实接口接入前待补充证据

当前后端无法继续提供 OpenAPI、DTO、真实 Fixture 或额外测试支持。本文件只保留未来恢复接入时真正需要的证据，不再把已经由 Integration Pack / Phase1 文档回答的问题列为未知。

缺少请求 DTO 或写后读证据时，前端只保留 Contract、Capability 和 Backlog，不继续猜测字段。

## 已确认

原始依据归档于 [`source/`](./source/)。当前已确认：

- 测试环境 `http://10.10.3.26:48080`、WireGuard、`/admin-api` 和 Vite Proxy；
- CommonResult、业务成功码 `code=0` 和 `data.list/data.total` 分页结构；
- Bearer 不透明 Session Token，当前没有 Refresh API；
- Project 分页与基础 CRUD；
- Script Workspace GET 和 Draft `rawText/prompt`；
- Storyboard Workspace、CRUD、sort、confirm 的 Method/Path；
- Storyboard 新增/更新的最小字段 `title/content/durationSeconds`；
- Project Asset Workspace、list/raw/detail、单实体 CRUD、favorite 和 Mock generate-image 的 Method/Path；
- Project Asset 创建字段 `type/name/description/imageUrl/extraJson`；
- `type` 支持 CHARACTER、SCENE、PROP，`extraJson` 为 JSON 字符串；
- Resource Library 的 CRUD、COPY Snapshot 和 PRIVATE/SYSTEM/SHARED；
- Voices、Script Templates 和 Generation Tasks 的 Phase1 路径与 REAL/CONTROLLED_REJECT 分类；
- Provider Callback 不是普通前端接口；
- Provider Sandbox、Image/Video/TTS resultUrl 和 Export 是 Mock/占位结果；
- 后端 Phase1 部署 commit `646a302`，`a53d8ff` 仅修改部署 PID 管理。

## Parked：有路径但不足以安全启用

### Script Content / Confirm

仍缺：

- `PUT /script/content` 的正式请求 DTO；
- 成功响应和写后重新读取规则；
- Confirm 的前置条件、成功副作用和失败响应；
- Script revision/version、expectedRevision 和 409 语义。

历史探测中 `{ content }` 获得 `code=0`，但 Workspace 未回读到内容，因此不得继续猜测。

### Project Asset 单实体 CRUD（#37）

Method/Path 和创建字段已确认，不再缺“完整路径”。恢复实现前仍需：

- 创建成功响应中的持久化实体和 ID；
- PUT 是完整替换还是允许部分字段；
- 更新后返回实体、空 data 或其他包装；
- 逻辑删除后 list/detail 的行为；
- 400、403、404 的脱敏响应；
- 可自动清理的真实写后读环境。

在这些证据缺失时，保留列表读取，不开放页面写能力。

### Storyboard Workspace 写入（#38）

Method/Path 和最小字段已确认。恢复实现前仍需：

- Workspace 和 CRUD 的完整响应 DTO；
- sort 请求体；
- confirm 的响应、副作用和失败条件；
- `storyboardReviewed`、隐藏、锁定、角色/场景/道具引用等前端领域字段是否存在后端对应字段；
- 未提供字段是否应本地保留、忽略或禁止编辑；
- 逻辑删除、排序和空 Workspace 的真实响应；
- revision/version 与 409；
- 成功、400、401、403、404 Fixture。

仅凭最小 `title/content/durationSeconds` 写入会造成页面字段刷新后丢失，因此当前只保留真实读取。

### 其他已实现接口

- Resource PRIVATE/SYSTEM/SHARED 的实际权限边界；
- save-to-library / import-from-library 的页面权限和失败响应；
- Voices、Script Templates、Generation Tasks 的脱敏真实分页与写响应 Fixture；
- Project update 的完整字段和状态枚举；
- 逻辑删除后详情响应；
- 低权限账号 403。

这些事项不影响当前 Mock 主流程和已经 live-verified 的链路，统一保持 parked。

## 真实 AI 与媒体

恢复生成任务与媒体上传前必须提供：

- Image2、Seedance、TTS 的 Submit、Task、Callback 和 Result DTO；
- 具体业务生成端点与 Generation Tasks 的关系；
- 轮询、SSE 或 WebSocket 方案；
- 幂等、取消、重试和超时；
- multipart、预签名上传或对象存储直传契约；
- 文件类型、大小、分片和媒体资源 ID；
- 永久 URL 与临时签名 URL；
- URL 刷新、删除和引用计数；
- OSS/CDN、CORS 和鉴权；
- 真实视频合成与下载。

## 认证、权限与生产协议

以下内容只在进入部署或预发布阶段恢复：

- 低权限测试账号和稳定 403 Fixture；
- 后端 Logout、生产 Session、过期和 Refresh；
- 时间字段时区；
- requestId/traceId Header；
- 跨模块错误码；
- ID、null、空字符串和缺省字段规则；
- 分页上限、排序、429 和重试；
- Nginx 正式域名、HTTPS、上传限制和超时。

## Phase1 特殊状态

### Controlled Reject

- Project Import；
- System styles/permissions write；
- Generation create/update。

### No-op

- System message read；
- read-all；
- clear。

### Mock/Placeholder

- Script Generate；
- Storyboard Generate；
- Project start-generation；
- Provider Sandbox；
- Export；
- Image、Video、TTS resultUrl。

## 恢复条件

满足以下任一项后再重新评估 #37、#38、#15、#16 和 #17：

1. 新的 OpenAPI/Swagger 或后端 DTO 源码；
2. 脱敏真实 Success/Empty/Error Fixture；
3. 可访问测试环境、测试账号和允许自动清理的写验证；
4. 真实算法或媒体契约；
5. 后端接口版本发生变化并提供变更说明。

## 后端交付模板

```text
日期：
环境：
后端 commit：
OpenAPI 导出：
模块：
Method + Path：
Request DTO：
Success Fixture：
Empty Fixture：
Validation Error：
401 / 403 / 404：
枚举：
时间与时区：
分页：
幂等与重试：
媒体规则：
Mock / No-op / Controlled Reject：
负责人：
```
