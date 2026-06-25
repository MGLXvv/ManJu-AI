# B5-1 Asset Workspace Backend Design

## Goal

在不改前端主流程顺序的前提下，把设定页的项目资产工作区接到后端 Asset 模块：支持读取 `assets/workspace`、新增/修改/删除角色/场景/道具资产，并在保存后重新拉取 workspace，用后端真实 id 覆盖前端本地临时 id。

## Scope

本轮只处理：

- `GET /aidrama/projects/{projectId}/assets/workspace`
- `POST /aidrama/projects/{projectId}/assets`
- `PUT /aidrama/assets/{assetId}`
- `DELETE /aidrama/assets/{assetId}`
- `BackendAssetDTO -> SettingAsset` 映射
- `SettingAsset -> backend payload` 映射
- 保存后重新拉取 `assets/workspace`
- HTTP 模式下前置状态不足时的稳定提示与降级

本轮不处理：

- Resource Library
- save-to-library
- import-from-library
- 资产图片生成
- 真实 Image2
- 主流程顺序改造
- 收藏接口正式接入

## Current State

当前前端设定页依赖本地 `settingAssets` store 和 `editorStore.draft.settingAssets`。

已有能力：

1. `SettingsStep.vue` 在页面加载时通过 `editorStore.loadDraft(projectId)` 读取本地草稿。
2. `persistSettingDraft()` 当前只会：
   - `editorStore.updateSettingAssets(assetsStore.assets)`
   - `editorStore.saveDraft()`
3. 新增、编辑、删除资产目前只作用在前端本地 store。

当前缺口：

- 后端 `assets/workspace` 尚未接入。
- 新增资产 id 仍是前端本地 id，不会替换成后端真实 id。
- 编辑和删除资产不会同步到后端。
- 后端要求进入设定工作区前满足 `storyboardStatus=CONFIRMED` 且 `canEnterCharacterDesign=true`，与当前前端“文案 → 设定 → 分镜”的原型顺序存在冲突。

## Explored Approaches

### Approach A: Save-time sync with local-first editing

新增、编辑、删除资产先只改本地 store；点击保存或进入下一步时，统一比较 `currentAssets` 和 `persistedAssetIds`，执行 `POST / PUT / DELETE`，最后重新拉取后端 workspace。

优点：

- 与当前 `SettingsStep.vue` 已有的本地编辑 + 保存模型一致。
- 能平滑处理本地临时 id 到后端真实 id 的替换。
- 风险最小，不需要把所有交互变成联网事务。

缺点：

- 如果后端前置状态不足，HTTP 模式下只能降级为本地可编辑但无法同步。

### Approach B: Immediate persistence per asset operation

新增即 `POST`，编辑即 `PUT`，删除即 `DELETE`。

优点：

- 每次操作都即时落后端。

缺点：

- 与现有离开确认、保存草稿模型冲突。
- 失败回滚成本高。
- 页面逻辑会迅速膨胀。

### Approach C: Block settings page entirely when backend precondition fails

HTTP 模式下如果后端说当前项目不能进入 Asset 工作区，就直接拒绝页面编辑。

优点：

- 与后端业务状态最严格一致。

缺点：

- 会直接打断当前前端原型主流程。
- 这一轮会把“流程重排”问题和“资产接入”混在一起。

## Recommendation

推荐 Approach A，并在页面加载时对后端前置状态不足做降级提示，而不是直接阻断设定页。

原因：

- B5-1 的目标是资产工作区接入，不是流程重排。
- 当前项目已经有一套稳定的本地设定编辑与保存体验，最稳的方式是把后端同步插到保存链路，而不是重写整个页面交互。
- 这样可以先让 Asset 模块后端接入闭环，再在后续 B5-2/B5-3 讨论流程顺序调整。

## Architecture

### 1. Add Asset DTO definitions

在 `src/types/api-dto.ts` 中新增：

```ts
export type BackendAssetType = 'CHARACTER' | 'SCENE' | 'PROP'

export interface BackendAssetDTO {
  id: number | string
  projectId?: number | string
  type: BackendAssetType
  name: string
  description?: string | null
  imageUrl?: string | null
  extraJson?: string | null
  favorite?: boolean | null
  createTime?: string | null
  updateTime?: string | null
}

export interface BackendAssetWorkspaceDTO {
  characters?: BackendAssetDTO[]
  scenes?: BackendAssetDTO[]
  props?: BackendAssetDTO[]
  summary?: Record<string, unknown>
  canEnterImageGeneration?: boolean
}
```

### 2. Add asset mapper module

新增文件：

- `src/api/modules/editor/asset.mapper.ts`

提供：

```ts
export const isLocalAssetId = (id: string): boolean =>
  id.startsWith('asset-') ||
  id.startsWith('character-') ||
  id.startsWith('scene-') ||
  id.startsWith('prop-')
```

后端 → 前端：

```ts
mapBackendAssetToSettingAsset(asset: BackendAssetDTO): SettingAsset
mapBackendAssetWorkspaceToSettingAssets(workspace: BackendAssetWorkspaceDTO): SettingAsset[]
```

前端 → 后端：

```ts
mapSettingAssetToBackendPayload(asset: SettingAsset)
```

关键规则：

- `CHARACTER -> character`
- `SCENE -> scene`
- `PROP -> prop`
- `id` 一律转为字符串
- `prompt` 从 `extraJson.prompt` 解析
- `favorite` 优先从 `extraJson.favorite` 解析，其次回退到顶层 `favorite`
- `extraJson` 非法时不抛错，兜底为空 prompt 和 `false`
- 请求时 `extraJson` 必须用 `JSON.stringify(...)` 生成字符串

### 3. Add asset workflow service

新增文件：

- `src/services/editor/assetWorkflow.service.ts`

提供：

```ts
async loadAssetWorkspace(projectId: string)
async createAsset(projectId: string, asset: SettingAsset)
async updateAsset(asset: SettingAsset)
async deleteAsset(assetId: string)
async syncAssets(projectId: string, input: {
  currentAssets: SettingAsset[]
  persistedIds: string[]
})
```

同步策略和 B4-2B 的 Storyboard CRUD 保持一致：

1. 找出后端已存在、但当前本地已删除的 id，执行 `DELETE`。
2. 找出本地临时 id 的资产，执行 `POST /projects/{projectId}/assets`。
3. 找出已有后端 id 的资产，执行 `PUT /assets/{assetId}`。
4. 全部完成后重新拉取 `assets/workspace`。
5. 返回最新 workspace 映射得到的 `SettingAsset[]`。

### 4. Keep settings page resilient to backend precondition mismatch

后端要求进入 Asset 工作区前满足：

```text
storyboardStatus=CONFIRMED
canEnterCharacterDesign=true
```

但本轮不改前端主流程顺序，所以 `SettingsStep.vue` 的加载策略应是：

1. 页面加载时尝试 `loadAssetWorkspace(projectId)`。
2. 如果成功，用后端资产覆盖本地 `settingAssets`。
3. 如果失败且疑似业务前置状态不足：
   - 页面不崩
   - 保留现有本地设定编辑能力
   - 提示“后端资产工作区需在分镜确认后同步”
4. 其他请求异常仍按通用错误提示处理。

这样 B5-1 只解决“资产工作区接入”，不顺手把流程顺序大改。

### 5. Sync backend assets before saving the draft

当前 `persistSettingDraft()` 是：

```ts
editorStore.updateSettingAssets(assetsStore.assets)
await editorStore.saveDraft()
```

本轮改成：

```ts
editorStore.updateSettingAssets(assetsStore.assets)

if (apiMode === 'http' && projectId.value) {
  const syncedAssets = await assetWorkflowService.syncAssets(projectId.value, {
    currentAssets: assetsStore.assets,
    persistedIds: persistedAssetIds.value,
  })

  if (syncedAssets) {
    editorStore.updateSettingAssets(syncedAssets)
    assetsStore.setAssets(syncedAssets)
    updatePersistedAssetIds(syncedAssets)
  }
}

await editorStore.saveDraft()
```

重点：

- 同步后必须以后端返回资产为准
- 本地临时 id 必须在这里替换成后端真实 id
- 删除动作仍然保持“先本地删，保存时统一 DELETE”

### 6. Track persisted backend asset ids in SettingsStep

在 `SettingsStep.vue` 中新增：

```ts
const persistedAssetIds = ref<string[]>([])
```

并提供：

```ts
const updatePersistedAssetIds = (assets: SettingAsset[]): void => {
  persistedAssetIds.value = assets
    .map((asset) => asset.id)
    .filter((id) => !isLocalAssetId(id))
}
```

更新时机：

1. 成功加载 `assets/workspace` 后
2. `syncAssets()` 成功回写后

### 7. Leave favorite probing out of the implementation

文档里有：

```http
POST /aidrama/assets/{assetId}/favorite
```

但本轮只探测其存在性，不接正式收藏同步逻辑。

原因：

- 设定页收藏当前仍是本地行为
- 把收藏接进来会扩大保存边界
- B5-1 的核心是工作区读取和 CRUD 持久化

## File Changes

新增文件：

- `src/api/modules/editor/asset.mapper.ts`
- `src/services/editor/assetWorkflow.service.ts`
- `tests/unit/api/modules/editor/asset.mapper.test.ts`
- `tests/unit/services/editor/assetWorkflow.service.test.ts`

修改文件：

- `src/pages/editor/steps/SettingsStep.vue`
- `src/types/api-dto.ts`

按实际需要可补充：

- `tests/unit/api/modules/editor/editor.http.test.ts`

本轮不修改资源库页面，不新增新的流程路由。

## Error Handling

本轮错误处理策略：

- `assets/workspace` 加载失败且疑似前置状态不足：
  - 页面不崩
  - 提示“后端资产工作区需在分镜确认后同步”
  - 保留本地设定编辑能力
- `POST / PUT / DELETE` 任一步失败：
  - 终止同步
  - 提示“设定资产同步失败，请确认项目已完成分镜确认后再保存”
- workspace refresh 失败：
  - 提示“设定资产同步成功，但刷新最新资产失败，请重新进入页面确认”
- mock 模式下：
  - `loadAssetWorkspace()` 和 `syncAssets()` 返回 `null`
  - 不请求后端

本轮不新增专门错误码常量，先用页面级 toast 文案。

## Testing Strategy

### 1. `asset.mapper.test.ts`

覆盖：

- `CHARACTER -> character`
- `SCENE -> scene`
- `PROP -> prop`
- `id` number -> string
- `extraJson.prompt` 能解析到 `prompt`
- `extraJson` 非法 JSON 时不抛错，`prompt` 为空
- 前端 asset -> 后端 payload，`type` 正确
- `extraJson` 是字符串
- `isLocalAssetId()` 对本地 id 返回 `true`，对后端数字字符串 id 返回 `false`

### 2. `assetWorkflow.service.test.ts`

覆盖：

- `loadAssetWorkspace()` 请求 `/projects/{projectId}/assets/workspace`
- 本地资产调用 `POST /projects/{projectId}/assets`
- 后端已有资产调用 `PUT /assets/{assetId}`
- 被删除的后端资产调用 `DELETE /assets/{assetId}`
- sync 完成后重新 `GET workspace`
- mock 模式不请求后端

### 3. Manual verification

重点验证：

1. `GET /assets/workspace` 返回的 `characters/scenes/props` 能正确映射到前端
2. 新增角色/场景/道具保存时命中 `POST /projects/{projectId}/assets`
3. 修改资产保存时命中 `PUT /assets/{assetId}`
4. 删除资产保存时命中 `DELETE /assets/{assetId}`
5. 保存后本地临时 id 被替换成后端真实 id
6. 前置状态不足时页面不崩，有明确提示

## Acceptance Criteria

### Mock mode

`VITE_API_MODE=mock`

- 设定页本地编辑和保存行为不回归
- 不触发后端 Asset 请求

### HTTP mode

`VITE_API_MODE=http`

- Asset workspace 能真实读取
- `CHARACTER / SCENE / PROP` 能映射到前端设定资产
- 新增资产能 `POST` 到后端
- 修改资产能 `PUT` 到后端
- 删除资产能 `DELETE` 到后端
- 保存后本地临时 id 替换成后端真实 id
- `extraJson` 始终作为 JSON 字符串提交
- 前置状态不足时页面不崩，有明确提示
- `npm test` 通过
- `npm run build` 通过

## Risks And Non-Goals

风险：

- 后端 `extraJson` 真实字段如果比当前假设更复杂，联调时可能要微调 mapper。
- 因为本轮不改主流程，HTTP 模式下“文案后直接进入设定页”与后端流程规则仍然可能不完全一致。

非目标：

- 不接资源库
- 不接收藏持久化
- 不接资产图片生成
- 不改流程顺序

## Success Metric

B5-1 完成后，设定页的项目资产能够在 HTTP 模式下读取真实 Asset workspace，并把新增、修改、删除同步到后端；保存后本地临时资产 id 会替换成后端真实 id；即使后端前置状态不足，页面也不会崩溃。这为后续 B5-2 继续接入资产图片能力和资源库联调提供稳定基础。
