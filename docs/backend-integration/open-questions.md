# 联调待确认项

以下事项在开始大规模 HTTP Adapter 修改前必须通过真实响应、Swagger 或后端确认完成闭环。

## 已确认

- 测试环境：`http://10.10.3.26:48080`；
- 网关前缀：`/admin-api`；
- 本地浏览器通过 Vite Proxy 访问；
- 通用响应：`{ code, msg, data }`；
- 业务成功码：`0`；
- 鉴权：`Authorization: Bearer <accessToken>`；
- Token：不透明内存 Session，不是 JWT；
- 当前无 Refresh Token 换新接口；
- 后端重启后 Token 失效；
- 通用分页文档为 `data.list/data.total`；
- Project Asset `type` 与 Resource `assetType` 不可混用；
- `extraJson` 是 JSON 字符串；
- Provider Sandbox 需要 Bearer Token；
- Provider Callback 不是普通前端接口。

## 需要真实 Fixture 确认

1. Project 列表实际是否严格返回 `list/total`，是否存在兼容 `records`；
2. Voices、Script Templates、Generation Tasks 的分页响应字段；
3. Project update 支持的完整字段和返回体；
4. Profile 返回字段、角色与权限结构；
5. System `GET /system` 的完整状态字段；
6. NO_OP 消息接口的 `data` 是 `null`、对象还是消息实体；
7. Resource `SYSTEM`、`SHARED` 在页面中的来源/权限语义；
8. Script/Storyboard workspace 的 revision、更新时间和空工作区语义；
9. 逻辑删除后详情接口返回 404、业务 400 还是空 data；
10. 所有时间字段的格式和时区；
11. requestId/traceId 的响应头或响应体位置；
12. 账号权限不足时 `code=403` 是否稳定；
13. 后端进程重启后的 Profile、项目列表错误表现；
14. Mock resultUrl 是否保证格式稳定，还是仅为任意占位字符串。

## 需要运维或仓库设置确认

- `master` 是否已禁止直接推送；
- Required checks 是否包含：
  - `Static checks, types, tests, build`；
  - `Playwright Mock main flow`；
- PR 是否要求更新到最新 `master`；
- 仓库是否优先或只允许 Squash Merge；
- 正式 Nginx 域名、HTTPS、超时和上传大小限制；
- 测试账号、角色和最小权限集合；
- 测试环境日志和 requestId 查询方式。

## 当前阻塞

- 真实 Image2 Submit/Callback；
- 真实 Seedance Submit/Callback；
- 真实 TTS Submit/Callback；
- 真实视频合成与下载；
- OSS/CDN 媒体生命周期；
- 项目导入；
- System styles/permissions 写入；
- 生产级持久 Session、过期和 Refresh 方案。

## 联调记录模板

```text
日期：
环境：
后端 commit：
前端 commit：
模块：
Method + Path：
请求 Fixture：
成功响应 Fixture：
失败响应 Fixture：
401/403：
页面流程：
刷新恢复：
发现差异：
结论：partial / verified / blocked
负责人：
```
