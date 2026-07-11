# ManJu-AI 后端接口接入检查清单

> 本清单同时用于两个阶段：  
> 1. 后端未完成时，检查前端是否已经做好接入准备；  
> 2. 后端接口到位后，检查每个模块是否完成真实联调。  
>
> 接口当前状态以 `docs/api-contract-status-matrix.md` 为准，修复顺序以 `docs/frontend-backend-readiness-plan.md` 为准。

## 1. 当前阶段边界

- [ ] 不把“存在 `*.http.ts`”视为接口已经接通
- [ ] 不把 Mock 可演示视为真实业务能力已完成
- [ ] 不猜测尚未确认的后端字段、枚举、分页和错误码
- [ ] 页面、组件和 Store 不新增 Axios、`http` 或后端 DTO 依赖
- [ ] 后端差异只进入 HTTP Adapter、DTO、Mapper 和契约测试
- [ ] 未实现能力明确标记为 `mock-only`、`readonly`、`unsupported` 或 `deferred`
- [ ] 真实接口接入前先确认接口版本或 Swagger/OpenAPI 导出版本

## 2. 运行配置

当前前端约定：

- `VITE_API_MODE=mock`：使用 Mock Adapter
- `VITE_API_MODE=http`：使用 HTTP Adapter
- `VITE_API_BASE_URL`：控制后端基础地址
- 未设置基础地址时，当前默认请求 `/admin-api`
- 业务路径不能重复写 `/admin-api`

检查项：

- [ ] `.env.example` 已记录 Mock、后端直连和反向代理三种配置
- [ ] `VITE_API_BASE_URL` 不包含 `/aidrama/projects` 等业务资源路径
- [ ] HTTP 模块路径以 `/` 开头
- [ ] 不出现 `/admin-api/admin-api/...`
- [ ] 不出现双斜杠 URL
- [ ] Vite、Nginx 或网关的代理前缀与前端一致
- [ ] 固定服务器地址、临时 Tunnel 域名和环境专属配置未写死在通用源码中
- [ ] 测试和生产构建不会因为变量缺失或拼错而静默进入 Mock
- [ ] 开发环境可以明确看到当前运行模式

## 3. 接口状态确认

每个模块接入前必须先填写：

```text
模块：
当前状态：mock-ready / http-reserved / http-partial / readonly / blocked / verified / deferred
后端接口版本：
联调环境：
负责人：
完整路径与 Method：
未确认项：
```

状态规则：

- [ ] 仅新增 HTTP Adapter 时仍标记为 `http-reserved`
- [ ] 部分接口可用但流程未闭环时标记为 `http-partial`
- [ ] 只支持读取时标记为 `readonly`
- [ ] 缺少任务、保存或上传基础能力时标记为 `blocked`
- [ ] 完成真实成功、失败、权限、空值和刷新恢复测试后才标记为 `verified`

## 4. 统一响应和错误处理

当前共享客户端优先兼容：

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

检查项：

- [ ] 确认后端是否确实使用统一响应包装
- [ ] 如果全局格式不同，优先统一修改拦截器
- [ ] 如果只有单个模块特殊，只在该模块 HTTP Adapter 中适配
- [ ] HTTP Adapter 不重复解包已经由拦截器处理的 `data`
- [ ] 非零业务码转换为统一 `ApiError`
- [ ] 401 区分可刷新 Token 和会话已失效
- [ ] 403 不与 401 混用
- [ ] 422、429、5xx 和网络超时有明确前端语义
- [ ] 页面不依赖后端原始错误文案判断业务分支
- [ ] 错误码、状态码和用户提示有单元测试

## 5. 认证与会话

接入前准备：

- [ ] 不保存明文密码
- [ ] Session 存储通过统一 Repository 或 Adapter 处理
- [ ] Mock 存储键与正式会话存储边界分离
- [ ] 正式 API 入口不从 `auth.mock.ts` 导出通用常量

后端契约确认：

- [ ] 登录接口 Method、路径和 Content-Type 已确认
- [ ] 用户 ID、用户名和权限字段已确认
- [ ] Access Token 有效期已确认
- [ ] Refresh Token 或 HttpOnly Cookie 方案已确认
- [ ] Token 刷新接口和失败语义已确认
- [ ] 并发 401 只触发一次刷新
- [ ] 退出登录是否需要服务端失效 Token 已确认
- [ ] 页面刷新后的会话恢复已验证
- [ ] 登录失效时未保存草稿有明确处理

## 6. 项目接口

前端当前预留资源路径：

```text
GET    /aidrama/projects
GET    /aidrama/projects/:id
POST   /aidrama/projects
PUT    /aidrama/projects/:id
DELETE /aidrama/projects/:id
POST   /aidrama/projects/import
GET    /aidrama/projects/:id/export
```

检查项：

- [ ] 路径与后端文档一致
- [ ] ID 类型统一映射为前端字符串
- [ ] 列表分页结构已确认
- [ ] 项目状态、当前步骤、比例和模式枚举已确认
- [ ] 创建和更新字段通过 Mapper 转换
- [ ] 删除语义是软删除还是物理删除已确认
- [ ] 导入格式、版本和冲突策略已确认
- [ ] 导出是同步下载还是异步任务已确认
- [ ] 项目导入导出不再使用与 CRUD 不一致的资源前缀
- [ ] 路径和 Mapper 有单元测试

## 7. 编辑器草稿与 Workspace

前端必须先完成保存责任矩阵：

- Script
- Setting
- Storyboard
- Video
- Dubbing
- Project Meta

检查项：

- [ ] 每个字段只有一个明确的持久化责任方
- [ ] 加载接口可以恢复全部关键状态
- [ ] 保存接口覆盖审核、隐藏、候选图、音色、视频和配音结果
- [ ] 自动保存、防抖和离开页面保存策略一致
- [ ] 草稿带有 `revision`、版本号或时间戳
- [ ] 保存冲突和过期版本有明确错误
- [ ] 保存失败可以重试
- [ ] 未保存状态对用户可见
- [ ] Store 只调用 Persistence Service，不关心聚合或分区接口
- [ ] Mock 和 HTTP 使用同一前端草稿契约

## 8. AI 生成任务

### 8.1 目标任务接口

推荐统一能力：

```text
POST /generation/tasks
GET  /generation/tasks/:id
GET  /generation/tasks?projectId=...
POST /generation/tasks/:id/cancel
POST /generation/tasks/:id/retry
```

这些路径属于前端目标契约，必须以最终后端接口文档为准。

### 8.2 生命周期

```text
queued -> running -> success | failed | cancelled
```

前端还需要本地派生状态：

```text
timeout / disconnected / restoring
```

检查项：

- [ ] 任务 ID 稳定且可在刷新后查询
- [ ] `projectId` 和任务类型必填
- [ ] `progress` 范围和缺省规则已确认
- [ ] 成功、失败、取消和超时语义已确认
- [ ] 失败返回稳定错误码和可展示信息
- [ ] 创建任务支持客户端 `requestId` 或幂等键
- [ ] 取消和重试的权限、状态限制已确认
- [ ] 任务保留时间已确认
- [ ] 轮询、SSE 或 WebSocket 方案已确认
- [ ] 页面刷新后可恢复未完成任务
- [ ] 批量任务有限并发
- [ ] 单任务失败不终止其他任务
- [ ] 页面和业务 Service 不各自实现轮询

### 8.3 当前过渡结果与目标结果

当前部分前端 Guard 仍要求：

- `setting_asset`：`imageUrl + asset`
- `storyboard`：`imageUrl + shot`
- `storyboard_upscale`：`imageUrl + shot`
- `video`：`videoUrl + shot`
- `dubbing`：`cardId + lines`

这些是当前代码的过渡要求，不建议直接冻结为后端永久契约。

目标结果建议收敛为：

```ts
interface GenerationArtifactResult {
  entityId: string
  taskId: string
  resultUrl?: string
  resourceId?: string
  revision?: number
}
```

检查项：

- [ ] 任务成功后刷新对应 Workspace
- [ ] 完整领域对象由 Workspace Mapper 构造
- [ ] 后端无需了解前端完整 `shot`、`asset`、`card` 结构
- [ ] Mock 完整对象只存在于 Mock 内部
- [ ] 结果 Guard 同时覆盖过渡和目标契约迁移测试

## 9. 文件与媒体上传

接口必须确认：

- [ ] 使用 `multipart/form-data`、预签名直传还是其他方案
- [ ] 字段名和单文件/多文件规则
- [ ] 文件大小、类型和数量限制
- [ ] 上传进度和取消是否需要
- [ ] 返回资源 ID、对象 Key、永久 URL 还是临时 URL
- [ ] 临时 URL 有效期和刷新方式
- [ ] 删除业务实体时是否删除对象存储文件
- [ ] 上传是否需要鉴权和幂等
- [ ] 图片、视频和音频是否使用同一资源模型

前端准备检查：

- [ ] 页面不长期保存 Data URL
- [ ] Mock 大文件不直接写入 localStorage
- [ ] 上传组件依赖 `MediaUploadService`
- [ ] HTTP Adapter 与 Mock Adapter 返回相同资源引用契约
- [ ] 上传失败、超限和格式错误有测试

## 10. 能力状态与未实现功能

页面调用功能前必须读取能力状态：

```text
available / readonly / mock-only / unsupported
```

优先覆盖：

- [ ] 资源库写操作
- [ ] 注册和验证码登录
- [ ] 第三方登录
- [ ] 生成任务取消和重试
- [ ] 项目导入和导出
- [ ] 剪映工程导出
- [ ] 团队、积分和计费

交互要求：

- [ ] `readonly` 不显示编辑入口
- [ ] `unsupported` 提前禁用并说明原因
- [ ] `mock-only` 在 HTTP 模式不执行本地结果
- [ ] `deferred` 不进入当前验收范围

## 11. DTO 与 Mapper

- [ ] 后端 DTO 不直接作为组件 Props 或 Store State
- [ ] 每个复杂模块有明确的 `Backend*DTO`
- [ ] ID、枚举、时间、空值和分页通过 Mapper 处理
- [ ] Mapper 不产生随机数据或隐式 Mock 回退
- [ ] Mapper 对未知枚举有明确降级或错误
- [ ] 请求 DTO 和响应 DTO 分开定义
- [ ] DTO 修改有 Fixture 和测试
- [ ] 后端字段变化不要求修改大量页面

## 12. 测试与 CI

基础门禁：

- [ ] 固定 Node 版本
- [ ] 固定 pnpm 版本
- [ ] 使用锁文件安装
- [ ] TypeScript 类型检查通过
- [ ] 单元测试通过
- [ ] 生产构建通过
- [ ] PR 上有自动 CI 状态

HTTP Adapter 测试：

- [ ] Method 和路径
- [ ] Path、Query、Body 参数
- [ ] DTO Mapper
- [ ] 空列表和空对象
- [ ] 401、403、422、429、5xx
- [ ] 超时和网络失败
- [ ] 导入、导出和上传特殊路径

浏览器主流程：

- [ ] Mock 登录
- [ ] 创建项目
- [ ] 文案生成
- [ ] 设定资产
- [ ] 分镜和人工审核
- [ ] 视频和人工审核
- [ ] 配音
- [ ] 完成页和 JSON 导出
- [ ] 刷新后状态恢复
- [ ] localStorage 清空后的首次启动

## 13. 单模块接入完成定义

一个模块只有同时满足以下条件，才能标记为 `verified`：

- [ ] 接口版本已记录
- [ ] 路径和 Method 与后端一致
- [ ] 请求和响应 DTO 已冻结
- [ ] Mapper 已完成
- [ ] 成功场景通过
- [ ] 空值场景通过
- [ ] 权限和业务错误通过
- [ ] 刷新或重新进入页面后状态正确
- [ ] HTTP 模式没有调用 Mock
- [ ] 单元测试和构建通过
- [ ] 接口状态矩阵已更新
- [ ] PR 描述记录未确认项和验证结果

## 14. 全项目接入准备完成定义

- [ ] 不存在明文密码持久化
- [ ] HTTP 模式不会静默回退 Mock
- [ ] 未实现能力可提前识别
- [ ] 所有生成行为通过统一任务网关
- [ ] 全部编辑器关键状态有明确保存责任
- [ ] 生成结果不要求后端构造前端完整领域对象
- [ ] 上传不长期依赖 Base64 + localStorage
- [ ] HTTP 层不依赖 Mock 文件
- [ ] CI 和 Mock 主流程 E2E 已建立
- [ ] 文档、测试和代码路径保持一致

接口具体接入步骤参见 `docs/frontend-backend-integration-guide.md`。