# 后端接入规格与前端准备度

本目录整理后端提供的 `Frontend Integration Pack`、`Frontend Phase1 Update Notes`、前端现有适配层，以及已经完成的脱敏真实联调证据。

当前目标不是继续猜测未完成接口，而是让后端正式交付后，前端只修改 HTTP Adapter、DTO、Mapper、Fixture 和 Capability 状态即可完成接入。

## 文档权威性

证据优先级：

1. OpenAPI/Swagger 导出文件或后端 DTO 源码；
2. 脱敏真实成功与失败响应 Fixture；
3. 后端接口文档中的 Method、Path、阶段类型和限制；
4. 前端 HTTP Adapter；
5. 前端 Mock。

接口存在、HTTP 文件存在或返回 `code=0`，都不等于真实业务已经可用。

## 文件说明

- [`frontend-integration-handbook.md`](./frontend-integration-handbook.md)：后端接口到位后的完整前端接入流程、架构边界、测试和交接清单；
- [`endpoint-matrix.md`](./endpoint-matrix.md)：按真实证据重新划分 verified、documented、mock-only、controlled-reject、no-op 和 blocked；
- [`environment.md`](./environment.md)：测试环境、代理、鉴权与运行配置；
- [`protocol.md`](./protocol.md)：CommonResult、分页、Token、错误处理和数据约定；
- [`implementation-audit.md`](./implementation-audit.md)：当前前端框架、已完成项、风险和剩余准备工作；
- [`verification-log.md`](./verification-log.md)：脱敏真实响应、已验证范围和发现的契约差异；
- [`live-auth-session.md`](./live-auth-session.md)：真实登录、Profile 和失效 Token 401 验证流程；
- [`live-project-crud.md`](./live-project-crud.md)：可清理的真实项目 CRUD 验证流程；
- [`open-questions.md`](./open-questions.md)：后端正式交付前仍需确认的 DTO、权限、时间、媒体和任务协议。

通用架构说明仍可参考：

- [`../frontend-backend-integration-guide.md`](../frontend-backend-integration-guide.md)；
- [`../api-contract-status-matrix.md`](../api-contract-status-matrix.md)；
- [`../backend-runtime-config.md`](../backend-runtime-config.md)。

仓库根目录的 `.env.integration.example` 提供测试环境配置模板，不包含账号、密码或 Token。

## 状态定义

| 状态 | 含义 |
| --- | --- |
| `verified` | 已完成真实请求、失败、权限、刷新恢复和页面验收 |
| `contract-verified` | DTO 和基础成功链已有真实证据，但完整页面或异常验收未完成 |
| `documented` | 后端文档声明存在，缺少完整 DTO 或真实 Fixture |
| `mock-only` | 仅 Mock、占位任务或占位媒体 |
| `controlled-reject` | 后端明确稳定拒绝，不应在 UI 宣称可用 |
| `no-op` | 返回成功但没有真实业务副作用 |
| `blocked` | 缺少算法、媒体、上传、生产会话或正式业务实现 |
| `mismatch` | 前端实现和真实响应存在明确差异 |
| `unconfirmed` | 请求体、响应体、状态或语义尚未确认 |

## 使用规则

- HTTP 模式不得静默切换到 Mock；
- Token 作为不透明字符串保存和发送，禁止解析或写入日志；
- 业务成功必须同时满足请求完成且 `code === 0`；
- `code === 0` 只能证明后端接受了请求，不能自动证明业务副作用已发生；
- DTO 差异仅在 `*.http.ts`、`*.types.ts`、`*.mapper.ts` 中处理；
- 页面、组件和 Store 不直接依赖 Axios、后端 DTO 或 Mock 文件；
- 未确认接口通过 Capability 或稳定 ApiError 显式阻断；
- 每次后端契约变化必须同步更新矩阵、Fixture、契约测试和验证记录。
