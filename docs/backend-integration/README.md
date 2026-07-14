# 后端接入规格与前端准备度

本目录整理 Integration Pack、Phase1 增量说明、前端 Adapter，以及已经完成的脱敏真实联调证据。

## 当前阶段结论

截至 2026-07-14，本轮真实接口接入阶段暂停在以下边界：

- Auth/Profile、Project 基础 CRUD、Script Workspace 和 Script Draft 已完成真实环境验证；
- Storyboard Workspace 读取、Project Asset 列表、Resource Library、Voices、Script Templates 和 Generation Tasks 已具备不同程度的 Adapter/Mapper 支持；
- Project Asset 单实体 CRUD 与 Storyboard 写入虽有后端 Method/Path 和最小请求字段，但缺少完整成功响应、错误 Fixture、更新/删除语义和可复现的真实写后读证据，因此暂不启用页面写能力；
- Script Content、真实 AI、媒体上传和真实 Export 继续保持阻塞或显式关闭；
- 当前接入基础设施已经足够支持后续恢复，不再预先编写猜测性 Adapter。

后续只有在获得 OpenAPI、后端 DTO、脱敏真实响应或可复现测试环境中的至少一项新增证据后，才恢复 #37、#38 及后续生成/媒体任务。

## 状态解释

- 后端 `READY`：真实业务接口已经实现，可以进入前端接入；
- 后端 `REAL`：Phase1 提供真实读取或 CRUD；
- `MOCK/PARTIAL/CONTROLLED_REJECT/NO_OP`：接口可以存在，但不能按完整真实产品能力理解；
- 前端是否完成接入，必须另外依据 Adapter、Fixture、真实验证和页面流程判断；
- 前端 `parked`：路径或最小请求已有依据，但缺少足够证据安全启用，保留 Backlog 而不继续猜测实现。

## 文档入口

- [`source/`](./source/)：后端原始 Integration Pack 与 Phase1 更新说明归档；
- [`endpoint-matrix.md`](./endpoint-matrix.md)：后端状态与前端状态双维度矩阵；
- [`implemented-interface-register.md`](./implemented-interface-register.md)：历史 PR、已实测接口和本轮 Adapter 优化记录；
- [`frontend-project-audit.md`](./frontend-project-audit.md)：整个前端项目的 P0/P1/P2 优化审核；
- [`frontend-readiness-handbook.md`](./frontend-readiness-handbook.md)：当前框架和标准接入流程；
- [`scaffold-http-module.md`](./scaffold-http-module.md)：真实接口模块脚手架使用说明；
- [`../frontend-backend-integration-guide.md`](../frontend-backend-integration-guide.md)：详细 DTO/Mapper、测试和页面验收指南；
- [`environment.md`](./environment.md)：环境、代理、鉴权与运行配置；
- [`protocol.md`](./protocol.md)：CommonResult、分页、Token 和错误处理；
- [`verification-log.md`](./verification-log.md)：脱敏真实验证记录；
- [`open-questions.md`](./open-questions.md)：恢复后续接入前仍需补充的证据。

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
- 每次契约变化同步更新 Contract、矩阵、Fixture、测试和验证记录；
- 后端无法提供新增证据时，优先保持当前稳定状态，而不是通过试错猜测写接口。
