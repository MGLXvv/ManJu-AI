# B3 Script Backend Adaptation Design

## Goal

在不触碰设定、分镜、视频、配音链路的前提下，把文案工作区在 HTTP 模式下切到后端 `script/*` 专用接口，完成“加载工作区、保存原文与提示词、生成剧本、保存生成结果、确认进入设定”的最小闭环，同时保持 mock 模式现有行为不回归。

## Scope

本轮只处理：

- script 页面初始化时加载后端 script workspace
- script 原文与提示词保存到后端 draft 接口
- script 生成切到后端 `script/generate`
- 已生成内容回填前端 generated script 区域
- 点击“进入设定”前调用后端 confirm 接口
- mock/http 双模式兼容

本轮不处理：

- settings、storyboard、video、dubbing、complete 的后端适配
- editor 泛草稿接口的大重构
- 资源库、设定素材、导出格式、provider、权限
- script optimize 产品入口恢复

## Current State

当前代码存在三处与后端契约不一致的地方：

1. `src/api/modules/editor/editor.http.ts` 仍使用旧的 `/editor/drafts/{projectId}` 读写整份草稿。
2. `src/services/generation/scriptGeneration.service.ts` 在所有模式下都走 generation task。
3. `src/pages/editor/steps/ScriptStep.vue` 在进入设定前只做前端保存和 `projectStore.updateProjectStep()`，不会通知后端 script 已确认。

同时，当前 store 和页面状态组织本身是可复用的：

- `useEditorStore.loadDraft/saveDraft` 已经提供了 script 页需要的加载与保存入口。
- `ScriptStep.vue` 已经有稳定的 `persistDraft()`、`handleGenerate()`、`handleNext()` 流程。
- `normalizeEditorDraft()` 可以为非 script 区域补默认值，因此本轮不需要同步接后端其它模块。

## Recommended Approach

采用“HTTP 模式 script 直连，mock 模式保持原状”的方案：

1. `editorHttpApi` 不再假装读写完整 editor draft，而是在 HTTP 模式下转接后端 `script/workspace`、`script/draft`、`script/content`。
2. 新增 script DTO mapper，把后端 workspace 映射成前端 `EditorDraft` 的 script 部分，再由 `normalizeEditorDraft()` 补全其它区域。
3. `scriptGenerationService.generateScript()` 在 HTTP 模式下改为直连 `script/generate`，不再走 generation task。
4. 新增 `scriptWorkflowService.confirmScript()`，只在用户点击“进入设定”时调用 `/script/confirm`。

不推荐继续把后端 script 专用接口包进“泛 editor 草稿”语义里，因为后续接 settings/storyboard 时还会再拆一次，接口边界会继续含混。

## Architecture

### 1. API mapping boundary

新增 `src/api/modules/editor/script.mapper.ts`，集中处理后端 script workspace DTO 与前端 `EditorDraft` 之间的转换。

后端字段兼容策略：

- 原文：`rawText`
- 提示词：`prompt`
- 生成结果：优先取 `content`，其次 `scriptContent`，再其次 `generatedContent`
- 更新时间：优先取 `updateTime`，其次 `updatedAt`

建议 DTO：

```ts
export interface BackendScriptWorkspaceDTO {
  rawText?: string
  prompt?: string
  content?: string
  scriptContent?: string
  generatedContent?: string
  scriptStatus?: string
  canEnterStoryboard?: boolean
  updateTime?: string
  updatedAt?: string
}
```

建议 mapper：

```ts
export const getBackendScriptGeneratedContent = (
  workspace?: BackendScriptWorkspaceDTO,
): string => workspace?.content || workspace?.scriptContent || workspace?.generatedContent || ''

export const mapBackendScriptWorkspaceToDraft = (
  projectId: string,
  workspace?: BackendScriptWorkspaceDTO,
): EditorDraft => {
  return normalizeEditorDraft(projectId, {
    projectId,
    script: {
      content: workspace?.rawText || '',
      prompt: workspace?.prompt || '',
      generated: getBackendScriptGeneratedContent(workspace),
      updatedAt: workspace?.updateTime || workspace?.updatedAt || '',
    },
  } as Partial<EditorDraft> as EditorDraft)
}
```

这里故意只映射 script 部分，避免把未接入模块错误地伪装成后端真数据。

### 2. editorHttpApi behavior

`src/api/modules/editor/editor.http.ts` 改成 script-aware HTTP 实现：

- `getDraft(projectId)`
  - `GET /aidrama/projects/{projectId}/script/workspace`
  - 用 mapper 转成 `EditorDraft`
- `saveDraft(projectId, draft)`
  - `PUT /aidrama/projects/{projectId}/script/draft`，payload 只包含：
    - `rawText: draft.script.content`
    - `prompt: draft.script.prompt`
  - 如果 `draft.script.generated.trim()` 非空，再额外：
    - `PUT /aidrama/projects/{projectId}/script/content`
    - payload: `{ content: draft.script.generated }`
  - 返回值仍保持 `SaveDraftResult`，供 store 继续复用

注意事项：

- 不能在 generated 为空时调用 `/script/content`，否则会把尚未生成的状态错误覆盖到后端。
- `saveDraft()` 不负责 confirm，避免“只是保存草稿”也改动 scriptStatus。

### 3. Generation behavior

`src/services/generation/scriptGeneration.service.ts` 保留现有导出接口，但内部按运行模式分流：

- mock 模式：
  - 继续走 `generationTaskRunner`
- http 模式：
  1. `PUT /aidrama/projects/{projectId}/script/draft`
  2. `POST /aidrama/projects/{projectId}/script/generate`
  3. 把返回体映射成 `{ script: string }`

这样可以保证：

- 前端生成前原文与提示词已同步到后端
- B3 只改变 script 生成，不影响其它 generation service
- `ScriptStep.vue` 无需改调用方式

### 4. Confirm workflow

新增 `src/services/editor/scriptWorkflow.service.ts`：

```ts
export const scriptWorkflowService = {
  async confirmScript(projectId: string): Promise<void> {
    if (isMockMode) return
    await http.post(`/aidrama/projects/${projectId}/script/confirm`)
  },
}
```

`ScriptStep.vue` 的下一步流程改为：

1. 校验 generated script 可进入设定
2. `persistDraft()`
3. `scriptWorkflowService.confirmScript(projectId)`
4. `projectStore.updateProjectStep(projectId, 'settings')`
5. `router.push(...)`

confirm 放在保存之后、更新项目 step 之前，这样能保证：

- 后端先拿到最新原文、提示词、生成稿
- 后端 scriptStatus 已确认后，前端再推进项目步骤
- confirm 失败时不会出现“项目已前进但后端 script 未确认”的半成功状态

## File Changes

新增文件：

- `src/api/modules/editor/script.mapper.ts`
- `src/services/editor/scriptWorkflow.service.ts`
- `tests/unit/api/modules/editor/script.mapper.test.ts`
- `tests/unit/services/editor/scriptWorkflow.service.test.ts`

修改文件：

- `src/api/modules/editor/editor.http.ts`
- `src/api/modules/editor/editor.types.ts`
- `src/types/api-dto.ts`
- `src/services/generation/scriptGeneration.service.ts`
- `src/pages/editor/steps/ScriptStep.vue`
- `tests/unit/services/generation/scriptGeneration.service.test.ts`
- `tests/unit/api/modules/editor/editor.api.test.ts` 或新增更细粒度 HTTP 测试

如果 `editor.types.ts` 需要承载后端 script DTO，也可以把 DTO 放在 `src/types/api-dto.ts`，避免 editor module 内类型分散。

## Error Handling

保持当前页面错误提示策略，不新增产品文案体系。

重点原则：

- `editorSaveFailed` 继续用于 script 页保存失败提示
- `SCRIPT_GENERATE_FAILED` 继续用于生成失败提示
- confirm 失败时复用通用错误 toast，例如“保存失败，请稍后再试”或更精确的“文案确认失败，请稍后再试”

本轮不引入新的前端错误码常量，除非后端返回结构要求必须区分。

## Testing Strategy

### Unit tests

1. `script.mapper.test.ts`
   - `rawText/prompt/content/updateTime` 正常映射
   - `scriptContent/generatedContent/updatedAt` 作为兼容回退
   - workspace 缺字段时回落为空字符串和默认 draft

2. `editor.http` 相关测试
   - `getDraft()` 请求 `script/workspace`
   - `saveDraft()` 总是调用 `script/draft`
   - `generated` 为空时不调用 `script/content`
   - `generated` 非空时调用 `script/content`

3. `scriptGeneration.service.test.ts`
   - mock 模式仍走 generation task 逻辑
   - http 模式先保存 draft，再调 `script/generate`
   - 正确读取返回 script

4. `scriptWorkflow.service.test.ts`
   - mock 模式 no-op
   - http 模式调用 `script/confirm`

### Regression expectations

- 现有 script 页面保存、清空提示词、模板管理、离开确认不应受影响
- route guard 不应因 B3 改动而改变判断规则
- mock 模式脚本页现有测试应保持通过

## Acceptance Criteria

### Mock mode

`VITE_API_MODE=mock`

- script 页正常加载默认 draft
- 生成仍然成功
- 保存与进入设定行为不变
- 不要求命中新后端接口

### HTTP mode

`VITE_API_MODE=http`

- 进入 script 页时请求 `GET /aidrama/projects/{projectId}/script/workspace`
- 点击保存时请求 `PUT /aidrama/projects/{projectId}/script/draft`
- `generated` 非空时保存额外请求 `PUT /aidrama/projects/{projectId}/script/content`
- 点击生成时请求 `POST /aidrama/projects/{projectId}/script/generate`
- 点击“进入设定”前请求 `POST /aidrama/projects/{projectId}/script/confirm`
- 生成内容成功显示在 generated script 区域
- mock 模式与 build 不回归

## Risks and Non-Goals

风险：

- `useEditorStore.loadDraft()` 在 HTTP 模式下只拿到 script 数据，其它区域会是默认值；这在 B3 范围内是接受的，但不能误判为 settings/storyboard 已接后端。
- 如果后端 `script/generate` 返回字段名不稳定，mapper 需要在实现时按真实响应再做一次对齐。

非目标：

- 不把 settings/storyboard/video/dubbing 数据拼接进后端 script workspace
- 不恢复 script optimize 页面入口
- 不把 confirm 合并进 saveDraft

## Success Metric

B3 完成后，script 页面在 HTTP 模式下能独立跑通真实后端文案工作区闭环，而现有 mock 模式、页面交互和前端步骤推进不回归。这为后续 B4 接 settings/storyboard 提供明确边界：继续按模块专用后端接口逐步替换，而不是回到“整份 editor draft 一次接完”的路径。
