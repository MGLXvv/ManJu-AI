# B4-1 Storyboard Backend Adaptation Design

## Goal

在不接入分镜图片生成、视频生成、Provider Sandbox、分镜后端 CRUD 的前提下，把分镜模块的 HTTP 模式接到后端 storyboard workspace 与 storyboard confirm，完成“读取后端分镜工作区”和“进入视频前确认分镜状态”的最小闭环，同时保持 mock 模式现有行为不回归。

## Scope

本轮只处理：

- `GET /aidrama/projects/{projectId}/storyboard/workspace`
- 后端 storyboard workspace DTO 映射到前端 `EditorDraft.shots`
- `editorHttpApi.getDraft()` 聚合 script workspace 与 storyboard workspace
- `POST /aidrama/projects/{projectId}/storyboard/confirm`
- `StoryboardStep.vue` 进入视频前调用 confirm
- mock/http 双模式兼容

本轮不处理：

- `POST /storyboard/generate`
- `POST/PUT/DELETE /storyboards`
- `PUT /storyboards/sort`
- 单镜头图片生成、高清化、视频生成、配音生成
- 分镜模块 UI 新入口

## Current State

当前前端分镜模块依赖的是本地统一 draft：

1. `StoryboardStep.vue` 进入页面时调用 `editorStore.loadDraft(projectId)`。
2. 分镜数据来自 `editorStore.draft.shots`。
3. 页面再通过 `resolveStoryboardShots()` 转成 `useStoryboardStore` 使用的 `StoryboardShot[]`。
4. 进入视频前只会 `persistStoryboardDraft()` 并更新项目 step，不会通知后端 storyboard 已确认。

当前后端已经提供 storyboard 模块专用接口，但前端还没有接上：

- `GET /aidrama/projects/{projectId}/storyboard/workspace`
- `POST /aidrama/projects/{projectId}/storyboard/confirm`

## Recommended Approach

采用“继续复用 `editorHttpApi.getDraft()` 聚合多个 workspace”的方案：

1. 在 `editorHttpApi.getDraft()` 中同时读取 script workspace 和 storyboard workspace。
2. 通过新增的 `storyboard.mapper.ts` 把后端分镜数据映射成前端 `EditorDraft.shots`。
3. 保持 `StoryboardStep.vue -> editorStore.loadDraft() -> resolveStoryboardShots()` 的现有加载链路不变。
4. 新增 `storyboardWorkflowService.confirmStoryboard()`，只在用户点击进入视频时调用。

不推荐在 B4-1 新增独立的页面级分镜加载服务并让 `StoryboardStep.vue` 绕开 `editorStore.loadDraft()`，因为这会在同一个页面里同时出现“编辑器整稿加载”和“分镜独立加载”两套入口，后续更容易和 settings/storyboard 其它适配阶段产生冲突。

## Architecture

### 1. Storyboard mapper boundary

新增 `src/api/modules/editor/storyboard.mapper.ts`，只处理后端 storyboard workspace DTO 到 `EditorDraft.shots` 的转换。

建议后端 DTO 用宽松兼容写法：

```ts
export interface BackendStoryboardDTO {
  id: number | string
  title?: string | null
  content?: string | null
  description?: string | null
  prompt?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  durationSeconds?: number | null
  sortOrder?: number | null
  index?: number | null
  status?: string | null
  createTime?: string | null
  updateTime?: string | null
}

export interface BackendStoryboardWorkspaceDTO {
  storyboards?: BackendStoryboardDTO[]
  list?: BackendStoryboardDTO[]
  storyboardStatus?: string | null
  canGenerateStoryboard?: boolean
  canEnterVideo?: boolean
}
```

建议 mapper 规则：

- 列表优先取 `storyboards`，回退 `list`
- `id` 一律转成 string
- `index` 优先取后端 `index`，回退 `sortOrder`，再回退循环序号
- 文案优先取 `content`，回退 `description`，再回退 `prompt`
- `durationSeconds` 缺失时回退默认值 `5`
- 本轮不尝试恢复角色、场景、道具标签，先留空数组

对应输出仍然是前端 `Shot[]`，这样 `resolveStoryboardShots()` 和 `store.replaceShots()` 不需要重写。

### 2. `editorHttpApi.getDraft()` aggregation

`src/api/modules/editor/editor.http.ts` 在 B3 基础上继续扩展：

- 读取 `script/workspace`
- 读取 `storyboard/workspace`
- 聚合成一个 `EditorDraft`

建议实现顺序：

1. script workspace 作为主工作区，失败则继续抛错
2. storyboard workspace 允许单独容错
3. 若 storyboard workspace 请求失败，则回退为 `shots: []`
4. 最终仍通过 `normalizeEditorDraft(projectId, partialDraft)` 产出标准 `EditorDraft`

这是一个有意的阶段性策略：

- B3 已经把 script 页面切到后端
- B4-1 只补 storyboard workspace
- 非 storyboard 区域继续由前端默认值补齐

这样做的代价是：HTTP 模式下 `getDraft()` 仍然是一个聚合器。但这与当前前端整体结构一致，且比在 B4-1 就拆开多个页面级加载入口更稳。

### 3. Storyboard confirm workflow

新增 `src/services/editor/storyboardWorkflow.service.ts`：

```ts
export const storyboardWorkflowService = {
  async confirmStoryboard(projectId: string): Promise<void> {
    if (isMockMode) {
      return
    }

    await http.post(`/aidrama/projects/${projectId}/storyboard/confirm`)
  },
}
```

`StoryboardStep.vue` 的 `goVideoStep()` 改为：

1. `validateEditorAdvance('storyboardToVideo', ...)`
2. `persistStoryboardDraft()`
3. `confirmStoryboard(projectId)`
4. `projectStore.updateProjectStep(projectId, validation.nextStep)`
5. `router.push(...)`

confirm 放在保存之后、更新项目 step 之前，和 B3 的 script confirm 顺序保持一致。这样能避免：

- 前端已进入视频页，但后端 `storyboardStatus` 仍未确认
- 后续后端视频模块前置校验时，状态链路不一致

### 4. No CRUD in this phase

本轮明确不碰分镜后端 CRUD 和排序接口。

原因有两个：

1. 当前本地新建镜头的 id 仍是前端生成值，例如 `shot-xxx`，后端 `PUT /storyboards/{id}` 无法直接接受。
2. 真正接 CRUD 必须同时定义“本地镜头 id 与后端镜头 id 的映射、创建后回填、删除策略、排序 payload”，这已经超出 B4-1 的最小闭环。

因此 B4-1 只做：

- 读 workspace
- confirm storyboard

把 CRUD 留给 B4-2 单独处理。

## File Changes

新增文件：

- `src/api/modules/editor/storyboard.mapper.ts`
- `src/services/editor/storyboardWorkflow.service.ts`
- `tests/unit/api/modules/editor/storyboard.mapper.test.ts`
- `tests/unit/services/editor/storyboardWorkflow.service.test.ts`

修改文件：

- `src/api/modules/editor/editor.http.ts`
- `src/types/api-dto.ts`
- `src/pages/editor/steps/StoryboardStep.vue`
- `tests/unit/api/modules/editor/editor.http.test.ts`

本轮不修改：

- `src/services/generation/storyboardGeneration.service.ts`
- `src/api/modules/storyboard/storyboard.http.ts`
- `src/stores/storyboard.ts`

## Error Handling

本轮延续现有页面提示策略，不新建新的产品文案体系。

约定：

- storyboard workspace 单独失败时，`getDraft()` 返回空 shots，不直接让编辑器崩掉
- `confirmStoryboard()` 失败时，在 `StoryboardStep.vue` 中 toast 通用错误，例如“分镜确认失败，请稍后再试”
- mock 模式下 `confirmStoryboard()` no-op，不影响既有流程

## Testing Strategy

### 1. `storyboard.mapper.test.ts`

覆盖：

- `storyboards -> shots`
- number id 转 string
- `content -> description`
- `durationSeconds` 正常映射
- 缺列表字段时回退 `shots: []`

### 2. `editor.http.test.ts`

补充覆盖：

- `getDraft()` 会请求 `/storyboard/workspace`
- script 与 storyboard patch 会一起合并到 `EditorDraft`
- storyboard workspace 失败时不影响 script patch 返回

### 3. `storyboardWorkflow.service.test.ts`

覆盖：

- mock 模式不请求后端
- http 模式调用 `/storyboard/confirm`

## Acceptance Criteria

### Mock mode

`VITE_API_MODE=mock`

- 分镜页行为不回归
- 进入视频页行为不回归
- 不要求命中新后端 storyboard 接口

### HTTP mode

`VITE_API_MODE=http`

- `editorHttpApi.getDraft()` 请求 `GET /aidrama/projects/{projectId}/storyboard/workspace`
- 后端 storyboard workspace 成功时，前端 draft 中能得到 `shots`
- 分镜页显示后端已有分镜
- 点击进入视频前请求 `POST /aidrama/projects/{projectId}/storyboard/confirm`
- `npm test` 通过
- `npm run build` 通过

## Risks And Non-Goals

风险：

- 后端 storyboard workspace 字段名若和预期不同，`storyboard.mapper.ts` 需要按真实响应再补兼容
- 当前标签字段在 B4-1 仍为空数组，分镜页若依赖后端镜头里已有角色/场景/道具信息，本轮不会恢复这些关系

非目标：

- 不接 `storyboard/generate`
- 不接 `storyboards` CRUD
- 不接图片生成与视频生成
- 不新增“生成分镜”按钮

## Success Metric

B4-1 完成后，HTTP 模式下分镜页面可以从后端读取已有分镜工作区，并在进入视频前正确确认 storyboard 状态；mock 模式和现有前端步骤流不回归。这为后续 B4-2 单独接分镜后端 CRUD 和排序留下清晰边界。
