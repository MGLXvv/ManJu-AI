# B4-2B Storyboard CRUD Backend Design

## Goal

在 HTTP 模式下，把分镜页当前本地维护的镜头列表新增、修改、删除操作同步到后端分镜 CRUD 接口，并在保存完成后重新拉取后端 `storyboard/workspace`，统一使用后端真实 id。继续保留 `storyboard/confirm` 作为进入视频阶段前的确认动作。

## Scope

本轮只处理：

- `POST /aidrama/projects/{projectId}/storyboards`
- `PUT /aidrama/projects/{projectId}/storyboards/{storyboardId}`
- `DELETE /aidrama/projects/{projectId}/storyboards/{storyboardId}`
- 保存后重新 `GET /aidrama/projects/{projectId}/storyboard/workspace`
- 分镜页维护“后端已持久化镜头 id 集合”
- 进入视频前继续调用 `POST /aidrama/projects/{projectId}/storyboard/confirm`

本轮不处理：

- `PUT /aidrama/projects/{projectId}/storyboards/sort` 的正式接入
- 单镜头图片生成
- 视频生成
- Provider Sandbox
- 分镜标签与后端角色/场景/道具关联恢复
- 后端图片、视频、状态字段的进一步适配

## Current State

B4-2A 已完成：

1. HTTP 模式下，空的 `storyboard/workspace` 不再伪造本地默认分镜。
2. 分镜页新增了“根据剧本生成分镜”入口。
3. `storyboardWorkflowService.generateStoryboard()` 已接通后端 `POST /storyboard/generate`，并在必要时回退到 `GET /storyboard/workspace`。
4. `storyboardWorkflowService.confirmStoryboard()` 已接通 `POST /storyboard/confirm`。

当前缺口：

- 本地新增的镜头 id 仍是 `shot-*` 临时 id，不会自动变成后端真实 id。
- 修改现有分镜只保存在本地草稿，不会 `PUT` 到后端。
- 删除现有分镜只从本地移除，不会 `DELETE` 到后端。
- 如果不把临时 id 替换成后端 id，后续再次保存时无法稳定区分“新建镜头”与“已有镜头更新”。

## Explored Approaches

### Approach A: Save-time sync with local-first editing

页面中的新增、修改、删除仍然只先改本地 store；用户点击保存或进入下一步时，统一比较当前镜头列表与“已持久化后端镜头 id 集合”，批量执行 `POST / PUT / DELETE`，最后重新拉取后端 workspace。

优点：

- 与当前页面已有的“保存 / 离开确认 / 进入下一步前保存”模型一致。
- 容易处理本地临时 id 到后端真实 id 的替换。
- 不会把每个 UI 操作都变成联网事务。

缺点：

- 排序如果暂未落后端，刷新后可能与本地顺序不同。

### Approach B: Immediate persistence per operation

新增时立刻 `POST`，修改时立刻 `PUT`，删除时立刻 `DELETE`。

优点：

- 每次交互都即时落后端。

缺点：

- 与当前页面“保存草稿后再确认离开”的交互模型冲突。
- 网络失败时回滚 UI 状态复杂。
- 会把大量编辑细节转成远程操作，风险更高。

### Approach C: Fold CRUD sync into generic editor save

把分镜 CRUD 同步直接塞进 `editorStore.saveDraft()` 或更底层的 editor API。

优点：

- 页面层代码看起来更少。

缺点：

- 会把 `editor` 草稿保存和 `storyboard` 后端资源耦死。
- 后续接排序、局部保存、批量操作时扩展性差。

## Recommendation

推荐 Approach A：保存时统一同步。

原因：

- 与当前分镜页已存在的编辑模型最一致。
- 保持 `StoryboardStep.vue` 只负责本地 UI 状态和触发保存。
- 把后端同步细节收口到 `storyboardWorkflowService`，边界清晰。
- 这也是把本地临时 id 替换成后端真实 id 的最低风险方式。

## Architecture

### 1. Distinguish local temporary ids from backend ids

新增一个纯函数：

```ts
export const isLocalStoryboardShotId = (id: string): boolean => id.startsWith('shot-')
```

语义：

- `shot-*`：本地新增镜头，尚未落后端
- 其他 id：视为后端已持久化镜头

这条规则只用于本轮分镜 CRUD 持久化判断，不扩散到其他模块。

### 2. Add backend save payload mapper

在 `storyboard.mapper.ts` 中新增：

```ts
export interface BackendStoryboardSavePayload {
  title: string
  content: string
  durationSeconds: number
}

export const mapShotToBackendStoryboardPayload = (
  shot: StoryboardShot,
): BackendStoryboardSavePayload => ({
  title: shot.title,
  content: shot.prompt || '',
  durationSeconds: shot.durationSeconds ?? 5,
})
```

说明：

- `content` 优先取 `shot.prompt`，因为当前后端基础字段对的是镜头描述内容。
- 本轮不上传图片、视频、标签、附件等字段。

### 3. Add CRUD sync methods to storyboard workflow service

在 `storyboardWorkflow.service.ts` 中新增：

```ts
async createStoryboard(projectId: string, shot: StoryboardShot)
async updateStoryboard(projectId: string, shot: StoryboardShot)
async deleteStoryboard(projectId: string, storyboardId: string)
async syncStoryboards(projectId: string, input: {
  currentShots: StoryboardShot[]
  persistedIds: string[]
}): Promise<Pick<EditorDraft, 'shots'> | null>
```

`syncStoryboards()` 的策略：

1. 从 `persistedIds` 找出那些已经存在于后端、但当前页面已不存在的镜头 id，执行 `DELETE`。
2. 从 `currentShots` 找出本地临时 id `shot-*` 的镜头，执行 `POST`。
3. 从 `currentShots` 找出非本地临时 id 的镜头，执行 `PUT`。
4. 全部完成后，重新 `GET /storyboard/workspace`。
5. 把最新 workspace 映射成 `Pick<EditorDraft, 'shots'>` 返回给页面。

这样可以统一解决：

- 新建镜头拿到真实后端 id
- 删除镜头正确落到后端
- 修改镜头保存到后端后，以后端结果为准回填页面

### 4. Keep sort outside the save pipeline for now

后端虽然提供了 `PUT /storyboards/sort`，但本轮只做契约探测，不纳入正式保存流程。

原因：

- 当前请求体结构尚未确认。
- 如果把不确定的排序请求接进保存链路，排序 400 可能让整个分镜保存看起来失败。

本轮策略：

- 页面本地排序保留。
- 保存时只做 `POST / PUT / DELETE + workspace refresh`。
- 如果真实联调已确认 sort 请求体，再单独进入下一轮接入。

### 5. StoryboardStep owns persisted backend ids

在 `StoryboardStep.vue` 中新增：

```ts
const persistedStoryboardIds = ref<string[]>([])
```

在以下时机更新：

1. 页面加载后端分镜 workspace 成功后：

```ts
persistedStoryboardIds.value = shots
  .map((shot) => shot.id)
  .filter((id) => !isLocalStoryboardShotId(id))
```

2. `generateStoryboardFromScript()` 生成并回填后：

```ts
persistedStoryboardIds.value = resolvedShots
  .map((shot) => shot.id)
  .filter((id) => !isLocalStoryboardShotId(id))
```

3. 保存完成并以最新 workspace 覆盖本地后：

```ts
persistedStoryboardIds.value = syncedShots
  .map((shot) => shot.id)
  .filter((id) => !isLocalStoryboardShotId(id))
```

### 6. Save flow becomes "sync backend first, then save draft"

当前 `persistStoryboardDraft()` 主要是：

```ts
editorStore.updateStoryboardShots(shots.value)
await editorStore.saveDraft()
markSaved()
```

本轮改成：

```ts
editorStore.updateStoryboardShots(shots.value)

if (apiMode === 'http' && projectId.value) {
  const syncedPatch = await storyboardWorkflowService.syncStoryboards(projectId.value, {
    currentShots: shots.value,
    persistedIds: persistedStoryboardIds.value,
  })

  if (syncedPatch) {
    const draft = editorStore.draft
    const nextTagOptions = resolveStoryboardTagOptions(draft, tagOptions.value)
    const syncedShots = resolveStoryboardShots(
      syncedPatch.shots,
      nextTagOptions,
      draft?.settingAssets ?? [],
    )

    editorStore.updateStoryboardShots(syncedShots)
    store.setTagOptions(nextTagOptions)
    store.replaceShots(syncedShots)
    persistedStoryboardIds.value = syncedShots
      .map((shot) => shot.id)
      .filter((id) => !isLocalStoryboardShotId(id))
  }
}

await editorStore.saveDraft()
markSaved()
```

重点：

- 后端同步完成后，以后端返回的最新 shots 为准。
- 本地临时 id 必须在这里替换成后端真实 id。
- 删除仍然是“先本地删，保存时统一同步 DELETE”。

## File Changes

修改文件：

- `src/api/modules/editor/storyboard.mapper.ts`
- `src/services/editor/storyboardWorkflow.service.ts`
- `src/pages/editor/steps/StoryboardStep.vue`
- `src/types/api-dto.ts`
- `tests/unit/api/modules/editor/storyboard.mapper.test.ts`
- `tests/unit/services/editor/storyboardWorkflow.service.test.ts`

按实际需要可补充：

- `tests/unit/api/modules/editor/editor.http.test.ts`

本轮不新增新的页面、store 或 API module。

## Error Handling

本轮错误处理策略：

- `POST / PUT / DELETE` 任一步失败：终止本次同步，提示“分镜同步失败，请稍后重试”。
- `workspace refresh` 失败：提示“分镜同步成功，但刷新最新分镜失败，请重新进入页面确认”。
- mock 模式下：`syncStoryboards()` 直接返回 `null`，不请求后端。
- `DELETE` 仅对后端真实 id 执行，绝不对 `shot-*` 临时 id 发请求。

本轮不新增新的错误码常量，先沿用页面 toast 文案。

## Testing Strategy

### 1. `storyboard.mapper.test.ts`

补充：

- `mapShotToBackendStoryboardPayload()` 使用 `title`
- `mapShotToBackendStoryboardPayload()` 用 `shot.prompt` 映射 `content`
- `durationSeconds` 缺省时 fallback 为 `5`
- `isLocalStoryboardShotId('shot-123') === true`
- `isLocalStoryboardShotId('12') === false`

### 2. `storyboardWorkflow.service.test.ts`

覆盖：

- `syncStoryboards()` 对本地新镜头调用 `POST`
- `syncStoryboards()` 对已有后端镜头调用 `PUT`
- `syncStoryboards()` 对已删除后端镜头调用 `DELETE`
- `POST / PUT / DELETE` 完成后重新 `GET /storyboard/workspace`
- mock 模式下 `syncStoryboards()` 返回 `null`
- `DELETE` 不会对 `shot-*` 临时 id 发请求

### 3. Manual verification

重点验证：

1. HTTP 模式下修改已有镜头并保存，命中 `PUT /storyboards/{id}`
2. HTTP 模式下新增镜头并保存，命中 `POST /storyboards`
3. 保存后页面中本地 `shot-*` 替换成后端真实 id
4. HTTP 模式下删除已有镜头并保存，命中 `DELETE /storyboards/{id}`
5. 保存后重新进入分镜页，列表仍存在
6. 点击进入视频生成，`POST /storyboard/confirm` 不再因空分镜失败

## Acceptance Criteria

### Mock mode

`VITE_API_MODE=mock`

- 本地分镜编辑与保存行为不回归
- 不触发后端 CRUD 请求

### HTTP mode

`VITE_API_MODE=http`

- 新增镜头保存后能 `POST` 到后端
- 修改已有镜头保存后能 `PUT` 到后端
- 删除已有镜头保存后能 `DELETE` 到后端
- 保存后本地临时 id 替换成后端真实 id
- 重新进入分镜页后，分镜列表仍存在
- `storyboard/confirm` 不再因为空分镜失败
- `npm test` 通过
- `npm run build` 通过

## Risks And Non-Goals

风险：

- 如果后端 `POST / PUT / DELETE` 返回体结构与预期不同，需要在联调时按真实结构微调。
- 因为本轮不接 sort，保存后镜头顺序可能暂时与本地拖拽顺序不完全一致。

非目标：

- 不接排序持久化
- 不接图片生成
- 不接视频生成
- 不恢复标签映射

## Success Metric

B4-2B 完成后，HTTP 模式下分镜页新增、修改、删除镜头都能通过后端 CRUD 持久化；保存后本地临时镜头 id 能替换成后端真实 id；再次进入页面或进入视频阶段时，前后端分镜状态保持一致。这为下一阶段接入排序和更完整的分镜工作区联调提供稳定基础。
