# 后端联调与接口接入基线

本目录将后端提供的 `Frontend Integration Pack`、`Frontend API Compat Phase1` 增量说明、前端现有接入框架和真实 WireGuard 联调结果整理为可执行规格。

## 文档权威性

当前判断来源：

1. `Frontend Integration Pack`：以后端当时 `dev` 分支说明为契约来源；
2. `Frontend Phase1 Update Notes`：后端部署提交 `646a302`，部署脚本修复 `a53d8ff` 不改变业务 API；
3. 前端仓库 `master` 的 HTTP Adapter、Capability Registry、运行配置、任务网关、持久化和媒体抽象；
4. 2026-07-13 至 2026-07-14 通过 WireGuard 完成的真实 Auth、Project 和 Script 验证。

证据优先级：

```text
真实环境可重复验证
> 后端当前部署代码和数据库副作用
> 版本化接口文档或 OpenAPI
> Swagger 当前页面
> 前端预留或猜测
```

后端文档中的 `READY`、Controller 存在、Smoke 通过、HTTP 200 或 CommonResult `code=0`，都不自动等于真实业务功能已经完成。

## 首要阅读顺序

1. [`interface-readiness.md`](./interface-readiness.md)  
   判断哪些接口可以真实开放、哪些只能准备 Adapter、哪些只是 Mock、NO_OP、稳定拒绝或阻塞。
2. [`frontend-adapter-playbook.md`](./frontend-adapter-playbook.md)  
   说明后续人员如何基于现有 Runtime Config、Shared HTTP Client、双 Adapter、Capability、Task Gateway、Persistence 和 Upload 边界接入真实后端。
3. [`http-module-template.md`](./http-module-template.md)  
   提供可复制的 Contract、DTO、Mapper、HTTP Adapter、Mock Adapter、测试和 Capability 模板。
4. [`../api-contract-status-matrix.md`](../api-contract-status-matrix.md)  
   查看模块级当前状态和升级规则。

## 其他文件

- [`environment.md`](./environment.md)：测试环境、代理、鉴权与运行配置；
- [`protocol.md`](./protocol.md)：CommonResult、分页、Token、错误处理和数据约定；
- [`endpoint-matrix.md`](./endpoint-matrix.md)：后端文档端点与前端实现审计；
- [`implementation-audit.md`](./implementation-audit.md)：当前前端实现差异和修复优先级；
- [`verification-log.md`](./verification-log.md)：脱敏真实验证结果和失败证据；
- [`live-auth-session.md`](./live-auth-session.md)：真实登录、Profile 和无效 Token 401 验证流程；
- [`live-project-crud.md`](./live-project-crud.md)：可清理的真实项目 CRUD 验证流程；
- [`open-questions.md`](./open-questions.md)：仍需后端确认的事项。

仓库根目录的 `.env.integration.example` 提供测试环境配置模板，不包含账号、密码或 Token。

## 成熟度状态

工程判断统一使用：

| 状态 | 含义 |
| --- | --- |
| `LIVE_VERIFIED` | 真实测试环境已经完成主要业务闭环和清理验证 |
| `LIVE_PARTIAL` | 真实环境只验证了部分接口、字段或副作用 |
| `CONTRACT_READY` | 可以编写 DTO、Mapper、Fixture 和 Adapter，但尚未真实验证 |
| `MOCK_ONLY` | 只用于页面流程、状态机或兼容测试 |
| `CONTROLLED_REJECT` | 后端稳定拒绝，UI 不应宣称可用 |
| `NO_OP` | 返回成功但没有真实业务副作用 |
| `BLOCKED` | 缺少真实算法、媒体、存储或生产流程 |
| `UNKNOWN` | 证据不足或互相矛盾 |

Runtime Capability 使用另一套用户可用性状态：

```text
available / mock-only / readonly / unsupported
```

二者职责不同：

- 成熟度回答“工程上验证到什么程度”；
- Capability 回答“当前运行模式是否允许用户执行”。

不得仅通过环境变量覆盖把未验证接口开放为真实功能。

## 已确认的真实基线

### Auth

- Password Login；
- Profile；
- Bearer Token；
- 刷新恢复；
- 无效 Token 401 与前端 Session 清理。

### Project

- 列表 `data.list / data.total`；
- 创建；
- 详情；
- 更新名称；
- 删除；
- 删除后列表确认不存在。

### Script

- Workspace 读取；
- `rawText`、`prompt` 写入和重新读取；
- 生成稿保存、确认和真实生成尚未闭环，因此只属于 `LIVE_PARTIAL`。

## 使用规则

- HTTP 模式不得静默切换到 Mock；
- 页面、组件和 Store 不直接依赖后端 DTO 或 Axios；
- Token 作为不透明字符串保存和发送，禁止解析或写入日志；
- 业务成功必须同时满足请求完成且 `code === 0`；
- 对任何写接口，`code === 0` 后仍必须写后重新读取；
- DTO 差异仅在 `*.http.ts`、`*.types.ts`、`*.mapper.ts` 中处理；
- 未验证能力默认关闭，不能通过 UI 或配置绕过；
- Mock、Sandbox、NO_OP 和 CONTROLLED_REJECT 不计入真实功能完成度；
- 每次后端契约变化必须同步更新成熟度矩阵、Fixture、契约测试和验证记录；
- 真实写测试必须使用唯一临时名称并在失败后自动补偿清理。
