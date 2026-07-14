# 真实联调验证记录

前端 CI 无法访问 WireGuard 内网。本记录基于联调人员在测试环境执行的脱敏真实结果，不包含账号密码、Token、Cookie 或完整 Authorization Header。

## 2026-07-13：Auth Profile 与 Project 读取

已确认：

- `GET /system/auth/profile` 返回 `userId`、`username`、`nickname`、`roles` 和 `permissions`；
- 当前联调账号角色为 `super_admin`；
- 项目列表分页为 `data.list/data.total`；
- 项目详情返回单个 DTO；
- 项目状态样例包含 `DRAFT`；
- 时间样例为无时区偏移的 ISO 本地格式；
- 当前样例中没有观察到 requestId 或 traceId。

已保存 Fixture：

```text
tests/fixtures/http/auth-profile.success.json
tests/fixtures/http/project-list.success.json
tests/fixtures/http/project-detail.success.json
```

## 2026-07-13：Project CRUD

通过安全联调脚本完成：

```text
login
-> profile
-> create temporary project
-> get detail
-> rename
-> get updated detail
-> delete
-> confirm list does not contain project
```

结论：

- Project 创建、详情、名称更新和删除基础契约可用；
- 临时项目已清理；
- 脚本在中途失败时会尝试补偿删除；
- 完整 update 字段、删除后详情行为和低权限 403 仍未确认。

## 2026-07-14：失效 Token 401

通过只读验证完成：

```text
login
-> valid token profile
-> deliberately invalid token
-> profile rejected
```

结论：

- 有效 Token 可访问 Profile；
- 失效 Token 被后端拒绝；
- 前端可统一清理 Session 并跳转登录；
- 低权限 403 尚无真实账号验证。

## 2026-07-14：Script Workspace 与 Draft

真实测试确认：

- `GET /aidrama/projects/{id}/script/workspace` 可用；
- 初始 Workspace 包含 `rawText`、`prompt`、`scriptContent`、`scriptStatus` 和 `canEnterStoryboard`；
- `PUT /aidrama/projects/{id}/script/draft` 使用：

```json
{
  "rawText": "...",
  "prompt": "..."
}
```

- 写入后重新读取的 `rawText/prompt` 与测试标记一致；
- 临时项目均已自动清理。

### Script Content 契约差异

后端文档列出：

```text
PUT /aidrama/projects/{id}/script/content
```

但未提供请求体。

真实探测：

- `{ content: marker }` 返回 HTTP 200 + `code=0`；
- 接口响应中的 `scriptContent` 仍为空；
- 随后重新读取 Workspace，`scriptContent` 仍为空。

结论：

- `code=0` 只能证明请求被接受，不能证明内容已持久化；
- 不能根据响应字段继续猜测 `{ scriptContent }`；
- 前端将该能力标记为 `mismatch/unconfirmed`；
- HTTP Adapter 在后端提供请求 DTO 或 OpenAPI 前显式阻断生成稿保存；
- Script Confirm、revision/version 和 409 暂不继续联调。

## 当前仍缺少的真实证据

- 低权限账号 403；
- Project batch-delete、copy、statistics、overview、tasks、pipeline；
- Storyboard Workspace、CRUD、sort 和 confirm；
- Project Asset 与 Resource Library；
- Voices、Script Templates、Generation Tasks 的真实分页 DTO；
- System `GET /system` 和 NO_OP 消息响应；
- 时间字段的正式时区；
- requestId/traceId；
- 媒体上传、OSS/CDN 和真实生成链路；
- 真实 Export。

## 安全规则

- 临时写入必须使用唯一名称并在流程结束后清理；
- 写入脚本必须显式启用写权限；
- 报告必须脱敏；
- 请求 DTO 不完整时停止探测，不通过多次猜字段继续写入测试环境。
