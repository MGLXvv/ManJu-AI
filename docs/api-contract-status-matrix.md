# ManJu-AI 接口契约状态矩阵

> 该文件记录模块级状态。端点级证据以 `docs/backend-integration/endpoint-matrix.md` 为准，详细接入流程以 `docs/backend-integration/frontend-integration-handbook.md` 为准。

## 1. 状态定义

| 状态 | 含义 |
| --- | --- |
| `verified` | 完整真实页面、成功、失败、权限和刷新恢复验收 |
| `contract-verified` | Method、Path、DTO 和基础成功链已有真实证据 |
| `documented` | 后端文档声明存在，但缺少完整 DTO 或 Fixture |
| `framework-ready` | 前端 Contract、Adapter 边界、Capability 和测试基础已准备 |
| `mock-only` | 仅 Mock、占位任务或占位媒体 |
| `controlled-reject` | 后端稳定拒绝，前端必须保持关闭 |
| `no-op` | 返回成功但没有真实业务副作用 |
| `blocked` | 缺少正式后端、算法、媒体或生产协议 |
| `mismatch` | 前端实现与真实响应存在明确差异 |

## 2. 模块状态

| 模块 | 当前状态 | 已有前端基础 | 主要缺口 | 后端到位后的修改点 |
| --- | --- | --- | --- | --- |
| Auth | `contract-verified` | 登录、Profile、Session Repository、401/403 状态、Capability | 低权限 403、Logout、Refresh、生产 Session | `auth.http.ts`、DTO、权限 Fixture |
| Project | `contract-verified` | list/detail/create/update/delete Adapter、Mapper、真实 Fixture、安全 CRUD 验证 | 页面级验收、扩展端点、完整 update DTO | `project.http.ts`、Mapper、Capability |
| Editor Persistence | `framework-ready` | 分区 Contract、Persistence Service、按分区加载、未实现显式拒绝 | 除 Script Draft 外的 Workspace DTO | 各分区 `*.http.ts` 和 Mapper |
| Script Draft | `contract-verified` | Workspace GET、rawText/prompt 保存和回读 | Content DTO、Confirm、revision/409 | `editor.http.ts`、Fixture、冲突映射 |
| Script Content | `mismatch` | 稳定错误码和阻断机制 | 文档无请求 DTO，真实探测未保存 | 后端 DTO 到位后替换阻断逻辑 |
| Script Generate | `mock-only` | Mock 生成 Service 和页面状态 | 真实任务 Submit/Result | GenerationTaskGateway 和 Workspace 刷新 |
| Storyboard | `documented` | Workspace Mapper、CRUD/Service 历史实现、分区加载 | 真实 DTO、错误、前置状态、生成算法 | Storyboard Adapter、Mapper、Fixture |
| Project Asset | `mismatch` | 项目资产领域模型和历史 Adapter | 路径、单实体 CRUD、类型/作用域 | 重做 Asset HTTP Adapter |
| Resource Library | `documented` | 读取 Adapter、Service、Capability readonly | 分页、CRUD、COPY Snapshot、权限 | Resource DTO、Mapper、Capability |
| Voice | `documented` | `/voices` Adapter、Capability readonly | 分页、字段、试听和上传 | Voice DTO、Mapper、Media Upload |
| Script Template | `documented` | CRUD Adapter | 分页、作用域和字段 | Template DTO、Mapper |
| Generation Tasks | `documented` | Gateway、状态机、list/detail/cancel/retry 入口 | 真实分页、状态、允许操作、轮询协议 | Generation Adapter、Fixture、Capability |
| Generation create/update | `controlled-reject` | 稳定错误处理 | 后端明确不允许通用创建和 PATCH | 不接入 |
| System Status | `documented` | `GET /system` Adapter | 真实 Fixture | System DTO、Mapper |
| System Messages | `no-op` | 兼容入口 | 没有真实消息中心 | 保持兼容，不宣称可用 |
| System Write | `controlled-reject` | Capability readonly | 后端 Phase1 不开放 | 不接入 |
| Media Upload | `blocked` | MediaUploadService 抽象、Mock 文件处理 | 上传、资源 ID、URL 生命周期、OSS/CDN | 上传 Adapter 和媒体 Mapper |
| Provider Sandbox | `mock-only` | Provider 测试边界 | 合法任务依赖，resultUrl 占位 | 仅测试工具 |
| Export | `mock-only` | Workspace/历史/任务边界 | 真实合成、下载和媒体 | Export Task 和 Download Adapter |
| Image2 / Seedance / TTS | `blocked` | 前端任务和结果抽象 | 真实 Submit/Callback/Result | 业务生成 Adapter |
| Registration / Code Login / Social | `documented` 或 `blocked` | 页面和 Capability 占位 | 产品范围和真实平台 | 独立立项 |

## 3. 当前前端运行约定

- API 模式和基础地址由 `src/config/runtimeConfig.ts` 统一读取；
- HTTP 默认基础路径为 `/admin-api`；
- 页面、组件和 Store 不直接调用 Axios；
- Mock 与 HTTP 返回相同前端 Contract；
- DTO 差异只进入 `*.http.ts`、`*.types.ts` 和 `*.mapper.ts`；
- 未确认能力通过 Capability 或稳定 ApiError 显式阻断；
- HTTP 模式不得静默回退 Mock；
- revision/version 只使用后端真实值；
- Mock resultUrl、Data URL 和 Blob URL 不作为永久媒体；
- `verified` 只能由真实环境完整验收产生。

## 4. 接口状态升级规则

```text
blocked/documented
-> framework-ready
-> contract-verified
-> verified
```

升级到 `contract-verified` 至少需要：

- 后端版本；
- Method、Path 和 DTO；
- 脱敏成功 Fixture；
- Adapter 和 Mapper 测试；
- 基础真实请求。

升级到 `verified` 还需要：

- 空值；
- 业务失败；
- 401/403；
- 网络失败；
- 页面流程；
- 刷新恢复；
- Mock 回归；
- 类型检查、单元测试、构建和 E2E。
