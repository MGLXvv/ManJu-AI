# 后端联调规格基线

本目录将后端提供的 `Frontend Integration Pack` 与 `Frontend API Compat Phase1` 增量说明整理为可执行的前端联调规格。

## 文档权威性

当前规格来源：

1. `Frontend Integration Pack`：以 `manju-ai-server` 当时 `dev` 分支实现为准；
2. `Frontend Phase1 Update Notes`：后端部署提交 `646a302 feat: add frontend api compatibility phase1`，部署脚本修复提交 `a53d8ff` 不改变业务 API；
3. 前端仓库 `master` 的 HTTP Adapter、CapabilityRegistry、运行配置和测试现状。

后端文档用于确认接口事实，前端实现审计用于判断是否已经接入。接口存在不等于页面链路已经完成真实环境验收。

## 文件说明

- [`environment.md`](./environment.md)：测试环境、代理、鉴权与运行配置；
- [`protocol.md`](./protocol.md)：CommonResult、分页、Token、错误处理和数据约定；
- [`endpoint-matrix.md`](./endpoint-matrix.md)：后端端点、准备度与前端接入状态；
- [`implementation-audit.md`](./implementation-audit.md)：当前前端实现差异和修复优先级；
- [`verification-log.md`](./verification-log.md)：脱敏真实响应、验证范围和未完成项；
- [`live-auth-session.md`](./live-auth-session.md)：真实登录、Profile 和失效 Token 401 验证流程；
- [`live-project-crud.md`](./live-project-crud.md)：可清理的真实项目创建、查询、重命名和删除验证流程；
- [`open-questions.md`](./open-questions.md)：仍需后端确认或真实请求验证的事项。

仓库根目录的 `.env.integration.example` 提供测试环境配置模板，不包含账号、密码或 Token。

## 状态定义

| 状态                | 含义                                                     |
| ------------------- | -------------------------------------------------------- |
| `confirmed`         | 后端文档已经明确路径、方法和主要语义                     |
| `implemented`       | 前端 HTTP Adapter 已覆盖确认契约                         |
| `partial`           | 已有部分实现，但字段、错误或页面链路未闭环               |
| `mismatch`          | 前端实现与确认契约存在明确差异                           |
| `controlled-reject` | 后端明确提供稳定拒绝，不应在 UI 中宣称可用               |
| `no-op`             | 接口保证成功但尚无真实业务副作用                         |
| `blocked`           | 缺少真实算法、媒体或生产入口                             |
| `verified`          | 已在测试环境完成成功、失败、权限、刷新恢复和页面流程验收 |

## 使用规则

- HTTP 模式不得静默切换到 Mock；
- Token 作为不透明字符串保存和发送，禁止解析或写入日志；
- 业务成功必须同时满足请求完成且 `code === 0`；
- DTO 差异仅在 `*.http.ts`、`*.types.ts`、`*.mapper.ts` 中处理；
- 未完成真实环境验收的能力不得标记为 `verified`；
- 每次后端契约变化必须同步更新矩阵、Fixture、契约测试和联调记录。
