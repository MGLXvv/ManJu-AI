# 后端端点与前端接入矩阵

> 后端状态来自 Frontend Integration Pack 与 Frontend API Compat Phase1；前端状态基于当前 `master` 审计。`confirmed` 不等于 `verified`。

## Auth

| 接口                               | 后端         | 前端            | 结论                                           |
| ---------------------------------- | ------------ | --------------- | ---------------------------------------------- |
| `POST /system/auth/login`          | READY        | implemented     | 已使用 `username/password`，映射不透明 Token   |
| `GET /system/auth/profile`         | READY        | missing         | 会话恢复仍主要依赖本地 Session，需接入 Profile |
| `POST /system/auth/send-code`      | READY        | unsupported     | Adapter 明确抛出 unsupported                   |
| `POST /system/auth/code-login`     | READY        | unsupported     | Adapter 明确抛出 unsupported                   |
| `POST /system/auth/register`       | READY        | unsupported     | Adapter 明确抛出 unsupported                   |
| `POST /system/auth/reset-password` | READY        | unsupported     | Adapter 明确抛出 unsupported                   |
| `POST /system/auth/social/login`   | partial      | unsupported     | 后端真实平台未正式联调，保持隐藏合理           |
| Refresh Token                      | unavailable  | not implemented | 后端没有换新接口，禁止前端自动刷新             |
| Logout                             | undocumented | local only      | 当前只清理前端会话                             |

## Project

| 接口                                           | 后端              | 前端        | 结论                                                                    |
| ---------------------------------------------- | ----------------- | ----------- | ----------------------------------------------------------------------- |
| `GET /aidrama/projects`                        | READY             | mismatch    | 路径正确，但前端读取 `records`，确认分页为 `list/total`                 |
| `GET /aidrama/projects/{id}`                   | READY             | implemented | 仍需真实 Fixture 验证字段和空值                                         |
| `POST /aidrama/projects`                       | READY             | partial     | 最小请求字段基本匹配，固定 description/language/duration                |
| `PUT /aidrama/projects/{id}`                   | READY             | partial     | 仅映射 name/status，真实可更新字段未完整覆盖                            |
| `DELETE /aidrama/projects/{id}`                | READY             | implemented | 逻辑删除语义需页面验收                                                  |
| `POST /aidrama/projects/batch-delete`          | READY             | missing     | 未接入                                                                  |
| `POST /aidrama/projects/{id}/copy`             | READY             | missing     | 未接入                                                                  |
| `GET /aidrama/projects/statistics`             | READY             | missing     | 未接入                                                                  |
| `GET /aidrama/projects/{id}/overview`          | READY             | missing     | 未接入                                                                  |
| `GET /aidrama/projects/{id}/tasks`             | READY             | missing     | 未接入                                                                  |
| `GET /aidrama/projects/{id}/pipeline`          | READY             | missing     | 未接入                                                                  |
| `POST /aidrama/projects/{id}/start-generation` | Mock READY        | missing     | 未接入                                                                  |
| `GET /projects/{id}/export`                    | REAL compat       | mismatch    | 后端 compat 路径无 `/aidrama`，前端使用 `/aidrama/projects/{id}/export` |
| `POST /projects/import`                        | controlled-reject | mismatch    | 前端预留 `/aidrama/projects/import`，路径和语义均不符；能力应保持关闭   |

## Script 与 Editor

| 接口                                          | 后端           | 前端        | 结论                                         |
| --------------------------------------------- | -------------- | ----------- | -------------------------------------------- |
| `GET /aidrama/projects/{id}/script/workspace` | READY          | implemented | 已用于草稿加载                               |
| `PUT /aidrama/projects/{id}/script/draft`     | READY          | implemented | 已保存 rawText/prompt                        |
| `POST /aidrama/projects/{id}/script/generate` | Mock READY     | partial     | 业务服务已有生成入口，需真实页面验收         |
| `PUT /aidrama/projects/{id}/script/content`   | READY          | implemented | generated 非空时保存                         |
| `POST /aidrama/projects/{id}/script/confirm`  | READY          | partial     | 需核对业务服务与页面入口                     |
| `GET/PUT /aidrama/projects/{id}/script`       | legacy         | reserved    | 不应优先于 workspace 接口                    |
| Editor revision                               | frontend-local | mismatch    | 当前 revision 为前端自增，不代表后端并发版本 |

## Storyboard

| 接口组                         | 后端  | 前端     | 结论                                                                               |
| ------------------------------ | ----- | -------- | ---------------------------------------------------------------------------------- |
| workspace / generate / confirm | READY | partial  | Workspace 已读取；生成和确认需逐项契约验收                                         |
| storyboards CRUD / sort        | READY | partial  | 已有多个 Storyboard Adapter/Service，但尚未证明完整覆盖确认路径                    |
| 加载失败处理                   | —     | mismatch | Editor 当前吞掉 Storyboard Workspace 错误并返回空 shots，HTTP 模式不应静默掩盖故障 |

## Project Asset 与 Resource Library

| 接口组                              | 后端      | 前端            | 结论                                                                                |
| ----------------------------------- | --------- | --------------- | ----------------------------------------------------------------------------------- |
| `/aidrama/projects/{id}/assets...`  | READY     | mismatch        | 独立 `asset.http.ts` 使用 `/projects/{id}/assets`，缺少 `/aidrama` 且保存模型不匹配 |
| Resource workspace/list             | READY     | partial         | 列表按 `list` 读取，基础方向正确                                                    |
| Resource CRUD                       | READY     | disabled        | 后端已可用，前端仍抛 `resourceHttpWriteUnsupported`                                 |
| save-to-library/import-from-library | READY     | missing/partial | 需接入 COPY Snapshot 语义                                                           |
| Asset type                          | confirmed | mismatch        | Resource Mapper 将非 CHARACTER 全映射为 scene，PROP 丢失                            |
| Resource scope                      | confirmed | mismatch        | 后端为 PRIVATE/SYSTEM/SHARED，前端仍判断 OFFICIAL                                   |
| `extraJson`                         | string    | partial         | 已有解析逻辑，请求端仍需保证 JSON 字符串                                            |

## Phase1 Compat

| 模块                             | 后端              | 前端                | 结论                                                                      |
| -------------------------------- | ----------------- | ------------------- | ------------------------------------------------------------------------- |
| `GET /system`                    | REAL              | implemented         | 有归一化读取逻辑                                                          |
| System styles/permissions 写接口 | controlled-reject | capability readonly | 默认关闭合理；Adapter 仍存在调用实现                                      |
| System messages                  | no-op success     | partial             | 路径已接入，需要兼容 `data=null`                                          |
| Voices CRUD                      | REAL              | disabled/partial    | 路径已接入，但 Capability 仍 readonly；列表字段假设 `voices` 未由文档确认 |
| Script Templates CRUD            | REAL              | partial             | 路径已接入；列表字段假设 `templates` 未由文档确认                         |
| Generation task list/detail      | REAL              | partial             | 路径正确；返回字段假设 `tasks/task`，需真实 Fixture                       |
| Generation cancel/retry          | REAL              | disabled            | Adapter 已实现，但能力默认 unsupported                                    |
| Generation create/update         | controlled-reject | controlled error    | 前端行为与后端阶段一致                                                    |

## Provider Sandbox 与 Export

| 接口组                                     | 后端           | 前端       | 结论                                                        |
| ------------------------------------------ | -------------- | ---------- | ----------------------------------------------------------- |
| `/aidrama/provider-sandbox/tasks/{id}/...` | PARTIAL        | missing    | 普通前端仅用于测试工具，必须先有合法 taskId 和 Bearer Token |
| `/aidrama/provider/callback`               | algorithm-only | not for UI | 普通前端禁止调用                                            |
| Export workspace/history/detail/download   | PARTIAL Mock   | partial    | 页面/服务已有导出基础，但未按本文档完成真实契约验收         |
| 真实成片                                   | blocked        | blocked    | 不得把占位 resultUrl 作为真实媒体                           |

## 后端明确阻塞能力

- 真实 Image2；
- 真实 Seedance 2.0；
- 真实 TTS Provider；
- 真实导出合成；
- 项目导入；
- System styles/permissions 真实写入；
- Nginx 正式域名、HTTPS 与生产入口。
