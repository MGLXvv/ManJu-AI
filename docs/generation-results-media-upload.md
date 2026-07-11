# 生成结果与媒体上传边界

本文档说明第四阶段 P4 的前端实现边界。目标是让异步生成任务、编辑器 Workspace 和媒体文件存储彼此解耦，避免后端必须在任务结果中返回完整页面对象，也避免将 Data URL 或 Blob URL 长期写入 localStorage。

## 1. 生成任务结果模型

生成任务结果分为两层。

### 1.1 轻量任务结果

任务接口只需要返回识别目标和定位结果所需的最小字段，例如：

```ts
interface StoryboardImageTaskResult {
  shotId: string
  imageUrl: string
}

interface SettingAssetImageTaskResult {
  assetId: string
  imageUrl: string
}

interface VideoGenerateTaskResult {
  shotId: string
  videoUrl: string
}
```

配音任务可以返回：

```ts
interface DubbingGenerateTaskResult {
  cardId: string
  lineIds: string[]
  audioByLineId?: Record<string, string>
}
```

Mock 迁移期仍允许附带完整 `shot`、`asset` 或 `lines`，但这些字段不再是任务契约的硬性要求。

### 1.2 页面可消费结果

页面 Store 仍然接收完整实体。`generationWorkspaceRefreshService` 负责：

1. 根据 `shotId` 或 `assetId` 刷新对应 Workspace；
2. 将后端返回的结果 URL 合并到最新实体；
3. 在 Workspace 暂时不可用时，以当前 Store 实体作为保底；
4. 清除已被新生成结果替代的本地媒体 ID；
5. 返回页面可直接替换的完整 `shot` 或 `asset`。

HTTP 模式下每次成功任务最多读取一次 Workspace。已读取的实体会传给结果补齐方法，不重复请求。

## 2. 媒体引用模型

编辑器状态新增稳定媒体 ID：

- `SettingAsset.imageMediaIds`
- `SettingAsset.candidateMediaIds`
- `StoryboardShot.imageMediaId`
- `StoryboardShot.videoMediaId`
- `StoryboardReferenceImage.mediaId`
- `StoryboardImageEditRecord.sourceMediaId`
- `StoryboardImageEditRecord.resultMediaId`
- `DubbingRoleLineDraft.audioMediaId`
- `ResourceAsset.imageMediaId`

URL 和媒体 ID 的职责不同：

| 字段 | 用途 |
| --- | --- |
| `mediaId` | 可持久化的稳定引用 |
| 远程 URL | 后端或 CDN 可访问的稳定资源 |
| Blob URL | 当前浏览器会话中的临时预览 |
| Data URL | 文件读取或 Mock 图像编辑过程中的临时值 |

长期持久化不能依赖 Blob URL，因为刷新或关闭页面后该地址失效。大体积 Data URL 也不能写入 localStorage。

## 3. MediaUploadService

`MediaUploadService` 提供统一入口：

- `upload(file, context, fileName)`
- `uploadFile(file, context)`
- `uploadDataUrl(dataUrl, context, fileName)`
- `captureUrl(url, context, fileName)`
- `restore(mediaId)`

### 3.1 Mock 模式

Mock 文件存入 `mediaBlobRepository`：

1. 优先写入 IndexedDB；
2. 测试环境或 IndexedDB 不可用时使用内存回退；
3. 返回稳定 `mediaId`；
4. 通过对象 URL提供即时预览；
5. 应用卸载时统一释放对象 URL。

`captureUrl` 兼容当前页面已有的 FileReader Data URL 和 Blob URL流程。页面可以继续短暂使用原始预览地址，API 边界会同步生成媒体 ID。

### 3.2 HTTP 模式

当前后端媒体上传端点尚未确认，因此不猜测接口。

HTTP 模式遇到 Data URL、Blob URL 或 `mock-media://` 时抛出：

```text
MEDIA_UPLOAD_HTTP_UNSUPPORTED
```

稳定的后端/CDN URL仍可以进入现有 Adapter。后续确认上传接口后，只需要替换 HTTP 上传实现，无需再次修改编辑器 Store 的媒体字段。

## 4. 持久化行为

### 4.1 Editor Draft

Mock 保存前执行 `sanitizeEditorDraftMedia`：

- 清除临时图片、视频、参考图、编辑历史和配音音频 URL；
- 保留对应媒体 ID；
- 远程 URL保持不变。

读取草稿时执行 `hydrateEditorDraftMedia`，从媒体 ID恢复预览 URL。

### 4.2 Resource Library

资源库 Mock 使用同样的 ID/URL 分离策略：

- localStorage 保存媒体 ID；
- 不保存 Data URL 或 Blob URL；
- 读取时恢复预览。

### 4.3 JSON 导出

分镜、视频和配音 JSON 导出会清除浏览器临时 URL，同时保留媒体 ID。因此导出文件不会包含当前会话专属 Blob URL，也不会被大体积 Data URL膨胀。

## 5. Mock 媒体

生成图和默认占位图改为固定静态资源：

```text
/public/mock-media/generated-placeholder.svg
```

现有 Mock 视频和音频继续使用 `/public/mock-media` 中的固定资源。运行期生成结果通过查询参数区分目标，不再生成大型内联 SVG Data URL。

图像编辑功能仍可在计算过程中生成 Data URL，但在 API 边界会立即捕获为媒体 ID，持久化时不会保存内联数据。

## 6. HTTP 与 Mock 依赖边界

正式 HTTP Adapter 不应导入：

- `*.mock.ts`
- `src/mocks/*`

资源库目录常量已从 Mock 文件迁移到：

```text
src/features/resource/resourceLibraryDefaults.ts
```

HTTP 和 Mock Adapter 均可引用该共享常量。

## 7. 测试覆盖

新增或更新测试覆盖：

- 轻量生成结果守卫；
- 完整结果向后兼容；
- 单次 Workspace 刷新后的实体补齐；
- Data URL捕获和媒体 ID生成；
- IndexedDB 不可用时的内存回退；
- Editor Draft 中不保存 Data/Blob URL；
- Resource Library 中不保存 Data URL；
- 媒体 ID刷新恢复；
- HTTP Adapter 阻断浏览器本地 URL；
- 稳定远程 URL继续通过；
- JSON 导出清除临时图片、视频和音频 URL；
- Mock 固定媒体资源。

## 8. 本轮不包含

以下内容留到后续阶段：

- 真实后端 multipart/对象存储上传接口；
- 服务端媒体删除和引用计数；
- IndexedDB 容量管理和 LRU 清理；
- CDN 签名 URL刷新；
- GitHub Actions CI。
