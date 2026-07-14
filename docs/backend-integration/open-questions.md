# 后端正式交付前待确认项

缺少请求 DTO 时，前端只保留 Contract 和 Capability，不继续猜测字段。

## 已确认

- 测试环境、网关前缀和 Vite Proxy；
- CommonResult 与业务成功码；
- Bearer 不透明 Session Token；
- 当前没有 Refresh API；
- Project 分页与基础 CRUD；
- Script Workspace GET 和 Draft `rawText/prompt`；
- Provider Callback 不是普通前端接口；
- Provider Sandbox 与 Export resultUrl 是占位结果。

## 阻塞具体 Adapter 的问题

1. Script Content 的正式请求 DTO、成功响应和重新读取规则；
2. Script Confirm 的前置条件和失败响应；
3. Script/Storyboard revision、expectedRevision 和 409；
4. Project Asset 的完整路径、请求 DTO 和单实体/聚合保存模型；
5. Voices、Script Templates、Generation Tasks 的分页结构；
6. Resource PRIVATE/SYSTEM/SHARED 的权限和页面语义；
7. Project update 的完整字段和状态枚举；
8. 逻辑删除后详情的响应；
9. Storyboard CRUD、sort、confirm 的真实 DTO 和错误样例。

## 真实 AI 与媒体

- Image2、Seedance、TTS 的 Submit、Task、Callback 和 Result DTO；
- 业务生成端点与 Generation Tasks 的关系；
- 轮询、SSE 或 WebSocket；
- 幂等、取消、重试和超时；
- multipart、预签名上传或对象存储直传；
- 文件限制和媒体资源 ID；
- 永久 URL 与临时签名 URL；
- URL 刷新、删除和引用计数；
- OSS/CDN、CORS 和鉴权；
- 真实视频合成与下载。

## 认证、权限与通用协议

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
