# ManJu-AI 接口契约状态矩阵

> 用途：记录当前前端代码中已经存在的 HTTP 适配、尚未确认的后端契约和后续接入动作。  
> 重要说明：表中的接口路径大多是前端当前预留或已按现有后端草案适配的路径，不代表后端已经全部实现或完成联调。

## 1. 状态定义

| 状态 | 含义 |
|---|---|
| `mock-ready` | Mock 模式可用于前端演示和回归 |
| `http-reserved` | 已有 HTTP Adapter 或接口入口，但后端尚未验证 |
| `http-partial` | 部分接口或字段已有适配，完整业务链路未闭环 |
| `readonly` | HTTP 模式只支持读取 |
| `blocked` | 缺少后端契约或前端基础抽象，暂不能接入 |
| `verified` | 已在真实联调环境完成请求、响应、异常和页面流程验证 |
| `deferred` | 当前版本明确暂缓 |

任何模块只有在真实环境完成契约、错误、刷新恢复和页面验收后，才能标记为 `verified`。

## 2. 模块矩阵

| 模块 | 当前状态 | 当前前端基础 | 主要风险或缺口 | 后端到位前的前端动作 | 接口到位后的主要修改点 |
|---|---|---|---|---|---|
| Auth | `http-partial` | 账号密码登录 HTTP Adapter、统一 Session Repository、统一存储键和错误枚举已存在；Mock/HTTP 登录使用相同 Store 结算 | Refresh Token、Cookie、并发刷新锁、后端退出和正式会话生命周期尚未冻结 | 已移除明文密码存储并补会话保存、恢复、退出测试；继续等待正式认证契约 | 更新 `auth.http.ts`、登录 DTO、错误映射和刷新策略 |
| Project | `http-reserved` | 列表、详情、新建、更新、删除、导入、导出入口存在；导入导出由能力注册表保护 | 导入导出数据语义未冻结；真实分页和文件行为未验证 | 保持 HTTP 导入导出默认关闭；冻结前端 Project Contract 和 Fixture | 调整 `project.http.ts`、DTO、分页 Mapper，并在验证后启用能力 |
| Editor Draft | `http-partial` | 可读取 Script/Storyboard Workspace；可保存部分文案字段 | 设定、分镜审核、视频、配音和隐藏状态缺少统一保存责任 | 定义六个草稿分区；建立 Persistence Service、revision 和恢复测试 | 新增或替换各 Workspace Adapter |
| Generation Task | `blocked` | 任务类型、状态、Mock 任务和结果 Guard 已存在；取消和重试入口已受能力保护 | HTTP `create/update` 不可用；业务生成端点与通用任务端点并行；缺少恢复和有限并发 | 建立 GenerationTaskGateway 和状态机；先迁移 Mock；定义轻量结果和 Workspace 刷新 | 实现任务创建、查询、取消、重试、轮询或订阅 Adapter |
| Script Generation | `http-partial` | 文案生成 Workflow 已有业务 HTTP 入口 | 与统一 Generation Task 策略尚未完全一致；结果和草稿落库规则未冻结 | 统一通过任务网关调用；明确生成成功后的 Script Workspace 刷新 | 接入生成任务 payload/result Mapper |
| Setting Asset | `http-partial` | 设定资产列表、创建、更新、候选图和生成入口已预留 | `/settings` 与 `/aidrama/assets` 两类路径语义可能重叠；上传仍可能传 Data URL；结果要求完整 asset | 建立上传抽象和轻量结果；明确资产 Workspace 所有权 | 更新 `setting.http.ts` 或统一到 Asset Workspace Adapter |
| Storyboard | `http-partial` | 默认值、Workspace、参考图、上传、生成和放大入口存在 | 直接生成端点与任务 API 重叠；状态枚举兼容较多；完整 shot 结果耦合 | 统一任务网关；定义 Workspace Mapper；清理 legacy 直接生成职责 | 接入分镜 CRUD、任务和 Workspace 刷新 |
| Video | `http-partial` | 单镜头生成业务入口和页面状态已存在 | 当前主要是提交后立即解析；缺少真正异步任务恢复；视频资源落库未冻结 | 迁移统一任务网关；补 pending/running/timeout/retry 状态 | 接入任务、媒体资源和 Storyboard Workspace 更新 |
| Dubbing | `http-partial` | 配音生成入口、配音卡片和结果页面存在 | 结果主要读取 `resultUrl`；音频落库、角色台词版本和批量状态未冻结 | 建立任务网关和 Dubbing Workspace 分区；定义音频结果契约 | 接入任务、音频资源和卡片落库 |
| Voice | `http-reserved` | `/voices` CRUD Adapter 已存在；写操作已接入统一能力状态 | 字段、分页、上传音频和试听 URL 生命周期未验证 | 保持 HTTP 写能力默认关闭；建立 Voice DTO Fixture | 更新 `voice.http.ts`、DTO、Mapper 和上传 Adapter |
| Resource Library | `readonly` | 列表读取已有 HTTP Adapter；新增、编辑、删除由能力注册表提前阻断 | HTTP 层仍引用 Mock 文件夹数据；真实写接口不存在 | 移除 HTTP 对 Mock 的依赖；定义文件夹来源 | 补资源库 CRUD 和项目复用接口，通过后再启用 `resource.write` |
| Project Asset | `http-reserved` | 项目级资产持久化入口存在 | 与 Setting、Resource Library 的领域边界未冻结 | 明确“项目资产”“公共资源库”“设定资产”三者所有权 | 按最终领域边界调整 Asset Adapter |
| System | `http-reserved` | 样式、权限、消息等模块入口存在；写操作已接入统一能力状态 | 当前优先级低；权限模型和系统配置所有权未确定 | 保持能力状态为未验证，不影响主流程 | 接入系统 DTO、权限和消息接口 |
| Script Template | `http-reserved` | CRUD 入口存在 | 模板属于系统共享还是项目私有尚未冻结 | 冻结模板所有权和作用域 | 更新模板 Adapter 和作用域参数 |
| Media Upload | `blocked` | 页面可选择文件，部分 Mock 以 Data URL 传递 | 缺少统一上传接口、文件限制、对象存储 ID 和 URL 生命周期 | 建立 MediaUploadService；Mock 使用 Blob/IndexedDB；禁止长期 Base64 草稿 | 接入 multipart、直传或预签名上传 Adapter |
| Export | `http-partial` | JSON 草稿和配音结果导出可用；后端导出任务由能力注册表保护 | 媒体打包和剪映工程语义未冻结；导出任务尚未真实验证 | 保持 `export.task`、`export.jianying` 默认关闭 | 接入异步导出任务、下载和剪映工程能力，验证后显式启用 |
| Registration / Code Login / Third-party Login | `deferred` | 页面和 Mock 逻辑保留，但入口统一由能力注册表隐藏 | HTTP Adapter 当前明确 unsupported；不属于当前主验收 | 保持 `auth.codeLogin/auth.register/auth.resetPassword/auth.thirdPartyLogin` 默认关闭 | 产品和后端确认后单独立项并显式启用 |
| Team / Points / Billing | `deferred` | 可能存在页面或占位 | 业务规则、权限、计费和后端均未确认 | 保持占位或隐藏，不纳入主流程 | 独立需求和接口设计后接入 |

## 3. 当前可确认的运行约定

以下内容属于当前前端实现约定，不代表后端最终契约已经冻结：

- API 模式和基础地址由 `src/config/runtimeConfig.ts` 统一读取；
- 本地开发可以默认 Mock，测试显式使用 Mock 且启用严格校验，生产自动启用严格校验；
- HTTP 客户端默认基础路径为 `/admin-api`；
- AI 漫剧业务路径优先使用 `/aidrama/...`；
- 共享拦截器优先兼容 `{ code, msg, data }`；
- 存在 Token 时发送 `Authorization: Bearer <token>`；
- 401 清理统一 Session Repository，403 标记无权限；
- 页面和 Store 不应直接调用 Axios；
- DTO 差异应在 `*.http.ts`、`*.types.ts` 和 `*.mapper.ts` 中处理；
- 未验证 HTTP 能力默认关闭，验证后通过 `VITE_ENABLED_CAPABILITIES` 显式启用。

## 4. 尚未冻结的关键决策

接口开发或联调前必须确认：

1. 认证使用 Bearer Token、Refresh Token 还是 HttpOnly Cookie；
2. 是否有统一任务中心，还是各业务端点内部返回任务；
3. 任务状态使用轮询、SSE 还是 WebSocket；
4. 任务创建是否支持幂等键；
5. 编辑器草稿使用聚合保存还是 Workspace 分区保存；
6. 草稿并发编辑和版本冲突如何处理；
7. 生成结果返回完整实体还是轻量资源结果；
8. 图片、视频和音频使用永久 URL、资源 ID 还是临时签名 URL；
9. 资源库、项目资产和设定资产的领域边界；
10. 导入导出是否为同步文件接口或异步任务；
11. 分页结构、时间格式、时区、ID 类型和空值规则；
12. 错误码是否跨模块统一。

未确认以上决策时，前端只能保留 Adapter 和测试 Fixture，不应把猜测写入页面领域模型。

## 5. 契约确认记录模板

每个模块完成联调前，在 PR 或接口记录中填写：

```text
模块：
状态：前端预留 / 后端已提供 / 联调中 / 已验证
接口版本或 Swagger 导出日期：
环境：
完整路径与 Method：
请求 DTO：
响应 DTO：
错误码：
ID 类型：
枚举：
时间与时区：
分页：
上传和资源 URL：
幂等与重试：
前端 Mapper：
契约测试：
未确认项：
```

## 6. 状态更新规则

- 新增 HTTP 文件，只能把状态更新为 `http-reserved`；
- 部分接口可调用，但完整流程或恢复未完成，标记为 `http-partial`；
- 只支持 GET，标记为 `readonly`；
- 缺少任务、保存或上传基础抽象，标记为 `blocked`；
- 完成真实环境成功、失败、空值、刷新恢复和权限场景验证后，才能标记为 `verified`；
- 能力只有在接口实现、契约测试和真实联调完成后才能加入 `VITE_ENABLED_CAPABILITIES`；
- 每次状态变化必须同步更新测试和本文档。

具体修复顺序参见 `docs/frontend-backend-readiness-plan.md`，接口接入步骤参见 `docs/frontend-backend-integration-guide.md`。
