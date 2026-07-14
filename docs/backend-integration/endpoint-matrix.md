# 后端端点与前端接入矩阵

## 1. 两个状态维度

后端文档中的 `READY` 表示真实业务接口已经实现并可供前端接入；它不等于“完整产品流程、真实 AI 算法和生产媒体链路全部完成”。

本矩阵分别记录：

- **后端状态**：Integration Pack / Phase1 对接口实现性质的说明；
- **前端状态**：当前 Adapter、Fixture、真实联调和页面流程的完成程度。

### 后端状态

| 状态 | 含义 |
| --- | --- |
| `READY` | 真实业务接口已实现，可进入前端接入 |
| `REAL` | Phase1 提供真实读取或 CRUD 能力 |
| `MOCK` | 接口存在，但业务结果由 Mock 或同步占位实现 |
| `PARTIAL` | 只完成部分接口或部分流程 |
| `CONTROLLED_REJECT` | 接口稳定拒绝，用于兼容和阶段保护 |
| `NO_OP` | 返回成功，但没有真实业务副作用 |
| `BLOCKED` | 后端算法、媒体或生产基础设施尚未完成 |

### 前端状态

| 状态 | 含义 |
| --- | --- |
| `live-verified` | 已通过真实环境成功链或失败链验证 |
| `integrated` | HTTP Adapter、DTO/Mapper 和测试已完成，仍缺部分真实 Fixture 或页面验收 |
| `adapter-ready` | 已有前端领域边界，但未按真实接口完成 Adapter |
| `disabled` | 根据后端状态或产品范围主动关闭 |
| `mismatch` | 历史实现的路径、请求模型或返回语义不正确 |
| `blocked` | 依赖未完成的后端算法、媒体或生产协议 |

## 2. 环境与通用协议

| 项目 | 后端状态 | 前端状态 | 当前结论 |
| --- | --- | --- | --- |
| `/admin-api`、Bearer Token、CommonResult | `READY` | `live-verified` | 已通过 WireGuard 完成真实登录和业务请求 |
| Project `data.list/data.total` | `READY` | `live-verified` | Project 已保存真实 Fixture |
| 其他目录分页 | `READY` / `REAL` | `integrated` | 前端优先读取 `list`，临时兼容旧包装字段 |
| Refresh Token | 未提供 | `disabled` | 不实现猜测性的自动刷新 |
| 正式域名、HTTPS、Nginx | `BLOCKED` | `blocked` | 测试阶段继续使用 Vite Proxy |
| 时间时区、requestId/traceId | 未确认 | `adapter-ready` | 等后端统一协议 |

## 3. Auth

| 接口组 | 后端状态 | 前端状态 | 证据或动作 |
| --- | --- | --- | --- |
| password login | `READY` | `live-verified` | PR #30、#32；真实登录和失效 Token 401 |
| profile | `READY` | `live-verified` | 真实角色、权限和刷新恢复 |
| low-permission 403 | `READY` | `adapter-ready` | 处理逻辑已存在，仍需低权限账号 |
| code login / register / reset | `READY` | `disabled` | 后端接口已完成，当前前端产品范围未接入 |
| social login | 平台未完成 | `blocked` | 等真实第三方平台 |
| logout | 未定义 | `disabled` | 当前只清理前端 Session |

## 4. Project

| 接口组 | 后端状态 | 前端状态 | 证据或动作 |
| --- | --- | --- | --- |
| list / detail / create / update / delete | `READY` | `live-verified` | PR #30、#31；完成可清理真实 CRUD |
| batch-delete / copy / statistics / overview / tasks / pipeline | `READY` | `adapter-ready` | 后端已实现，前端尚未建立对应 Contract |
| start-generation | `MOCK` | `disabled` | 不作为真实 AI 流程 |
| compat export query | `REAL` | `mismatch` | 后端是导出语义，旧前端错误映射为 Project；当前显式阻断 |
| import | `CONTROLLED_REJECT` | `disabled` | 不发送真实请求 |

## 5. Script 与 Editor

| 接口组 | 后端状态 | 前端状态 | 证据或动作 |
| --- | --- | --- | --- |
| Script Workspace GET | `READY` | `live-verified` | 真实读取 rawText、prompt 和状态字段 |
| Script Draft PUT | `READY` | `live-verified` | rawText/prompt 写入并回读成功 |
| Script Content PUT | `READY` | `mismatch` | 文档缺请求 DTO，历史猜测字段未产生可回读结果；当前显式阻断 |
| Script Confirm | `READY` | `adapter-ready` | 等 Content 请求 DTO 和前置状态闭环 |
| Script Generate | `MOCK` | `disabled` | 不是实际 AI 生成 |
| revision/version/409 | 未定义 | `adapter-ready` | 只采用后端真实返回值，不伪造并发版本 |
| Editor 六分区持久化 | 前端领域设计 | `adapter-ready` | 后续按 Workspace/CRUD 接口逐分区接入 |

## 6. Storyboard、Project Asset 与 Resource Library

| 模块 | 后端状态 | 前端状态 | 证据或动作 |
| --- | --- | --- | --- |
| Storyboard Workspace / CRUD / sort / confirm | `READY` | `adapter-ready` | 领域 Service 已有，旧 `/storyboard/...` 辅助路径需迁移到项目级接口 |
| Storyboard Generate | `MOCK` | `disabled` | 不作为真实 AI 结果 |
| Project Asset list | `READY` | `integrated` | 已修正为 `/aidrama/projects/{id}/assets` 并映射 CHARACTER/SCENE/PROP |
| Project Asset aggregate save | 后端无此接口 | `disabled` | 旧整体 PUT 已删除；后续将 Store 迁移到单资产 CRUD |
| Resource Library list / CRUD | `READY` | `integrated` | 已接入真实 CRUD 路径、`assetType`、`scope` 和 `extraJson` |
| save-to-library / import-from-library | `READY` | `adapter-ready` | 等项目资产所有权与 COPY Snapshot 页面流程 |
| Media Upload | 未提供 | `blocked` | 等 multipart/预签名上传与 OSS/CDN 规则 |

## 7. Phase1 Compat

| 模块 | 后端状态 | 前端状态 | 证据或动作 |
| --- | --- | --- | --- |
| `GET /system` | `REAL` | `integrated` | 支持轻量和完整状态数据 |
| System styles/permissions write | `CONTROLLED_REJECT` | `disabled` | Capability 在请求前阻断 |
| System messages | `NO_OP` | `integrated` | 兼容 `data=null`，Store 本地更新状态 |
| Voices CRUD | `REAL` | `integrated` | DTO Mapper、标准分页和旧包装兼容已完成 |
| Script Templates CRUD | `REAL` | `integrated` | DTO Mapper、标准分页和旧包装兼容已完成 |
| Generation list/detail/cancel/retry | `REAL` | `integrated` | 已接入任务 DTO Mapper，cancel/retry 默认开放 |
| Generation create/update | `CONTROLLED_REJECT` | `disabled` | 业务生成必须调用具体 Submit 接口 |

## 8. AI、Provider 与 Export

| 能力 | 后端状态 | 前端状态 | 当前结论 |
| --- | --- | --- | --- |
| Provider Sandbox | `PARTIAL` / `MOCK` | `disabled` | 仅开发联调工具，resultUrl 为占位地址 |
| Provider Callback | 算法服务入口 | `disabled` | 普通前端禁止调用 |
| Export Workspace / History / Mock Export | `PARTIAL` / `MOCK` | `adapter-ready` | 可验证状态流，但不能宣称生成真实成片 |
| Image2 / Seedance / TTS | `BLOCKED` | `blocked` | 等真实 Submit、Callback、Task Result 和媒体 |
| 视频合成、下载、OSS/CDN | `BLOCKED` | `blocked` | 等生产媒体链路 |

## 9. 真实验证工具

- `integration:auth-session`：登录、Profile、有效 Token 和失效 Token 401；
- `integration:project-crud`：可自动清理的 Project CRUD；
- 新增模块应先用 `pnpm scaffold:http-module <module>` 建立 Contract、DTO、Mapper、HTTP/Mock Adapter 和测试入口。
