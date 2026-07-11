# ManJu-AI 生成任务契约

> 状态：前端目标契约与迁移说明。  
> 当前 Mock 任务可以运行，但 HTTP 模式的统一任务创建和完整轮询尚未闭环。本文不代表后端接口已经实现，也不应把当前 Mock 的完整对象结果直接冻结为永久后端协议。

## 1. 目标

生成任务层用于统一处理：

- 文案生成；
- 文案优化；
- 设定图生成；
- 分镜图生成；
- 分镜提示词优化；
- 分镜图放大；
- 视频生成；
- 视频提示词或对白优化；
- 配音生成。

目标是让页面和业务 Store 只依赖统一任务能力，不分别处理图片、视频和配音的轮询、超时、取消和恢复。

## 2. 当前状态

当前前端已经具备：

- 统一任务类型；
- Mock 任务创建和状态推进；
- 任务查询、取消、重试的接口形状；
- 生成结果 Guard；
- 业务 Service 层入口。

当前尚未完成：

- HTTP 模式统一 `create`；
- 真正的异步轮询或订阅；
- 页面刷新后的任务恢复；
- 统一批量并发；
- 任务幂等；
- 轻量结果与 Workspace 刷新；
- 后端契约验证。

因此本文区分：

- **目标契约**：后端和前端最终应对齐的稳定能力；
- **过渡契约**：当前 Mock 和部分前端 Guard 仍在使用的完整对象结果。

## 3. 任务类型

```ts
export type GenerationTaskType =
  | 'script'
  | 'script_optimize'
  | 'setting_asset'
  | 'storyboard'
  | 'storyboard_optimize'
  | 'storyboard_upscale'
  | 'video'
  | 'video_optimize'
  | 'dubbing'
```

新增任务类型必须同时补充：

- Payload 类型；
- 目标结果类型；
- Mock Resolver；
- HTTP Adapter；
- 结果处理器；
- 能力状态；
- 单元测试；
- 接口状态矩阵。

## 4. 任务模型

推荐任务模型：

```ts
interface GenerationTask<TResult = unknown> {
  id: string
  projectId: string
  type: GenerationTaskType
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled'
  progress: number
  entityId?: string
  shotId?: string
  requestId?: string
  payload?: Record<string, unknown>
  result?: TResult
  errorCode?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}
```

字段规则：

- `id`：任务稳定 ID，可用于刷新后恢复；
- `projectId`：必填；
- `type`：必填；
- `status`：后端持久状态；
- `progress`：建议 `0-100`；
- `entityId`：目标素材、镜头或卡片 ID；
- `requestId`：客户端幂等请求 ID；
- `errorCode`：稳定错误码；
- `errorMessage`：可用于日志或用户提示的补充信息；
- `createdAt`、`updatedAt`：ISO 8601，时区需要统一。

前端可以派生以下本地状态，但不要求后端保存：

```ts
type LocalTaskState = 'timeout' | 'disconnected' | 'restoring'
```

## 5. 前端任务网关

前端目标接口：

```ts
interface GenerationTaskGateway {
  create(input: CreateGenerationTaskInput): Promise<GenerationTask>
  getById(taskId: string): Promise<GenerationTask | null>
  listByProject(projectId: string): Promise<GenerationTask[]>
  cancel(taskId: string): Promise<GenerationTask | null>
  retry(taskId: string): Promise<GenerationTask | null>
}
```

约束：

- Mock 和 HTTP 实现同一 Gateway；
- 页面和 Store 不直接操作任务状态；
- 业务 Service 负责创建、等待、结果结算；
- 轮询或订阅逻辑只实现一次；
- HTTP 能力未提供时返回明确 `unsupported`，不能回退 Mock。

## 6. 目标 API 草案

以下路径是前端目标能力，不代表后端已经确认：

### 创建任务

```http
POST /generation/tasks
```

```ts
interface CreateGenerationTaskInput {
  projectId: string
  type: GenerationTaskType
  entityId?: string
  shotId?: string
  requestId: string
  payload: Record<string, unknown>
}
```

### 查询任务

```http
GET /generation/tasks/:id
```

### 查询项目任务

```http
GET /generation/tasks?projectId=...
```

建议支持可选筛选：

```text
status / type / updatedAfter
```

### 取消任务

```http
POST /generation/tasks/:id/cancel
```

### 重试任务

```http
POST /generation/tasks/:id/retry
```

后端也可以将任务接口放入 `/aidrama/tasks`，最终以接口文档为准；前端只需要在 HTTP Adapter 中调整路径。

## 7. Payload 契约

Payload 是前端领域输入，不应携带仅供 Mock 使用的完整 Store 对象。

### `script`

```ts
interface ScriptGeneratePayload {
  sourceText: string
  promptText: string
  modelId: string
}
```

### `script_optimize`

```ts
interface ScriptOptimizePayload {
  scriptText: string
  modelId: string
}
```

### `setting_asset`

```ts
interface SettingAssetGeneratePayload {
  assetId: string
  type: 'character' | 'scene' | 'prop'
  name: string
  description: string
  prompt: string
}
```

### `storyboard`

```ts
interface StoryboardGeneratePayload {
  shotId: string
  title: string
  prompt: string
  style: string
  ratio: '16:9' | '9:16'
  characters: StoryboardTag[]
  scenes: StoryboardTag[]
  props: StoryboardTag[]
  referenceImages: StoryboardReferenceImage[]
}
```

### `storyboard_optimize`

```ts
interface StoryboardOptimizePayload {
  prompt: string
  mode: 'active-shot' | 'insert-shot'
}
```

### `storyboard_upscale`

```ts
interface StoryboardUpscalePayload {
  shotId: string
  imageResourceId?: string
  imageUrl?: string
  prompt: string
  style: string
  ratio: '16:9' | '9:16'
}
```

### `video`

```ts
interface VideoGeneratePayload {
  shotId: string
  imageResourceId?: string
  imageUrl?: string
  videoPrompt: string
  dialogue: string
  durationSeconds: number
  voiceAssignments: StoryboardVoiceAssignment[]
  characters: StoryboardTag[]
  scenes: StoryboardTag[]
  props: StoryboardTag[]
  style: string
  ratio: '16:9' | '9:16'
}
```

### `video_optimize`

```ts
interface VideoOptimizePayload {
  shotId?: string
  mode: 'videoPrompt' | 'dialogue'
  value: string
}
```

### `dubbing`

```ts
interface DubbingGeneratePayload {
  cardId: string
  modelId: string
  selectedVoiceId?: string
  lines: DubbingRoleLineDraft[]
}
```

Mock Resolver 可以在内部临时携带 `shot`、`asset`、`card` 用于本地结算，但这些字段：

- 不进入稳定 ApiContract；
- 不要求后端接收；
- 不允许页面或 Store 依赖；
- 应在 P4 阶段逐步清理。

## 8. 目标结果契约

### 8.1 文本结果

```ts
interface ScriptTextResult {
  text: string
  revision?: number
}
```

适用于：

- `script`
- `script_optimize`

为兼容当前代码，迁移期可以在 Mapper 中把 `script` 字段转换为 `text`。

```ts
interface PromptTextResult {
  value: string
}
```

适用于：

- `storyboard_optimize`
- `video_optimize`

### 8.2 媒体结果

```ts
interface GenerationArtifactResult {
  entityId: string
  taskId: string
  resultUrl?: string
  resourceId?: string
  revision?: number
}
```

适用于：

- `setting_asset`
- `storyboard`
- `storyboard_upscale`
- `video`
- `dubbing`

`dubbing` 如一次生成多条音频，可以返回：

```ts
interface DubbingArtifactResult {
  cardId: string
  taskId: string
  resources: Array<{
    lineId: string
    resourceId?: string
    url?: string
  }>
  revision?: number
}
```

## 9. 当前过渡结果

当前部分前端 Guard 仍要求：

```ts
interface SettingAssetImageResult {
  assetId: string
  imageUrl: string
  asset: SettingAsset
}

interface StoryboardImageResult {
  shotId: string
  imageUrl: string
  shot: StoryboardShot
}

interface VideoGenerateResult {
  shotId: string
  videoUrl: string
  shot: StoryboardShot
}

interface DubbingGenerateResult {
  cardId: string
  lines: DubbingRoleLineDraft[]
  lineIds: string[]
}
```

这些结构只用于当前迁移期。后端不应因为前端当前 Guard 而永久维护前端完整领域对象。

迁移策略：

1. 结果 Guard 同时接受过渡结果和目标轻量结果；
2. 轻量结果成功后刷新对应 Workspace；
3. Workspace Mapper 生成完整前端对象；
4. Mock Resolver 改为优先返回轻量结果；
5. 删除完整对象分支；
6. 更新本文档和契约测试。

## 10. 任务成功后的结算规则

### 文案

```text
任务成功 -> 读取文本结果 -> 保存或刷新 Script Workspace -> 更新 Store
```

### 设定图

```text
任务成功 -> 刷新 Asset Workspace -> 通过 Mapper 获取图片和候选图 -> 更新 Store
```

### 分镜图和放大

```text
任务成功 -> 刷新 Storyboard Workspace -> 定位 shotId -> 更新镜头
```

### 视频

```text
任务成功 -> 刷新 Storyboard/Video Workspace -> 获取 video resource -> 更新镜头
```

### 配音

```text
任务成功 -> 刷新 Dubbing Workspace 或读取音频资源列表 -> 更新卡片和台词
```

原则：任务中心负责状态和资源结果，Workspace 负责完整业务实体。

## 11. 轮询和恢复

前端统一等待逻辑需要支持：

- 可配置轮询间隔；
- 最大等待时长；
- AbortSignal；
- 页面卸载停止当前等待；
- 网络恢复后继续查询；
- 刷新后按 `projectId` 查询运行中任务；
- 同一任务避免重复轮询；
- 成功后只结算一次；
- 已取消任务不继续结算；
- 后端返回未知状态时明确报错。

不建议通过把 Axios 超时改成几分钟来等待媒体生成。

## 12. 批量任务

批量生成需要：

- 有限并发；
- 每个实体独立任务状态；
- 单任务失败不中断整个批次；
- 支持失败项重试；
- 支持跳过隐藏或锁定实体；
- 页面刷新后可以恢复批次状态；
- 不重复提交已经运行中的实体；
- 批次完成状态由任务集合派生，不要求后端维护前端 UI 批次对象。

## 13. 幂等和重复提交

建议创建任务携带：

```ts
requestId: string
```

后端需要确认：

- 同一 `requestId` 是否返回原任务；
- 幂等窗口；
- 失败任务重试是否生成新任务；
- 取消后再次提交的语义；
- 是否产生重复计费或资源。

前端按钮 Loading 不能替代后端幂等。

## 14. 错误码

当前前端已有错误码：

- `SCRIPT_GENERATE_FAILED`
- `SCRIPT_OPTIMIZE_FAILED`
- `SETTING_IMAGE_GENERATE_FAILED`
- `STORYBOARD_GENERATE_FAILED`
- `STORYBOARD_OPTIMIZE_FAILED`
- `STORYBOARD_UPSCALE_FAILED`
- `STORYBOARD_UPSCALE_IMAGE_REQUIRED`
- `VIDEO_GENERATE_FAILED`
- `VIDEO_OPTIMIZE_FAILED`
- `DUBBING_GENERATE_FAILED`

建议补充通用任务错误：

- `GENERATION_TASK_UNSUPPORTED`
- `GENERATION_TASK_NOT_FOUND`
- `GENERATION_TASK_TIMEOUT`
- `GENERATION_TASK_CANCELLED`
- `GENERATION_TASK_CONFLICT`
- `GENERATION_TASK_RESULT_INVALID`
- `GENERATION_TASK_RESTORE_FAILED`
- `GENERATION_TASK_RATE_LIMITED`

错误码用于前端稳定分支，后端原始文案只作为补充信息。

## 15. 前端依赖规则

- Page 和 Store 不创建或推进任务；
- Service 负责任务创建、等待和结算；
- Gateway 负责 Mock/HTTP 差异；
- Mapper 负责 DTO 和领域模型转换；
- Result Guard 只校验稳定结果；
- Mock Resolver 不导入页面、Store、Editor Feature 或其他业务 API；
- HTTP Adapter 不导入 `*.mock.ts`；
- 任务结果不直接修改 Store。

## 16. 接入完成标准

- [ ] Mock 和 HTTP 实现同一 GenerationTaskGateway
- [ ] HTTP 模式支持任务创建和查询
- [ ] 任务状态可以刷新恢复
- [ ] 取消和重试语义明确
- [ ] 批量任务有限并发
- [ ] 创建任务支持幂等
- [ ] 页面和业务 Service 不重复实现轮询
- [ ] 成功后刷新 Workspace
- [ ] 后端不需要返回前端完整领域对象
- [ ] 过渡结果已标记并有迁移测试
- [ ] 错误码稳定
- [ ] Mock 主流程和 HTTP 契约测试通过

接口整体状态参见 `docs/api-contract-status-matrix.md`，修复顺序参见 `docs/frontend-backend-readiness-plan.md`。