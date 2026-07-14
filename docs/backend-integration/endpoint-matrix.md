# 后端端点与前端接入矩阵

## 1. 两个状态维度

后端文档中的 `READY` 表示真实业务接口已经实现并可供前端接入；它不等于“完整产品流程、真实 AI 算法和生产媒体链路全部完成”。

本矩阵分别记录：

- **后端状态**：Integration Pack / Phase1 对接口实现性质的说明；
- **前端状态**：当前 Adapter、Fixture、真实联调和页面流程的完成程度。

原始后端文档归档于 [`source/`](./source/)。

### 后端状态

| 状态                | 含义                                       |
| ------------------- | ------------------------------------------ |
| `READY`             | 真实业务接口已实现，可进入前端接入         |
| `REAL`              | Phase1 提供真实读取或 CRUD 能力            |
| `MOCK`              | 接口存在，但业务结果由 Mock 或同步占位实现 |
| `PARTIAL`           | 只完成部分接口或部分流程                   |
| `CONTROLLED_REJECT` | 接口稳定拒绝，用于兼容和阶段保护           |
| `NO_OP`             | 返回成功，但没有真实业务副作用             |
| `BLOCKED`           | 后端算法、媒体或生产基础设施尚未完成       |

### 前端状态

| 状态            | 含义                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `live-verified` | 已通过真实环境成功链或失败链验证                                       |
| `integrated`    | HTTP Adapter、DTO/Mapper 和测试已完成，仍缺部分真实 Fixture 或页面验收 |
| `adapter-ready` | 已有前端领域边界，但未按真实接口完成 Adapter                           |
| `parked`        | 已有路径或最小请求依据，但证据不足以安全启用，暂停实现并保留 Backlog   |
| `disabled`      | 根据后端状态或产品范围主动关闭                                         |
| `mismatch`      | 历史实现的路径、请求模型或返回语义不正确                               |
| `blocked`       | 依赖未完成的后端算法、媒体或生产协议                                   |

## 2. 环境与通用协议

| 项目                                     | 后端状态         | 前端状态        | 当前结论                                |
| ---------------------------------------- | ---------------- | --------------- | --------------------------------------- |
| `/admin-api`、Bearer Token、CommonResult | `READY`          | `live-verified` | 已通过 WireGuard 完成真实登录和业务请求 |
| Project `data.list/data.total`           | `READY`          | `live-verified` | Project 已保存真实 Fixture              |
| 其他目录分页                             | `READY` / `REAL` | `integrated`    | 前端优先读取 `list`，临时兼容旧包装字段 |
| Refresh Token                            | 未提供           | `disabled`      | 不实现猜测性的自动刷新                  |
| 正式域名、HTTPS、Nginx                   | `BLOCKED`        | `blocked`       | 测试阶段继续使用 Vite Proxy             |
| 时间时区、requestId/traceId              | 未确认           | `parked`        | 当前无新增后端证据，不阻塞已有链路      |

## 3. Auth

| 接口组                        | 后端状态   | 前端状态        | 证据或动作                             |
| ----------------------------- | ---------- | --------------- | -------------------------------------- |
| password login                | `READY`    | `live-verified` | PR #30、#32；真实登录和失效 Token 401  |
| profile                       | `READY`    | `live-verified` | 真实角色、权限和刷新恢复               |
| low-permission 403            | `READY`    | `parked`        | 处理逻辑已存在，但后端无低权限测试账号 |
| code login / register / reset | `READY`    | `disabled`      | 后端接口已完成，当前前端产品范围未接入 |
| social login                  | 平台未完成 | `blocked`       | 等真实第三方平台                       |
| logout                        | 未定义     | `disabled`      | 当前只清理前端 Session                 |

## 4. Project

| 接口组                                                         | 后端状态            | 前端状态        | 证据或动作                                             |
| -------------------------------------------------------------- | ------------------- | --------------- | ------------------------------------------------------ |
| list / detail / create / update / delete                       | `READY`             | `live-verified` | PR #30、#31；完成可清理真实 CRUD                       |
| batch-delete / copy / statistics / overview / tasks / pipeline | `READY`             | `parked`        | 原始文档确认路径，但当前产品流程不需要继续扩展         |
| start-generation                                               | `MOCK`              | `disabled`      | 不作为真实 AI 流程                                     |
| compat export query                                            | `REAL`              | `mismatch`      | 后端是导出语义，旧前端错误映射为 Project；当前显式阻断 |
| import                                                         | `CONTROLLED_REJECT` | `disabled`      | 不发送真实请求                                         |

## 5. Script 与 Editor

| 接口组               | 后端状态     | 前端状态        | 证据或动作                                         |
| -------------------- | ------------ | --------------- | -------------------------------------------------- |
| Script Workspace GET | `READY`      | `live-verified` | 真实读取 rawText、prompt 和状态字段                |
| Script Draft PUT     | `READY`      | `live-verified` | rawText/prompt 写入并回读成功                      |
| Script Content PUT   | `READY`      | `mismatch`      | 原始文档仍缺请求 DTO；历史猜测字段未产生可回读结果 |
| Script Confirm       | `READY`      | `parked`        | 等 Content 请求 DTO、失败 Fixture 和前置状态闭环   |
| Script Generate      | `MOCK`       | `disabled`      | 不是实际 AI 生成                                   |
| revision/version/409 | 未定义       | `parked`        | 只采用后端真实返回值，不伪造并发版本               |
| Editor 六分区持久化  | 前端领域设计 | `parked`        | 保留现有稳定 Mock/领域结构，不继续猜测分区写契约   |

## 6. Storyboard、Project Asset 与 Resource Library

| 模块                                  | 后端状态     | 前端状态     | 证据或动作                                                                  |
| ------------------------------------- | ------------ | ------------ | --------------------------------------------------------------------------- |
| Storyboard Workspace 读取             | `READY`      | `integrated` | 已按项目级 Workspace 路径读取并映射基础分镜字段                             |
| Storyboard CRUD / sort / confirm      | `READY`      | `parked`     | 原始文档仅确认路径和最小字段，缺完整响应、错误 Fixture 与页面字段持久化语义 |
| Storyboard Generate                   | `MOCK`       | `disabled`   | 不作为真实 AI 结果                                                          |
| Project Asset list                    | `READY`      | `integrated` | 已修正为 `/aidrama/projects/{id}/assets` 并映射 CHARACTER/SCENE/PROP        |
| Project Asset single-entity CRUD      | `READY`      | `parked`     | 已确认 Method/Path 和创建字段，但缺真实写后读、更新及删除响应证据           |
| Project Asset aggregate save          | 后端无此接口 | `disabled`   | 旧整体 PUT 已显式拒绝                                                       |
| Resource Library list / CRUD          | `READY`      | `integrated` | 已接入真实 CRUD 路径、`assetType`、`scope` 和 `extraJson`                   |
| save-to-library / import-from-library | `READY`      | `parked`     | 原始文档确认 COPY Snapshot 语义，但页面闭环和权限证据不足                   |
| Media Upload                          | 未提供       | `blocked`    | 等 multipart/预签名上传与 OSS/CDN 规则                                      |

## 7. Phase1 Compat

| 模块                                | 后端状态            | 前端状态     | 证据或动作                              |
| ----------------------------------- | ------------------- | ------------ | --------------------------------------- |
| `GET /system`                       | `REAL`              | `integrated` | 支持轻量和完整状态数据                  |
| System styles/permissions write     | `CONTROLLED_REJECT` | `disabled`   | Capability 在请求前阻断                 |
| System messages                     | `NO_OP`             | `integrated` | 兼容 `data=null`，Store 本地更新状态    |
| Voices CRUD                         | `REAL`              | `integrated` | DTO Mapper、标准分页和旧包装兼容已完成  |
| Script Templates CRUD               | `REAL`              | `integrated` | DTO Mapper、标准分页和旧包装兼容已完成  |
| Generation list/detail/cancel/retry | `REAL`              | `integrated` | 已接入任务 DTO Mapper，未知枚举显式失败 |
| Generation create/update            | `CONTROLLED_REJECT` | `disabled`   | 业务生成必须调用具体 Submit 接口        |

## 8. AI、Provider 与 Export

| 能力                                     | 后端状态           | 前端状态   | 当前结论                                    |
| ---------------------------------------- | ------------------ | ---------- | ------------------------------------------- |
| Provider Sandbox                         | `PARTIAL` / `MOCK` | `disabled` | 仅开发联调工具，resultUrl 为占位地址        |
| Provider Callback                        | 算法服务入口       | `disabled` | 普通前端禁止调用                            |
| Export Workspace / History / Mock Export | `PARTIAL` / `MOCK` | `parked`   | 可验证状态流，但当前无继续接入价值          |
| Image2 / Seedance / TTS                  | `BLOCKED`          | `blocked`  | 等真实 Submit、Callback、Task Result 和媒体 |
| 视频合成、下载、OSS/CDN                  | `BLOCKED`          | `blocked`  | 等生产媒体链路                              |

## 9. 真实验证工具

- `integration:auth-session`：登录、Profile、有效 Token 和失效 Token 401；
- `integration:project-crud`：可自动清理的 Project CRUD；
- 新增模块应先用 `pnpm scaffold:http-module <module>` 建立 Contract、DTO、Mapper、HTTP/Mock Adapter 和测试入口。

## 10. 当前冻结点

本轮停止继续开发新的真实写接口。#37 Project Asset 单实体 CRUD 与 #38 Storyboard Workspace 读写保留为 `parked` Backlog，不视为已完成，也不在缺少新增后端证据时继续实现。

恢复条件满足任一项即可重新评估：

1. 后端 OpenAPI/Swagger 或请求/响应 DTO；
2. 可脱敏保存的成功、空值和失败响应；
3. 可访问的测试环境、账号及允许自动清理的写入验证；
4. 真实 AI Submit/Task/Callback/Result 或媒体上传契约。
