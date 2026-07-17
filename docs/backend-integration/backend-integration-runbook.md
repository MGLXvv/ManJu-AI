# 后端接口接入执行手册

> 本文是后续恢复后端接口接入时的主执行入口，面向前端、后端、测试和发布人员。它覆盖证据收集、环境配置、契约固化、Adapter 实现、自动化测试、真实联调、能力门禁、灰度、监控与回滚。
>
> 接口实时状态仍以 [接口矩阵](./endpoint-matrix.md)、[已实现接口登记](./implemented-interface-register.md) 和 [验证记录](./verification-log.md) 为准。本文负责说明“如何接入”，不替代状态台账。

## 1. 目标与适用范围

本文用于：

- 将已有 Mock 页面切换到真实 HTTP；
- 接入后端新增的读写接口；
- 处理后端 DTO、错误码、鉴权或分页规则变更；
- 恢复 Storyboard、Asset、Generation、Upload、Export 等暂缓能力；
- 排查 HTTP 模式仍出现 Mock 数据、写入成功后刷新丢失等问题；
- 在上线前完成证据、测试、门禁、灰度和回滚检查。

最终目标不是“请求返回 200”，而是形成一个可验证、可审计、可关闭、可回滚的完整业务能力。

开始前按顺序阅读：

1. [环境与鉴权](./environment.md)；
2. [协议约定](./protocol.md)；
3. [接口矩阵](./endpoint-matrix.md)；
4. [已实现接口登记](./implemented-interface-register.md)；
5. [验证记录](./verification-log.md)；
6. [待确认问题](./open-questions.md)；
7. [前端准备度手册](./frontend-readiness-handbook.md)。

## 2. 现有接入基线

项目已经具备：

- mock 与 http 两种运行模式；
- 统一 Axios 客户端和 30 秒单请求超时；
- Bearer Token、X-Requested-With 和 CommonResult 解包；
- 401 会话过期、403 权限拒绝处理；
- 按模块拆分的 api / http / mock / types / mapper 边界；
- 能力注册表和环境变量门禁；
- 编辑器分区持久化；
- 生成任务轮询、取消、超时、恢复和批量并发控制；
- Auth 会话、Project CRUD 的真实验证脚本；
- Contract、单元、组件、Mock E2E、静态检查和生产构建验证。

当前已验证范围包括 Auth/Profile、Project 基础 CRUD、Script Workspace 读取和 Script Draft 写后读。Storyboard 写入、Project Asset 单实体写入、媒体上传、真实 AI 和 Export 等能力仍须以最新矩阵为准。

## 3. 不可绕过的原则

### 3.1 证据优先

契约可信度从高到低为：

1. OpenAPI/Swagger、后端 DTO 或 Controller 源码；
2. 同一环境的脱敏成功、失败和边界响应；
3. Integration Pack、后端变更说明；
4. 已完成真实验证的前端 HTTP Adapter；
5. 前端 Fixture 和 Mock。

页面字段和 Mock 字段不能自动成为后端契约。低优先级材料不能覆盖高优先级证据。

### 3.2 HTTP 模式不静默回退

当 VITE_API_MODE=http 时，请求失败必须明确失败。不得自动切回 Mock、用本地结果伪装写入、吞掉契约错误，或在能力不可用时仍展示可操作入口。

### 3.3 DTO 不进入页面层

后端差异只允许停留在：

- *.types.ts：请求、响应 DTO；
- *.mapper.ts：DTO 与领域模型转换；
- *.http.ts：Method、Path、Query、Body 和协议适配；
- *.api.ts：HTTP/Mock 模式选择。

页面、组件、Store 和业务服务只依赖领域 Contract，不直接依赖 Axios、后端 DTO 或 Mock 文件。

### 3.4 写接口必须证明副作用

HTTP 200 或 code=0 只说明请求被受理，不等于数据已落库。Create、Update、Delete、Publish、Upload 必须通过写后按 ID 读取、列表复查、任务终态、产物访问或等价服务端证据确认副作用。

## 4. 角色与交付物

| 角色      | 责任               | 必须交付                                                            |
| --------- | ------------------ | ------------------------------------------------------------------- |
| 后端      | 固化接口和业务语义 | OpenAPI/DTO、成功与失败响应、错误码、权限、幂等、分页/上传/任务说明 |
| 前端      | 建立边界并完成门禁 | Contract、DTO、Mapper、Adapter、Fixture、测试、接入记录             |
| 测试      | 覆盖主流程与异常   | 用例、真实环境结论、缺陷记录                                        |
| 发布/运维 | 管理环境与风险     | 配置、代理、监控、灰度、回滚                                        |
| 产品/业务 | 确认能力语义       | 验收标准、不可用/只读体验                                           |

同一人可承担多个角色，但交付物不能省略。

## 5. 端到端标准流程

每个接口或能力按以下顺序推进：

1. 建立接入工单，明确页面、能力键和负责人；
2. 收集契约、账号、环境和真实响应；
3. 更新接口矩阵，标记 ready、parked 或 unsupported；
4. 定义领域 Contract；
5. 定义请求/响应 DTO；
6. 实现 Mapper；
7. 实现 HTTP Adapter；
8. 接入 HTTP/Mock 模式选择；
9. 增加成功、失败、空态和边界 Fixture；
10. 编写 Mapper、Contract、Adapter、Service、组件测试；
11. 执行真实环境验证；
12. 对写操作执行写后读；
13. 更新验证记录和接口登记；
14. 开启测试环境能力门禁；
15. 完成页面验收；
16. 运行质量检查与生产构建；
17. 灰度发布并观察指标；
18. 满足稳定条件后扩大范围；
19. 保留独立关闭和回滚路径。

发现证据不足时必须回到第 2 步，不得在 Mapper 中堆叠猜测性兼容。

## 6. 接入工单模板

```markdown
## 接口接入：<模块/能力>

- 前端负责人：
- 后端负责人：
- 测试负责人：
- 目标环境：
- 后端版本：
- 目标页面：
- 能力键：
- 当前状态：planned | ready | parked | enabled
- OpenAPI/DTO：
- 成功响应证据：
- 失败响应证据：
- 鉴权与权限：
- 分页/排序：
- 幂等规则：
- 写后读方式：
- 兼容范围：
- 灰度范围：
- 回滚条件：
- 关联文档：
```

密码、Token、上传签名和私有密钥不得写入工单或仓库。

## 7. 阶段一：收集后端证据

### 7.1 每个接口的最小信息

- HTTP Method 与完整 Path；
- Path、Query、Header、Body 参数；
- 必填、可空、默认值、枚举、长度和精度；
- Content-Type；
- 成功 HTTP 状态和业务码；
- 400、401、403、404、409、422、429、500 中适用的错误样本；
- ID 类型、时间格式和时区；
- 角色、租户和资源级权限；
- 分页起始值、页大小、排序和过滤；
- 写入幂等、重复提交和并发冲突；
- 接口版本、兼容期和废弃计划。

异步任务还需状态机、轮询、取消、超时、产物和恢复规则；上传还需大小、MIME、分片/直传和清理规则。

### 7.2 必须保存的脱敏样本

至少收集：

- 正常成功和空数据成功；
- 业务校验失败；
- 无 Token、Token 过期和无权限；
- 列表首页、末页或空页；
- 写后读结果；
- 异步任务 queued、running、success、failed；
- 上传或导出产物元数据。

Fixture 必须删除 Token、账号、邮箱、手机号、真实用户内容、私有地址和可识别 ID，但保留字段形态与错误语义。

### 7.3 证据不足时

- 只有 Path，没有响应：parked；
- 只有成功响应：可开发 Adapter，不开启写能力；
- 只有 Mock：mock-only；
- 固定拒绝或语义不匹配：unsupported 或 controlled-reject；
- 后端宣称完成但无法复现：记录“后端 READY、前端未验证”。

## 8. 阶段二：环境、代理和鉴权

### 8.1 前端环境变量

从已提交的 .env.example 复制个人配置：

| 变量                       | 含义          | 推荐值/说明                 |
| -------------------------- | ------------- | --------------------------- |
| VITE_API_MODE              | 数据模式      | mock 或 http                |
| VITE_API_BASE_URL          | API 前缀      | 通常为 /admin-api           |
| VITE_STRICT_RUNTIME_CONFIG | 严格校验      | 联调与生产建议 true         |
| VITE_ENABLED_CAPABILITIES  | 请求开启能力  | 逗号分隔                    |
| VITE_DISABLED_CAPABILITIES | 强制关闭能力  | 逗号分隔                    |
| VITE_DEV_PROXY_TARGET      | 本地代理目标  | http://&lt;backend-host&gt; |
| VITE_DEV_ALLOWED_HOSTS     | Vite 允许主机 | 逗号分隔                    |

推荐本地配置：

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=/admin-api
VITE_STRICT_RUNTIME_CONFIG=true
VITE_DEV_PROXY_TARGET=http://<backend-host>
VITE_ENABLED_CAPABILITIES=
VITE_DISABLED_CAPABILITIES=
```

不要把账号、密码或 Token 写入 VITE_*；这些变量会进入浏览器构建产物。

### 8.2 代理检查顺序

1. 浏览器最终 URL 是否正确；
2. /admin-api 是否重复或缺失；
3. Vite 代理是否指向正确环境；
4. 网关是否重写 Path；
5. OPTIONS 预检是否成功；
6. Authorization 是否被保留；
7. Host、Origin、HTTPS 是否符合要求；
8. 上传体积是否被代理限制。

生产优先使用同域相对 API 前缀，避免把内部地址编译进前端。

### 8.3 鉴权边界

统一客户端负责 Bearer Token、X-Requested-With、401 和 403。模块不得自行拼接 Authorization：

- 401：清理失效会话并引导登录；
- 403：保留登录态，显示权限不足；
- Token 不进入 URL、普通日志或错误上报；
- 如有 Refresh Token，需明确轮换、并发刷新、失效和重放保护。

## 9. 阶段三：协议与错误模型

先核对 [协议约定](./protocol.md)。典型 CommonResult 仅作示意：

```json
{
  "code": 0,
  "data": {},
  "msg": ""
}
```

必须确认成功业务码、data=null 语义、错误文案字段、非 2xx 响应形态、分页结构，以及 HTTP 200 内的业务失败。统一客户端已负责解包，模块不得重复解包。

| 错误         | 页面策略                       |
| ------------ | ------------------------------ |
| 网络不可达   | 明确网络错误，允许重试         |
| 超时         | 提示超时，不断言服务端无副作用 |
| 401          | 清理无效会话并重新登录         |
| 403          | 保留上下文，显示权限不足       |
| 404          | 提示资源不存在或已删除         |
| 409          | 刷新并处理冲突/重复提交        |
| 400/422      | 映射字段错误或业务文案         |
| 429          | 退避并遵守 Retry-After         |
| 5xx          | 显示追踪信息，安全重试         |
| 契约解析失败 | 上报并停止，不用默认值掩盖     |

## 10. 阶段四：实现模块边界

推荐结构：

```text
src/api/<module>/
├── <module>.api.ts
├── <module>.http.ts
├── <module>.mock.ts
├── <module>.types.ts
├── <module>.mapper.ts
├── <module>.fixtures.ts
└── __tests__/
```

新模块可执行：

```powershell
pnpm scaffold:http-module <module-name>
```

脚手架只生成骨架，所有路径和类型必须用真实证据替换，详见 [脚手架说明](./scaffold-http-module.md)。

### 10.1 Contract

Contract 描述页面需要的稳定语义：

```ts
export interface ProjectGateway {
  list(input: ProjectListInput): Promise<ProjectPage>
  get(id: string): Promise<ProjectDetail>
  create(input: CreateProjectInput): Promise<ProjectDetail>
  update(id: string, input: UpdateProjectInput): Promise<ProjectDetail>
  remove(id: string): Promise<void>
}
```

领域模型不要使用 project_id、update_time 等传输层命名。

### 10.2 DTO 与 Mapper

DTO 忠实描述真实响应。Mapper 负责统一 ID、处理可空字段、映射枚举、保持时区、校验必要字段，并完成请求映射。只有真实证据证明多个版本共存时才写兼容分支；每个分支必须有测试、来源和移除条件，禁止用 any 代替未确认契约。

### 10.3 HTTP Adapter

Adapter 只负责 Method/Path、参数编码、统一客户端调用、DTO 映射、AbortSignal 和分页适配。Path 参数必须安全编码。页面卸载、搜索切换和任务取消应向下传递 AbortSignal。

### 10.4 模式选择

- mock 只使用 Mock；
- http 只使用 HTTP Adapter；
- 未实现能力抛出明确 Unsupported/Capability 错误；
- HTTP 失败不得调用 Mock；
- 严格模式下，非法运行配置应尽早失败。

## 11. 阶段五：Fixture 与自动化测试

每个接口至少准备正常成功、空结果、可空字段、边界、业务失败、401、403 和非法枚举/契约缺失。写接口补冲突、重复提交、服务端拒绝；异步任务补排队、执行、成功、失败、取消和未知状态。

测试层级：

1. Mapper 单元测试；
2. HTTP/Mock 共享 Contract 测试；
3. Adapter Method、Path、Query、Body、错误测试；
4. Service/Store 加载、保存、取消、重试、并发测试；
5. 组件加载、空态、错误、只读、权限测试；
6. Mock E2E；
7. 真实环境冒烟；
8. 生产构建验证。

推荐执行：

```powershell
pnpm check:http-mock-boundary
pnpm check:integration-consistency
pnpm test:contracts
pnpm test
pnpm test:e2e:mock
pnpm check:static
pnpm check:quality
pnpm build:verify
```

实际脚本以 package.json 为准。

## 12. 阶段六：真实环境验证

### 12.1 安全准备

- 使用专用测试账号和项目；
- 明确允许创建、修改和删除测试数据；
- 凭据只放当前进程环境或受控秘密系统；
- 写操作必须有显式开关；
- 日志、截图、Fixture 全部脱敏；
- 临时数据使用唯一前缀并确保清理。

### 12.2 Auth 会话

脚本读取 MANJU_API_BASE_URL、MANJU_USERNAME、MANJU_PASSWORD 和 MANJU_REQUEST_TIMEOUT_MS：

```powershell
pnpm integration:auth-session
```

至少验证登录、获取当前用户、刷新恢复、无 Token、无效 Token 401、权限不足 403、会话清理和日志脱敏。

### 12.3 Project CRUD

写验证必须显式授权：

```powershell
$env:MANJU_ALLOW_WRITE = 'true'
pnpm integration:project-crud
```

验证链：

1. 读取列表基线；
2. 创建唯一命名的临时项目；
3. 按返回 ID 读取；
4. 更新；
5. 再读确认落库；
6. 删除；
7. 再读或查列表确认消失；
8. 异常时清理；
9. 保存脱敏结果。

禁止对共享业务项目执行。

### 12.4 验证记录

每次联调更新 [验证记录](./verification-log.md)，写明日期、环境别名、后端版本、前端 Commit、验证人、Method/Path、HTTP 状态、业务码、副作用确认方式、结论、脱敏证据、限制和后续动作。失败也要记录；口头“已通过”不能作为开门依据。

## 13. 阶段七：能力门禁

典型状态：

- available：真实验证完成；
- readonly：只开放读取；
- mock-only：只用于 Mock 演示；
- unsupported：后端不支持或语义不匹配；
- parked：证据不足。

### 13.1 开启条件

必须全部满足：

- 矩阵标记前端已接入；
- Contract、DTO、Mapper、Adapter 已评审；
- Fixture 和测试齐全；
- 真实环境验证通过；
- 写接口有副作用证据；
- 权限和错误态验收完成；
- 监控、灰度和回滚就绪；
- 注册表允许环境变量覆盖。

若 allowEnableOverride=false，不得通过 VITE_ENABLED_CAPABILITIES 强开。

### 13.2 开启步骤

1. 更新能力注册表状态和原因；
2. 补能力状态测试；
3. 测试环境通过 enabled 变量小范围开启；
4. 验证 disabled 变量可熔断；
5. 检查导航、按钮、快捷键和深链接；
6. 区分无权限与能力关闭；
7. 灰度稳定后调整默认值。

关闭时阻止新操作、保留未保存草稿、允许安全只读降级，且不得显示虚假成功。

## 14. 推荐模块顺序

1. Health 与运行配置；
2. Auth/Profile；
3. Project CRUD；
4. Script Workspace/Draft；
5. Setting 等编辑器读取；
6. Storyboard 读取；
7. Storyboard 写入；
8. Project Asset/Resource；
9. Voices/Script Templates；
10. Generation Tasks；
11. Media Upload；
12. Export。

依赖未稳定时不开放后续写能力。

## 15. 业务模块专项清单

### 15.1 Auth/Profile

- 登录字段、验证码/MFA 已确认；
- Token 类型、有效期、刷新策略已确认；
- Profile 经过 Mapper；
- 刷新可恢复会话；
- 401 与 403 行为不同；
- 退出接口和本地清理顺序明确；
- Token 不进入 URL 和日志；
- 登录失败不泄露账号存在性；
- 真实会话脚本通过；
- 页面覆盖加载、失败、过期、无权限。

### 15.2 Project CRUD

- 分页起始值、过滤、排序、总数明确；
- ID 类型统一；
- 创建默认值明确；
- PUT 全量或 PATCH 增量明确；
- 乐观锁/版本字段明确；
- 软删/硬删明确；
- 409 与重复名称语义明确；
- 删除依赖明确；
- 写后读通过；
- 临时数据可清理；
- 写后列表缓存失效。

### 15.3 编辑器持久化

script、setting、storyboard、video、dubbing、projectMeta 各分区独立确认读取、保存、空文档、版本、自动保存节流、并发冲突、本地草稿、写后读和清理。

页面至少区分未修改、有修改、保存中、已保存、失败、冲突、只读、能力关闭。保存失败不得清除 dirty 状态；旧响应不得覆盖新内容。

Script Workspace/Draft 需明确二者关系、发布/覆盖/回滚、空 Draft、版本和写后读。Storyboard 写入在解除暂缓前还需完整 CRUD DTO、镜头排序、批量/单条语义、媒体引用、冲突错误、完整写后读和撤销/重做边界。

## 16. Generation Tasks

至少需要创建请求、任务 ID、状态查询、状态枚举与迁移、进度、产物、失败原因、取消、幂等、刷新恢复、过期和保留策略。

未知状态不得映射为成功或无限轮询，应记录脱敏原始状态并进入可恢复错误态。

检查：

- 轮询间隔符合限流；
- 遵守 Retry-After；
- 单请求超时不等于任务总超时；
- 页面卸载停止本地轮询；
- 停止轮询与取消服务端任务语义不同；
- 终态后清除定时器；
- 401、403、404、429、5xx 使用不同策略；
- 批量并发不超过后端限制；
- AbortSignal 传到底层。

刷新后恢复 queued/running 任务；完成任务读取产物；不存在的任务清理陈旧引用。重试按钮需区分“重新查询”和“创建新任务”。

## 17. Media Upload

Blob/Data URL 只用于当前页面预览，不能作为跨会话持久化 ID。接入后应保存稳定 mediaId。

契约必须包含单/批量/分片、multipart 字段、大小/MIME、进度、取消、重试、哈希/秒传、直传签名、mediaId、URL、缩略图、扫描/转码状态、删除和租户权限。

推荐流程：

1. 客户端预校验；
2. 获取凭证或提交 multipart；
3. 展示真实进度；
4. 获得 mediaId；
5. 将 mediaId 写入业务实体；
6. 写后读确认；
7. 刷新后通过 mediaId 恢复；
8. URL 过期时换取新地址；
9. 清理上传成功但业务保存失败的孤儿资源。

服务端仍需验证 MIME、大小和权限；文件名不得直接作为路径；签名不得进入日志。

## 18. Export

后端未提供可验证能力前保持关闭。接入需明确参数/格式、同步或异步、进度、失败、取消、产物 ID、下载地址有效期、幂等/计费、大文件重试、鉴权和清理。

验收必须实际下载并确认文件非空、可打开、音画字幕与时长正确、文件名正确、URL 过期行为明确，且无法跨用户访问。

## 19. 页面验收清单

每个真实接口页面至少覆盖：

- 首次加载、骨架、有数据、空数据；
- 网络错误、超时、401、403、404、409/422、5xx；
- 重试、快速重复点击；
- 切页取消请求；
- 刷新恢复；
- 只读和能力关闭；
- 深链接与导航门禁；
- 无 Mock 数据泄漏；
- 无敏感日志；
- 成功提示只在副作用确认后出现。

写页面额外覆盖未保存离开、提交防重、失败保留输入、冲突、写后读、删除确认，以及“后端成功但刷新失败”的中间状态。

## 20. CI 与合并门槛

完整接入推荐执行：

```powershell
pnpm format:check
pnpm check:http-mock-boundary
pnpm check:integration-consistency
pnpm test:contracts
pnpm test
pnpm test:e2e:mock
pnpm check:static
pnpm check:quality
pnpm build:verify
```

合并说明必须包含契约证据、能力范围、测试、真实验证、页面证据、环境变量、门禁变化、风险、灰度、回滚和未完成项。真实环境暂不可用时，可以合并默认关闭的 Adapter，但不能标记已接入或默认开启。

## 21. 灰度、监控与回滚

### 21.1 灰度顺序

开发账号 → 测试环境 → 预发布回归 → 生产内部账号 → 小比例租户 → 扩大灰度 → 全量。

### 21.2 观察指标

- 成功率和错误码；
- P50/P95/P99 延迟；
- 401/403/429/5xx；
- 契约解析错误；
- 写后读不一致；
- 重复提交；
- 任务卡住和超时；
- 上传、生成、导出成功率；
- 用户重试和产物访问失败。

### 21.3 回滚

数据错误/丢失/越权、大面积鉴权异常、持续 5xx/超时、重复任务或计费、安全风险、写后读失败应触发关闭或回滚：

1. 用 VITE_DISABLED_CAPABILITIES 或服务端开关阻止新操作；
2. 安全时降级为只读；
3. 隔离风险写入；
4. 记录版本、用户和时间窗；
5. 处理进行中任务；
6. 选择前端、后端回滚或兼容；
7. 修复异常数据；
8. 回归和写后读；
9. 小范围重开；
10. 更新验证记录和复盘。

禁止回退到 Mock 掩盖生产故障。

## 22. 常见故障速查

| 现象              | 优先检查                    | 处理                             |
| ----------------- | --------------------------- | -------------------------------- |
| 404               | Base URL、代理、Path        | 对照 Network 最终 URL 与 OpenAPI |
| CORS              | OPTIONS、Origin、Header     | 修复网关/后端 CORS               |
| 一直 401          | Token 前缀、过期、时钟      | 核对 Bearer 和会话来源           |
| 登录后退出        | Profile、Token 字段、拦截器 | 对照真实响应与 Auth Mapper       |
| 200 但页面错      | CommonResult、Mapper        | 保存脱敏响应并补测试             |
| 列表空            | 分页、租户、过滤            | 核对 Query 和权限                |
| 保存刷新丢失      | 未落库、错误 ID、缓存       | 写后读并检查缓存失效             |
| 重复创建          | 双击、重试、无幂等          | UI 防重并补服务端幂等            |
| 任务一直 running  | 状态映射、后端卡住          | 查原始状态、日志和超时           |
| 任务 429          | 轮询和并发                  | 退避并遵守 Retry-After           |
| 上传后丢图        | 只存 Blob/临时 URL          | 保存 mediaId                     |
| HTTP 出现演示数据 | Mock 回退或错误导入         | 运行边界检查                     |
| 能力变量无效      | 注册表禁止覆盖              | 补证据，不能强开                 |
| 生产才失败        | API 路径、代理、CSP         | 预发布使用生产等价配置           |

## 23. 完成定义

接口只有全部满足才可标记“前端已接入”：

- [ ] Method、Path、参数、响应有高可信证据；
- [ ] 鉴权、权限、错误语义明确；
- [ ] 矩阵已更新；
- [ ] Contract、DTO、Mapper、Adapter 完成；
- [ ] HTTP 无静默 Mock 回退；
- [ ] Fixture 覆盖成功、失败、空态和边界；
- [ ] Mapper、Contract、Adapter、业务测试通过；
- [ ] 页面状态已验收；
- [ ] 真实环境验证通过；
- [ ] 写接口完成副作用验证；
- [ ] 敏感信息已脱敏；
- [ ] 验证记录和接口登记已更新；
- [ ] 能力门禁正确；
- [ ] 构建和质量检查通过；
- [ ] 灰度、监控和回滚可执行。

异步任务、上传和导出还必须验证取消、超时、重试、恢复、幂等、产物访问和清理。

## 24. 接入结果模板

```markdown
## <能力> 接入结果

- 前端 Commit：
- 后端版本：
- 环境别名：
- 接口：
- 能力键：
- 默认状态：
- Contract/DTO/Mapper：
- Fixture：
- 自动化测试：
- 真实验证：
- 写后读证据：
- 页面验收：
- 监控项：
- 灰度范围：
- 回滚方式：
- 已知限制：
- 后续事项：
```

## 25. 最终开门判断

开启真实能力前逐项回答：

1. 是否掌握真实契约，而不是从 UI/Mock 猜测？
2. 是否验证失败、权限和边界，而不只验证成功？
3. 写接口是否证明真实副作用？
4. HTTP 故障是否会被隐藏或回退到 Mock？
5. 页面是否正确表达加载、失败、只读和能力关闭？
6. 能力是否可以独立关闭？
7. 是否知道观察哪些指标、影响哪些用户、如何回滚？

任一答案为“否”，就保持关闭或只读，补齐证据后再进入下一阶段。
