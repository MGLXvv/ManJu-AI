# 真实联调验证记录

前端 CI 无法访问 WireGuard 内网。本记录基于联调人员在测试环境执行的脱敏真实结果，不包含账号密码、Token、Cookie 或完整 Authorization Header。

## Auth 与 Project 读取

已确认：

- Profile 返回 userId、username、nickname、roles 和 permissions；
- 项目列表分页使用 `data.list/data.total`；
- 项目详情返回单个 DTO；
- 项目状态样例包含 `DRAFT`；
- 当前样例中没有观察到 requestId 或 traceId。

已保存 Fixture：

```text
tests/fixtures/http/auth-profile.success.json
tests/fixtures/http/project-list.success.json
tests/fixtures/http/project-detail.success.json
```

## Project CRUD

通过安全脚本完成：

```text
login
-> profile
-> create temporary project
-> detail
-> rename
-> updated detail
-> delete
-> confirm list no longer contains project
```

结论：Project 创建、详情、名称更新和删除基础契约可用，临时项目已清理。完整 update 字段、删除后详情行为和低权限 403 仍未确认。

## 失效 Token 401

通过只读验证完成：

```text
login
-> valid token profile
-> invalid token profile
-> rejected
```

结论：有效 Token 可访问 Profile；失效 Token 被拒绝；前端可清理 Session 并跳转登录。低权限 403 尚无真实账号验证。

## Script Workspace 与 Draft

真实测试确认：

- Script Workspace GET 可用；
- 初始 Workspace 包含 rawText、prompt、scriptContent、scriptStatus 和 canEnterStoryboard；
- Script Draft PUT 使用 `rawText/prompt`；
- 写入后重新读取与测试标记一致；
- 临时项目均已自动清理。

### Script Content 契约差异

后端文档列出 `PUT /script/content`，但未提供请求体。

真实探测：

- `{ content: marker }` 返回 HTTP 200 + `code=0`；
- 接口响应中的 scriptContent 仍为空；
- 随后重新读取 Workspace，scriptContent 仍为空。

结论：

- `code=0` 只能证明请求被接受，不能证明内容已持久化；
- 不能根据响应字段继续猜测 `{ scriptContent }`；
- 前端将该能力标记为 mismatch/unconfirmed；
- HTTP Adapter 在后端提供请求 DTO 或 OpenAPI 前显式阻断生成稿保存；
- Script Confirm、revision/version 和 409 暂不继续联调。

## 当前仍缺少的真实证据

- 低权限账号 403；
- Project 扩展接口；
- Storyboard Workspace、CRUD、sort 和 confirm；
- Project Asset 与 Resource Library；
- Voices、Script Templates、Generation Tasks 的真实分页 DTO；
- System Status 和 No-op 消息响应；
- 时间时区与 requestId/traceId；
- 媒体上传、OSS/CDN、真实生成和真实 Export。

## 安全规则

- 临时写入使用唯一名称并在流程结束后清理；
- 写入脚本必须显式授权；
- 报告必须脱敏；
- 请求 DTO 不完整时停止探测，不通过多次猜字段继续写入测试环境。
