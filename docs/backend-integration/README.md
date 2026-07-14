# 后端接入规格与前端准备度

本目录整理后端提供的接口文档、前端现有适配层，以及已经完成的脱敏真实联调证据。

当前目标不是继续猜测未完成接口，而是让后端正式交付后，前端只修改 HTTP Adapter、DTO、Mapper、Fixture 和 Capability 状态即可完成接入。

## 文档入口

- [`frontend-readiness-handbook.md`](./frontend-readiness-handbook.md)：当前阶段原则、框架清单、证据等级和标准接入流程；
- [`../frontend-backend-integration-guide.md`](../frontend-backend-integration-guide.md)：详细模块结构、DTO/Mapper 示例、测试和页面验收指南；
- [`endpoint-matrix.md`](./endpoint-matrix.md)：按真实证据划分 contract-verified、documented、mock-only、controlled-reject、no-op 和 blocked；
- [`environment.md`](./environment.md)：环境、代理、鉴权与运行配置；
- [`protocol.md`](./protocol.md)：CommonResult、分页、Token 和错误处理；
- [`implementation-audit.md`](./implementation-audit.md)：当前前端框架和剩余风险；
- [`verification-log.md`](./verification-log.md)：脱敏真实验证记录；
- [`open-questions.md`](./open-questions.md)：后端正式交付前仍需确认的事项。

## 证据优先级

1. OpenAPI/Swagger 或后端 DTO 源码；
2. 脱敏真实成功与失败 Fixture；
3. 后端接口文档；
4. 前端 HTTP Adapter；
5. 前端 Mock。

接口存在、HTTP 文件存在或返回 `code=0`，都不等于真实业务已经可用。

## 使用规则

- HTTP 模式不得静默切换到 Mock；
- Token 作为不透明字符串保存和发送，禁止解析或写入日志；
- 业务成功必须判断 `code === 0`，但成功包不能单独证明业务副作用已发生；
- DTO 差异仅在 `*.http.ts`、`*.types.ts`、`*.mapper.ts` 中处理；
- 页面、组件和 Store 不直接依赖 Axios、后端 DTO 或 Mock 文件；
- 未确认接口通过 Capability 或稳定 ApiError 显式阻断；
- 每次契约变化同步更新矩阵、Fixture、测试和验证记录。
