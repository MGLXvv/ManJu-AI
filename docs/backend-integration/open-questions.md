# 后端正式交付前待确认项

以下事项必须通过 OpenAPI、后端 DTO 源码或脱敏真实 Fixture 确认。缺少请求 DTO 时，前端只保留 Contract 和 Capability，不继续猜测字段。

## 已确认

- 测试环境：`http://10.10.3.26:48080`；
- 网关前缀：`/admin-api`；
- 本地浏览器通过 Vite Proxy；
- 通用响应：`{ code, msg, data }`；
- 业务成功码：`0`；
- 鉴权：`Authorization: Bearer <accessToken>`；
- Token 是不透明内存 Session，不是 JWT；
- 当前没有 Refresh API；
- 后端重启后 Token 失效；
- Project 分页为 `data.list/data.total`；
- Project CRUD 基础成功链可用；
- Script Workspace GET 和 Script Draft `rawText/prompt` 可用；
- Provider Callback 不是普通前端接口；
- Provider Sandbox 与 Export resultUrl 是占位结果。

## P0：阻塞具体 Adapter 的问题

1. `PUT /script/content` 的正式请求 DTO 是什么？
2. Script Content 成功响应和重新读取规则是什么？
3. Script Confirm 的前置条件和失败响应是什么？
4. Script/Storyboard Workspace 是否提供 `revision` 或 `version`？
5. expectedRevision 如何提交？
6. 冲突使用 HTTP 409 还是 CommonResult 业务码？
7. Project Asset 使用哪些完整路径和请求 DTO？
8. Project Asset 是单实体 CRUD 还是支持聚合保存？
9. Voices、Script Templates 和 Generation Tasks 是否统一返回 `list/total`？
10. Resource `PRIVATE/SYSTEM/SHARED` 的权限和页面语义是什么？
11. Project update 允许的完整字段和状态枚举是什么？
12. 逻辑删除后详情返回 404、业务错误还是空 data？

## P0：真实 AI 与媒体

- Image2 Submit、Task、Callback 和 Result DTO；
- Seedance Submit、Task、Callback 和 Result DTO；
- TTS Submit、Task、Callback 和 Result DTO；
- 业务生成端点与 `/generation/tasks` 的关系；
- 轮询、SSE 或 WebSocket；
- 幂等键；
- 任务取消、重试和超时；
- multipart、预签名上传或对象存储直传；
- 文件格式、大小、分辨率和时长；
- 媒体资源 ID；
- 永久 URL 与临时签名 URL；
- URL 刷新；
- 删除和引用计数；
- OSS/CDN、CORS 和鉴权；
- 真实视频合成与下载。

## P1：认证与权限

- 低权限测试账号和稳定 403 Fixture；
- 后端 Logout；
- 生产 Session 存储；
- Token 过期时间；
- Refresh 方案；
- 多标签页并发刷新；
- 账号锁定、禁用和密码过期；
- 权限码与页面能力的映射规则。

## P1：通用协议

- 所有时间字段的时区；
- requestId/traceId 的 Header 名称；
- 跨模块统一错误码；
- ID 是否始终为 number；
- 空字符串、null 和缺省字段规则；
- 分页最大 pageSize；
- 排序字段和默认顺序；
- 429、超时和重试规则；
- Nginx 正式域名、HTTPS、上传限制和超时。

## Phase1 特殊状态

### CONTROLLED_REJECT

- Project Import；
- System styles/permissions 写入；
- Generation Task 通用 create/update。

前端应保持不可用，不将稳定错误当成待修复的普通接口失败。

### NO_OP_SUCCESS

- System message read；
- System message read-all；
- System message clear。

前端可以兼容返回，但不得宣称真实消息中心已经完成。

### MOCK/PLACEHOLDER

- Script Generate；
- Storyboard Generate；
- Project start-generation；
- Provider Sandbox；
- Export；
- Image、Video、TTS resultUrl。

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
401：
403：
404：
枚举：
时间与时区：
分页：
幂等与重试：
媒体规则：
Mock/No-op/Controlled Reject：
负责人：
```
