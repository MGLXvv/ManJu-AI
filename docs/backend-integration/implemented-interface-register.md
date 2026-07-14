# 已完成接口接入记录

## 1. 记录口径

本文件只记录前端接入证据，不重新定义后端 `READY`。

- `READY` / `REAL`：后端真实业务接口已经实现；
- `live-verified`：前端已在 WireGuard 测试环境完成真实请求；
- `integrated`：前端 Adapter、DTO/Mapper 和自动测试已完成，仍可能缺少真实 Fixture、低权限或页面验收；
- `adapter-ready`：前端领域边界已存在，但尚未完成真实接口映射。

## 2. 历史已合并工作

| PR | 完成内容 | 当前价值 |
| --- | --- | --- |
| #3 | 初版后端接入指南、状态矩阵、HTTP/Mock 边界 | 建立“后端差异只进入 Adapter/Mapper”的原则 |
| #5 | Runtime Config、Auth Session Repository、CapabilityRegistry | 统一 Mock/HTTP 切换和未开放能力保护 |
| #6 | GenerationTaskGateway | 提供轮询、恢复、取消、重试、幂等和有限并发边界 |
| #7 | EditorPersistenceService | 提供分区脏状态、自动保存、重试和冲突处理边界 |
| #9 | MediaUploadService 与轻量任务结果 | 隔离 Data URL、Blob URL、媒体 ID 和后端稳定 URL |
| #10 | HTTP/Mock 依赖检查、契约 Fixture、Mock E2E 和 CI | 防止 HTTP Adapter 间接依赖 Mock |
| #29 | 将 Integration Pack 和 Phase1 整理为仓库规格 | 形成环境、协议、端点和待确认项基线 |
| #30 | Auth Profile 和 Project 读取真实接入 | 保存脱敏 Profile、Project list/detail Fixture |
| #31 | Project CRUD 真实验证 | 完成 create → detail → rename → delete → absence |
| #32 | 失效 Token 401 和 Session 过期恢复 | 完成有效 Token / 无效 Token 真实验证 |
| #35 | Editor 分区加载和未确认契约显式阻断 | 防止 Storyboard 错误被吞、revision 被伪造 |

## 3. 已完成真实环境验证

### Auth

| 接口或场景 | 前端状态 | 证据 |
| --- | --- | --- |
| `POST /system/auth/login` | `live-verified` | 真实账号登录成功和错误密码业务 401 |
| `GET /system/auth/profile` | `live-verified` | Profile、roles、permissions 和刷新恢复 |
| 无效 Token | `live-verified` | 后端拒绝，前端清理 Session 并进入登录页 |
| 低权限 403 | `adapter-ready` | 前端行为已实现，缺低权限账号 |

### Project

| 接口 | 前端状态 | 证据 |
| --- | --- | --- |
| `GET /aidrama/projects` | `live-verified` | 确认 `data.list/data.total` 和 `DRAFT` |
| `GET /aidrama/projects/{id}` | `live-verified` | 脱敏真实详情 Fixture |
| `POST /aidrama/projects` | `live-verified` | 临时项目创建成功 |
| `PUT /aidrama/projects/{id}` | `live-verified` | 临时项目重命名成功 |
| `DELETE /aidrama/projects/{id}` | `live-verified` | 删除并确认列表中不存在 |

### Script

| 接口 | 前端状态 | 证据 |
| --- | --- | --- |
| `GET /aidrama/projects/{id}/script/workspace` | `live-verified` | 读取 rawText、prompt、scriptContent 和状态字段 |
| `PUT /aidrama/projects/{id}/script/draft` | `live-verified` | rawText/prompt 写入并回读一致 |
| `PUT /aidrama/projects/{id}/script/content` | `mismatch` | 路径存在，但文档未给 Request DTO；猜测字段未形成可回读结果 |
| `POST /aidrama/projects/{id}/script/confirm` | `adapter-ready` | 等 Content 请求 DTO 和前置状态闭环 |

## 4. 本轮完成的 Adapter 优化

### 标准响应解包

新增 `src/api/shared/backendPayload.ts`：

- 新接口优先使用 `data.list` 和直接实体；
- 旧 `voices/templates/tasks` 与 `voice/template/task` 只作为迁移兼容；
- 页面和 Store 不感知包装字段。

### Voice、Script Template、Generation Tasks

- 拆分独立 DTO Mapper；
- 列表统一发送 `pageNo/pageSize`；
- Generation Task 支持 `taskType/type`、`taskId/id`、`storyboardId/shotId`、错误字段和时间字段兼容；
- Phase1 REAL 的 cancel/retry 在 HTTP 模式默认开放；
- 通用 create/update 继续按 CONTROLLED_REJECT 显式拒绝。

### Resource Library

- 接入 READY 的 list/create/update/delete；
- 使用 `assetType`、`scope`、JSON 字符串 `extraJson`；
- 支持 CHARACTER、SCENE 和 PROP；
- PRIVATE 映射为用户创建，SYSTEM/SHARED 映射为前端官方来源；
- favorite 和 selectedVoiceId 保存在 extraJson 中。

### Project Asset

- 读取路径修正为 `/aidrama/projects/{projectId}/assets`；
- 删除历史错误的聚合 `PUT /projects/{id}/assets`；
- 当前 `save(projectId, assets[])` 在 HTTP 模式显式拒绝；
- 后续 Store 应迁移到单资产 POST/PUT/DELETE。

### Project Import / Export

- Project Import 是 CONTROLLED_REJECT，不再调用错误的 `/aidrama/projects/import`；
- Phase1 compat Export 是导出语义，不能映射为 Project 实体；
- 旧 `exportProject(): Project` 在 HTTP 模式显式拒绝；
- 真实导出继续由 `exportWorkflowService` 和后续导出 Contract 承担。

### System

- styles/permissions 写入在 API 层通过 `system.write` 阻断，不再向 CONTROLLED_REJECT 端点发送请求；
- message read/read-all 兼容 Phase1 的 `data=null`；
- Store 继续负责 No-op 接口后的本地 UI 状态更新。

## 5. 尚未完成接入的 READY 接口

优先级从高到低：

1. Storyboard Workspace、CRUD、sort 和 confirm；
2. Project Asset 单实体 create/update/delete、workspace/raw 和 batch-delete；
3. Resource save-to-library / import-from-library；
4. Project statistics、overview、tasks 和 pipeline；
5. Project copy 和 batch-delete；
6. Auth code login、register 和 reset-password 页面链路；
7. System Status 真实 Fixture；
8. Voice、Template、Generation Tasks 真实分页和失败 Fixture。

AI Generate、Provider Sandbox 和 Export Mock 不应与上述 READY/REAL 接口混为同一完成级别。
