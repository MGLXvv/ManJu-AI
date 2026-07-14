# Frontend Phase1 Update Notes

本文档是给前端的增量更新说明，只覆盖本次 Frontend API Compat Phase1 新增和变更内容，不替代既有 `frontend-integration-pack.md`。

## 1. 本次版本

- 测试环境已更新到 Frontend API Compat Phase1。
- 当前后端应用部署 commit：`646a302 feat: add frontend api compatibility phase1`。
- 测试环境地址仍为：`http://10.10.3.26:48080`。
- Health、Smoke Suite、核心新增 compat 接口均已完成验证。
- 最新 `dev` 之后还包含部署脚本 PID 管理修复：`a53d8ff chore: fix deployment pid management`，该提交不改变业务 API。

## 2. 本次新增接口

### System

| Method | Path | 类型 | 说明 |
| --- | --- | --- | --- |
| GET | `/admin-api/system` | REAL | 返回系统状态、功能开关、Provider 模式等轻量信息。 |
| POST | `/admin-api/system/styles` | CONTROLLED_REJECT | Phase1 不开放写入，返回稳定错误。 |
| PATCH | `/admin-api/system/styles/{styleId}` | CONTROLLED_REJECT | Phase1 不开放写入，返回稳定错误。 |
| DELETE | `/admin-api/system/styles/{styleId}` | CONTROLLED_REJECT | Phase1 不开放删除，返回稳定错误。 |
| POST | `/admin-api/system/permissions` | CONTROLLED_REJECT | Phase1 不开放真实权限写入，返回稳定错误。 |
| PATCH | `/admin-api/system/permissions/{permissionId}` | CONTROLLED_REJECT | Phase1 不开放真实权限更新，返回稳定错误。 |
| DELETE | `/admin-api/system/permissions/{permissionId}` | CONTROLLED_REJECT | Phase1 不开放真实权限删除，返回稳定错误。 |
| POST | `/admin-api/system/messages/{messageId}/read` | NO_OP_SUCCESS | 消息已读兼容接口，当前 no-op 成功。 |
| POST | `/admin-api/system/messages/read-all` | NO_OP_SUCCESS | 全部已读兼容接口，当前 no-op 成功。 |
| DELETE | `/admin-api/system/messages` | NO_OP_SUCCESS | 清空消息兼容接口，当前 no-op 成功。 |

### Voices

以下接口已经可联调，属于轻量 Voice Catalog，不影响既有项目内 TTS 生成链路。

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/admin-api/voices` | 音色列表，支持分页和关键词过滤。 |
| POST | `/admin-api/voices` | 创建音色目录项。 |
| PATCH | `/admin-api/voices/{voiceId}` | 更新音色目录项。 |
| DELETE | `/admin-api/voices/{voiceId}` | 逻辑删除音色目录项。 |

### Script Templates

以下接口已经可联调，属于轻量剧本模板目录，不影响既有 Script 工作区和剧本生成主链路。

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/admin-api/script-templates` | 剧本模板列表，支持分页和关键词过滤。 |
| POST | `/admin-api/script-templates` | 创建剧本模板。 |
| PATCH | `/admin-api/script-templates/{templateId}` | 更新剧本模板。 |
| DELETE | `/admin-api/script-templates/{templateId}` | 逻辑删除剧本模板。 |

### Generation Tasks

这些接口复用既有 `aidrama_ai_task` 任务体系，不新增独立 generation task 模型，不绕过 Provider Callback 状态机。

| Method | Path | 类型 | 说明 |
| --- | --- | --- | --- |
| GET | `/admin-api/generation/tasks` | REAL | 查询 AI 任务列表，支持分页和状态过滤。 |
| GET | `/admin-api/generation/tasks/{id}` | REAL | 查询 AI 任务详情。 |
| POST | `/admin-api/generation/tasks/{id}/cancel` | REAL | 取消允许取消的任务。 |
| POST | `/admin-api/generation/tasks/{id}/retry` | REAL | 重试允许重试的失败任务。 |
| POST | `/admin-api/generation/tasks` | CONTROLLED_REJECT | 不允许前端直接创建通用任务，请使用具体业务生成接口。 |
| PATCH | `/admin-api/generation/tasks/{id}` | CONTROLLED_REJECT | 任务状态由 Provider Callback 管理，不支持前端直接 PATCH。 |

### Projects

| Method | Path | 类型 | 说明 |
| --- | --- | --- | --- |
| GET | `/admin-api/projects/{projectId}/export` | REAL | 兼容前端项目导出查询路径，映射到既有导出结果。 |
| POST | `/admin-api/projects/import` | CONTROLLED_REJECT | 项目导入 Phase1 尚未开放，返回稳定错误。 |

## 3. 鉴权更新

- 本次新增 compat 接口已全部纳入 `AuthTokenInterceptor`。
- 除 Auth 登录、验证码、注册、重置密码、社交登录相关接口外，其余管理端接口均需要携带 Token。
- 请求头格式保持不变：

```http
Authorization: Bearer <accessToken>
```

- 当前未携带 Token 时，项目会按现有拦截器行为返回未认证业务错误；前端应先确认请求是否带上 `Authorization`。

## 4. 当前不能使用的能力

以下能力仍等待算法接口或后续联调，不属于本次 compat 更新范围：

- 真实 Image2 算法生成。
- 真实 Seedance 视频生成。
- 真实 TTS Provider。
- 真实 Export 合成成片。
- 项目导入。
- System styles / permissions 的真实写入和删除。

## 5. 前端需要注意

- 如果遇到 `HTTP 400` 或业务 `code=400`，请先确认是否调用了 `CONTROLLED_REJECT` 接口。
- 如果遇到未认证错误，请先确认是否携带 `Authorization: Bearer <accessToken>`。
- 如果遇到 `HTTP 404`，请记录以下信息并反馈后端：
  - Method
  - URL
  - Request
  - Response
- 对于 `NO_OP_SUCCESS` 接口，当前只保证前端联调不阻塞，不代表已经接入真实消息中心。
- 对于 Voices 和 Script Templates，前端可创建临时测试数据，测试后请调用对应 DELETE 清理。

## 6. 本次验证结果

- BUILD：`SUCCESS`。
- MockMvc：`Tests run: 26, Failures: 0, Errors: 0`。
- Smoke Suite：`OVERALL: PASS`。
- 新增 compat 接口验证：通过。
- 测试服务器：已更新并完成 health 检查。
- 验证范围包括：
  - Voices CRUD。
  - Script Templates CRUD。
  - Generation Tasks list/detail/controlled reject。
  - System status/messages no-op。
  - Project export alias / import controlled reject。
  - 新增 compat 接口鉴权覆盖。
