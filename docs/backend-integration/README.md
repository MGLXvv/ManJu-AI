# 后端接入规格与前端准备度

本目录整理 Integration Pack、Phase1 增量说明、前端 Adapter，以及已经完成的脱敏真实联调证据。

## 状态解释

- 后端 `READY`：真实业务接口已经实现，可以进入前端接入；
- 后端 `REAL`：Phase1 提供真实读取或 CRUD；
- `MOCK/PARTIAL/CONTROLLED_REJECT/NO_OP`：接口可以存在，但不能按完整真实产品能力理解；
- 前端是否完成接入，必须另外依据 Adapter、Fixture、真实验证和页面流程判断。

## 文档入口

- [`endpoint-matrix.md`](./endpoint-matrix.md)：后端状态与前端状态双维度矩阵；
- [`implemented-interface-register.md`](./implemented-interface-register.md)：历史 PR、已实测接口和本轮 Adapter 优化记录；
- [`frontend-project-audit.md`](./frontend-project-audit.md)：整个前端项目的 P0/P1/P2 优化审核；
- [`frontend-readiness-handbook.md`](./frontend-readiness-handbook.md)：当前框架和标准接入流程；
- [`scaffold-http-module.md`](./scaffold-http-module.md)：真实接口模块脚手架使用说明；
- [`../frontend-backend-integration-guide.md`](../frontend-backend-integration-guide.md)：详细 DTO/Mapper、测试和页面验收指南；
- [`environment.md`](./environment.md)：环境、代理、鉴权与运行配置；
- [`protocol.md`](./protocol.md)：CommonResult、分页、Token 和错误处理；
- [`verification-log.md`](./verification-log.md)：脱敏真实验证记录；
- [`open-questions.md`](./open-questions.md)：仍需后端或真实 Fixture 确认的事项。

## 证据优先级

1. OpenAPI/Swagger 或后端 DTO 源码；
2. 脱敏真实成功与失败 Fixture；
3. Integration Pack / Phase1 文档；
4. 前端 HTTP Adapter；
5. 前端 Mock。

后端 READY 不等于前端已接入；HTTP 200 或 `code=0` 也不能单独证明写入副作用已经发生。

## 使用规则

- HTTP 模式不得静默切换到 Mock；
- 页面、组件和 Store 不直接依赖 Axios、后端 DTO 或 Mock 文件；
- DTO 差异仅在 `*.http.ts`、`*.types.ts` 和 `*.mapper.ts` 中处理；
- CONTROLLED_REJECT 和语义不匹配能力不能通过环境变量强行开启；
- 新模块优先使用 `pnpm scaffold:http-module <module-name>`；
- 每次契约变化同步更新 Contract、矩阵、Fixture、测试和验证记录。
