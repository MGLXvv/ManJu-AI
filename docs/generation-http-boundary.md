# 生成任务 HTTP 接入边界

本文档记录前端当前对生成类任务的 mock/http 边界，供后续后端联调使用。

## 1. 当前总体策略

当前前端保留两套运行路径：

- `VITE_API_MODE=mock`：走本地 mock 任务，使用 `createAndWaitGenerationTask` 创建并轮询本地任务。
- `VITE_API_MODE=http`：不走本地 mock 任务创建，改走业务接口，例如素材图、分镜图、视频、配音等业务 endpoint。

通用任务创建函数 `createAndWaitGenerationTask` 仅用于 mock 模式。HTTP 模式下如果误用该函数，会抛出：

```ts
API_ERROR_CODES.generationTaskHttpCreateUnsupported
```

## 2. HTTP 生成结果处理规则

HTTP 生成接口目前按“创建任务后立即尝试解析结果”的边界处理：

1. 调用业务生成接口创建任务。
2. 优先从刷新后的 workspace 中读取结果 URL。
3. 如果 workspace 未更新，则读取接口返回任务里的 `resultUrl`。
4. 如果任务存在但结果 URL 为空，认为任务仍在处理中，抛出：

```ts
API_ERROR_CODES.generationTaskHttpPending
```

页面会提示：

```text
生成任务已提交，结果仍在处理中，请稍后刷新工作区查看结果
```

这表示后端异步任务已经被前端明确识别为“待轮询/待刷新”状态，而不是误判为普通生成失败。

## 3. 当前业务接口

### 3.1 文案生成

```http
POST /aidrama/projects/{projectId}/script/generate
POST /aidrama/projects/{projectId}/script/storyboard/generate
```

前端入口：

```ts
src/services/editor/scriptGenerationWorkflow.service.ts
```

### 3.2 设定素材图片生成

```http
POST /aidrama/assets/{assetId}/generate-image
```

前端入口：

```ts
src/services/generation/settingAssetGeneration.service.ts
src/services/editor/assetImageTask.service.ts
```

结果读取：

- 优先读取 `assetWorkflowService.loadAssetWorkspace(projectId)` 返回的资产图片。
- 其次读取任务 `resultUrl`。

### 3.3 分镜图片生成

```http
POST /aidrama/storyboards/{storyboardId}/generate-image
```

前端入口：

```ts
src/services/generation/storyboardGeneration.service.ts
src/services/editor/storyboardImageTask.service.ts
```

结果读取：

- 优先读取 `storyboardWorkflowService.loadStoryboardWorkspace(projectId)` 返回的分镜图片。
- 其次读取任务 `resultUrl`。

### 3.4 视频生成

```http
POST /aidrama/storyboards/{storyboardId}/generate-video
```

前端入口：

```ts
src/services/generation/videoGeneration.service.ts
src/services/editor/storyboardVideoTask.service.ts
```

结果读取：

- 优先读取 `storyboardWorkflowService.loadStoryboardWorkspace(projectId)` 返回的视频地址。
- 其次读取任务 `resultUrl`。

### 3.5 配音生成

```http
POST /aidrama/storyboards/{storyboardId}/generate-voice
```

前端入口：

```ts
src/services/generation/dubbingGeneration.service.ts
src/services/editor/storyboardVoiceTask.service.ts
```

结果读取：

- 当前直接读取任务 `resultUrl`。
- 如果后端配音也写入 workspace，后续可补充刷新工作区逻辑。

## 4. 后续真正异步轮询需要补的能力

当前 HTTP 路径只做了“创建任务 + 立即解析结果/识别 pending”。如果后端是真异步任务，需要补充：

1. 任务详情查询接口，例如：

```http
GET /aidrama/tasks/{taskId}
```

2. 统一任务轮询逻辑：

```text
创建任务 -> 轮询任务状态 -> 成功后刷新 workspace -> 写回 draft/store
```

3. 页面状态补充：

- 正在生成中
- 任务已提交
- 任务处理中
- 生成成功
- 生成失败
- 任务超时

4. 批量生成策略：

- 并发数量限制
- 单个任务失败不中断整体批量
- 任务状态回填到每个镜头/素材/台词

## 5. 当前结论

当前阶段已经做到：

- mock 生成任务仍可跑通。
- HTTP 模式不会误走 mock-only 的任务创建。
- HTTP 结果为空时不会再被简单归类为普通失败，而是明确提示“任务已提交但仍在处理中”。
- 后续后端只要确认任务查询接口和 workspace 回填规则，即可继续补真实轮询。