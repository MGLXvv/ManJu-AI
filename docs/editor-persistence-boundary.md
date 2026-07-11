# EditorPersistenceService 实施说明

## 状态

第三轮 P3 编辑器持久化边界实现。

该实现统一前端草稿的分区识别、脏状态、自动保存、防抖、版本冲突、失败重试和路由离开保存。HTTP 后端当前仍只完整支持部分 Script Workspace 接口，因此本文描述的是前端稳定边界，不代表所有后端分区接口已经交付。

## 持久化分区

编辑器草稿按以下稳定分区计算变更：

| 分区 | 当前包含内容 |
| --- | --- |
| `script` | 原文、提示词、大纲、生成剧本、剧本分镜文本 |
| `setting` | 角色、场景、道具摘要和完整设定资产，包括候选图、收藏与音色 |
| `storyboard` | 分镜结构、画面、标签、审核、隐藏、锁定、参考图和编辑历史 |
| `video` | 视频地址、视频提示词、对白、时长、角色音色和视频审核状态 |
| `dubbing` | 配音模型、角色卡片、隐藏状态、音色和逐句音频结果 |
| `project-meta` | 项目 ID 和分镜生成模式；项目列表中的名称、状态和当前步骤继续由 Project API 管理 |

分区只用于前端变更识别和保存意图传递，不要求后端立即拆成六个物理接口。

## revision 契约

`EditorDraft` 增加可选 `revision`，旧草稿读取时自动归一为 `0`。

保存调用携带：

```ts
interface SaveDraftOptions {
  expectedRevision?: number
  partitions?: EditorPersistencePartition[]
  reason?: 'manual' | 'autosave' | 'navigation' | 'retry' | 'conflict-overwrite'
}
```

保存结果返回：

```ts
interface SaveDraftResult {
  draft: EditorDraft
  savedAt: string
  revision: number
}
```

Mock 模式使用乐观并发控制：

- 首次保存从 `revision = 0` 增加到 `1`；
- `expectedRevision` 与已保存版本不一致时返回 `EDITOR_SAVE_CONFLICT`；
- 冲突状态保留本地待保存草稿，不静默覆盖；
- 用户可以选择重新加载远端草稿，或读取最新远端版本后覆盖保存本地草稿。

HTTP Adapter 当前保留既有请求字段，避免猜测尚未确认的后端 revision 字段。后端契约确认后，应在 Adapter 中映射真实版本字段和 409 冲突响应。

## 自动保存

`EditorPersistenceService` 默认防抖时间为 800ms。

Store 更新草稿后：

1. 计算相对已保存基线的脏分区；
2. 状态变为 `dirty`；
3. 800ms 内继续修改会重置计时器；
4. 到期后串行保存最新草稿；
5. 保存期间发生的新修改会保留，并在本次保存完成后再次自动保存；
6. 保存失败或冲突时不清除待保存草稿。

现有 Script 页面通过 Store 更新方法实时进入自动保存。设定、分镜和视频 Store 通过 `editorWorkspacePersistenceSync` 统一同步到 Editor Store。配音页面在当前显式同步草稿时进入相同持久化边界；后续若拆出独立 Dubbing Store，可直接接入同一同步桥。

## 路由离开保存

全局路由守卫在离开编辑器步骤前调用：

```ts
await editorStore.flushPendingSave('navigation')
```

保存失败时阻止导航并提示；版本冲突时提示先处理冲突。各页面原有未保存确认仍负责用户交互，最终保存语义由统一 Store 和 Service 执行。

浏览器关闭或刷新无法可靠等待异步请求，因此页面仍保留 `beforeunload` 提示；已完成的防抖自动保存会尽量缩短未保存窗口。

## Store 能力

`useEditorStore` 新增：

- `revision`
- `dirtyPartitions`
- `hasUnsavedChanges`
- `hasSaveConflict`
- `saveErrorCode`
- `retrySave()`
- `reloadAfterConflict()`
- `overwriteConflict()`
- `flushPendingSave(reason)`

原有 `loadDraft()`、`saveDraft()` 和各分区更新方法保持兼容。

## 错误与恢复

稳定错误码：

- `EDITOR_SAVE_FAILED`
- `EDITOR_SAVE_CONFLICT`
- `EDITOR_DRAFT_NOT_LOADED`
- `EDITOR_LOCAL_STORAGE_QUOTA_EXCEEDED`

行为：

- 普通失败：状态为 `error`，本地修改保留，可调用 `retrySave()`；
- 版本冲突：状态为 `conflict`，可选择 `reloadAfterConflict()` 或 `overwriteConflict()`；
- 刷新恢复：重新调用 `loadDraft(projectId)`，恢复已持久化的审核、隐藏、候选图、音色、视频和配音字段；
- 路由切换：先 flush，失败时留在当前页面。

## 测试覆盖

新增测试覆盖：

- 六个分区的独立变更识别；
- 800ms 防抖自动保存；
- 保存 revision 递增；
- stale revision 冲突；
- 冲突覆盖保存；
- 普通失败后重试；
- Editor Store 自动保存；
- 重建 Store 后刷新恢复。

## 本地验证

合并前执行：

```bash
pnpm test
pnpm build
```

在本地验证完成前，第三轮 PR 保持 Draft。
