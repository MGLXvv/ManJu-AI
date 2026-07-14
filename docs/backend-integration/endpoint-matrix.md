# 后端端点与前端接入矩阵

> 本矩阵区分“后端文档声明”“前端已有代码”和“真实环境证据”。后端文档中的 `READY` 不自动等于前端 `verified`。

## 状态

| 状态                | 含义                                             |
| ------------------- | ------------------------------------------------ |
| `verified`          | 真实成功、失败、权限、刷新恢复和页面流程均已验收 |
| `contract-verified` | Method、Path、DTO 和基础成功链已有真实证据       |
| `documented`        | 后端文档声明存在，但缺少完整 DTO 或 Fixture      |
| `mock-only`         | Mock、占位任务或占位媒体                         |
| `controlled-reject` | 后端稳定拒绝，不能在 UI 宣称可用                 |
| `no-op`             | 返回成功但没有真实业务副作用                     |
| `blocked`           | 缺少算法、媒体、上传、生产会话或正式实现         |
| `mismatch`          | 前端假设与真实响应存在明确差异                   |
| `unconfirmed`       | 请求体、响应体、状态或语义尚未确认               |

## 环境与协议

| 项目                                 | 状态                | 结论                          |
| ------------------------------------ | ------------------- | ----------------------------- |
| Base URL、`/admin-api`、Bearer Token | `contract-verified` | WireGuard 环境已完成真实请求  |
| `{ code, msg, data }`                | `contract-verified` | 业务成功必须判断 `code === 0` |
| Project `list/total`                 | `contract-verified` | 其他模块分页仍需 Fixture      |
| Refresh Token                        | `blocked`           | 后端没有换新接口              |
| CORS、Nginx、HTTPS                   | `blocked`           | 测试阶段使用 Vite Proxy       |
| 时间时区、requestId/traceId          | `unconfirmed`       | 当前样例不足                  |

## Auth

| 接口                      | 状态                | 前端动作                           |
| ------------------------- | ------------------- | ---------------------------------- |
| password login            | `contract-verified` | 保留当前 Adapter                   |
| profile                   | `contract-verified` | 用于登录补全和刷新恢复             |
| invalid token 401         | `contract-verified` | 清理 Session 并跳转登录            |
| low-permission 403        | `unconfirmed`       | 保留登录态，等待低权限账号 Fixture |
| code login/register/reset | `documented`        | 当前版本保持隐藏                   |
| social login              | `blocked`           | 真实平台未联调                     |
| logout API                | `unconfirmed`       | 当前只做本地清理                   |

## Project

| 接口组                                               | 状态                | 前端动作                                  |
| ---------------------------------------------------- | ------------------- | ----------------------------------------- |
| list/detail/create/update/delete                     | `contract-verified` | 已完成可清理真实 CRUD；页面级验收后再升级 |
| batch-delete/copy/statistics/overview/tasks/pipeline | `documented`        | 后端提供 DTO 后逐项接入                   |
| start-generation                                     | `mock-only`         | 不作为真实生成能力                        |
| export compat query                                  | `documented`        | 等真实导出语义和 Fixture                  |
| import                                               | `controlled-reject` | Capability 保持关闭                       |

## Script 与 Editor

| 接口或能力                             | 状态                | 前端动作                                         |
| -------------------------------------- | ------------------- | ------------------------------------------------ |
| Script Workspace GET                   | `contract-verified` | HTTP 默认只加载 Script 分区                      |
| Script Draft PUT                       | `contract-verified` | 仅保存已确认的 `rawText/prompt`                  |
| Script Content PUT                     | `mismatch`          | 文档无请求 DTO；真实探测未保存，Adapter 显式阻断 |
| Script Generate                        | `mock-only`         | 不作为真实算法                                   |
| Script Confirm                         | `documented`        | Content 契约闭环后再验收                         |
| revision/version/409                   | `unconfirmed`       | 不伪造版本和冲突请求                             |
| Setting/Video/Dubbing/ProjectMeta 保存 | `blocked`           | 未实现分区显式拒绝                               |
| Storyboard Workspace 读取              | `documented`        | 仅显式请求时加载；错误不再吞掉                   |

## Storyboard、Asset 与 Resource

| 模块                                   | 状态         | 主要缺口                                               |
| -------------------------------------- | ------------ | ------------------------------------------------------ |
| Storyboard Workspace/CRUD/sort/confirm | `documented` | 缺真实 DTO、失败和前置状态 Fixture                     |
| Storyboard generate                    | `mock-only`  | 没有真实算法                                           |
| Project Asset                          | `mismatch`   | 历史路径和保存模型与文档不一致                         |
| Resource list/workspace                | `documented` | 缺真实分页和权限 Fixture                               |
| Resource CRUD/import/save              | `documented` | Capability 保持只读，等待 Mapper 验证                  |
| Asset type/scope                       | `mismatch`   | 必须统一 CHARACTER/SCENE/PROP 与 PRIVATE/SYSTEM/SHARED |
| Media Upload                           | `blocked`    | 缺上传和 OSS/CDN 生命周期                              |

## Phase1 Compat

| 模块                                | 状态                | 前端动作                 |
| ----------------------------------- | ------------------- | ------------------------ |
| `GET /system`                       | `documented`        | 可优先只读接入           |
| System styles/permissions write     | `controlled-reject` | 保持关闭                 |
| System messages                     | `no-op`             | 不宣称真实消息中心       |
| Voices CRUD                         | `documented`        | 先确认分页和 DTO         |
| Script Templates CRUD               | `documented`        | 先确认分页、作用域和 DTO |
| Generation list/detail/cancel/retry | `documented`        | 保存真实 Fixture 后接入  |
| Generation create/update            | `controlled-reject` | 禁止直接调用             |

## AI、Provider 与 Export

| 能力                                 | 状态         | 说明                            |
| ------------------------------------ | ------------ | ------------------------------- |
| Provider Sandbox                     | `mock-only`  | resultUrl 为占位地址            |
| Provider Callback                    | `not-for-ui` | 普通前端禁止调用                |
| Export workspace/history/mock export | `mock-only`  | 不生成真实成片                  |
| Image2、Seedance 2.0、TTS            | `blocked`    | 等待真实 Submit/Callback 和媒体 |
| 视频合成、下载、OSS/CDN              | `blocked`    | Mock URL 不可视为永久资源       |

## 保留的真实验证工具

- `integration:auth-session`：验证登录、Profile 和失效 Token 401；
- `integration:project-crud`：验证可自动清理的 Project CRUD。

Script Content 请求 DTO 未冻结，因此不再保留猜测性 Script Workspace 写入探测脚本。后续新增联调工具前必须先有后端 DTO、脱敏 Fixture、显式写入授权和失败自动清理。
