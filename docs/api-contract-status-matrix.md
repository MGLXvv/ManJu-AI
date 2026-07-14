# ManJu-AI 接口契约状态矩阵

> 端点级证据以 `docs/backend-integration/endpoint-matrix.md` 为准，详细接入流程以 `docs/backend-integration/frontend-readiness-handbook.md` 和 `docs/frontend-backend-integration-guide.md` 为准。

## 状态

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

## 模块状态

| 模块 | 当前状态 | 已有基础 | 主要缺口 |
| --- | --- | --- | --- |
| Auth | `contract-verified` | Login、Profile、Session、401/403 状态、Capability | 低权限 403、Logout、Refresh、生产 Session |
| Project | `contract-verified` | CRUD Adapter、Mapper、真实 Fixture、安全验证脚本 | 页面级验收、扩展端点、完整 update DTO |
| Editor Persistence | `framework-ready` | 分区 Contract、Persistence Service、按分区加载、显式拒绝 | 除 Script Draft 外的 Workspace DTO |
| Script Draft | `contract-verified` | Workspace GET、rawText/prompt 保存和回读 | Content DTO、Confirm、revision/409 |
| Script Content | `mismatch` | 稳定错误码和阻断机制 | 文档无请求 DTO，真实探测未保存 |
| Script Generate | `mock-only` | Mock Service 和页面状态 | 真实任务 Submit/Result |
| Storyboard | `documented` | Workspace Mapper、CRUD/Service 历史实现 | 真实 DTO、错误、前置状态、生成算法 |
| Project Asset | `mismatch` | 领域模型和历史 Adapter | 路径、CRUD 模型、类型和作用域 |
| Resource Library | `documented` | 读取 Adapter、Service、Capability readonly | 分页、CRUD、COPY Snapshot、权限 |
| Voice | `documented` | `/voices` Adapter、Capability readonly | 分页、字段、试听和上传 |
| Script Template | `documented` | CRUD Adapter | 分页、作用域和字段 |
| Generation Tasks | `documented` | Gateway、状态机、list/detail/cancel/retry 入口 | 真实分页、状态、允许操作和轮询 |
| Generation create/update | `controlled-reject` | 稳定错误处理 | 后端明确不允许 |
| System Status | `documented` | `GET /system` Adapter | 真实 Fixture |
| System Messages | `no-op` | 兼容入口 | 没有真实消息中心 |
| System Write | `controlled-reject` | Capability readonly | Phase1 不开放 |
| Media Upload | `blocked` | MediaUploadService 抽象、Mock 文件处理 | 上传、资源 ID、URL 生命周期、OSS/CDN |
| Provider Sandbox | `mock-only` | Provider 测试边界 | 合法任务依赖，resultUrl 占位 |
| Export | `mock-only` | Workspace/历史/任务边界 | 真实合成、下载和媒体 |
| Image2 / Seedance / TTS | `blocked` | 前端任务和结果抽象 | 真实 Submit/Callback/Result |
| Registration / Code Login / Social | `documented` 或 `blocked` | 页面和 Capability 占位 | 产品范围和真实平台 |

## 运行约定

- API 模式和基础地址由 `runtimeConfig.ts` 统一读取；
- HTTP 默认基础路径为 `/admin-api`；
- 页面、组件和 Store 不直接调用 Axios；
- Mock 与 HTTP 返回相同前端 Contract；
- DTO 差异只进入 Adapter、Types 和 Mapper；
- 未确认能力通过 Capability 或稳定 ApiError 显式阻断；
- HTTP 模式不得静默回退 Mock；
- revision/version 只使用后端真实值；
- Mock resultUrl、Data URL 和 Blob URL 不作为永久媒体；
- `verified` 只能由真实环境完整验收产生。

## 状态升级

```text
blocked/documented
-> framework-ready
-> contract-verified
-> verified
```

升级到 `contract-verified` 至少需要后端版本、Method/Path/DTO、脱敏成功 Fixture、Adapter/Mapper 测试和基础真实请求。

升级到 `verified` 还需要空值、业务失败、401/403、网络失败、页面流程、刷新恢复、Mock 回归、类型检查、单元测试、构建和 E2E。
