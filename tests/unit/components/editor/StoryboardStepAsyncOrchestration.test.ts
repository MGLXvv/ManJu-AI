// @vitest-environment happy-dom

import { defineComponent, h, nextTick, reactive, type Component } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { storyboardShotsMock, storyboardStylesMock, storyboardTagOptions } from '@/mocks/storyboard.mock'
import type { StoryboardShot, StoryboardTagOptions } from '@/types/storyboard'

const mockedModuleIds = [
  '@/api/shared/apiMode',
  '@/features/editor/storyboardPersistState',
  '@/components/common/AppConfirmDialog.vue',
  '@/components/editor/common/BatchSelectionToolbar.vue',
  '@/components/editor/storyboard/StoryboardBatchGenerateDialog.vue',
  '@/components/editor/storyboard/StoryboardImageEditDialog.vue',
  '@/components/editor/storyboard/StoryboardImagePreviewDialog.vue',
  '@/components/editor/storyboard/StoryboardPreviewPanel.vue',
  '@/components/editor/storyboard/StoryboardPromptPanel.vue',
  '@/components/editor/storyboard/StoryboardReferenceRail.vue',
  '@/components/editor/storyboard/StoryboardTimeline.vue',
  '@/components/editor/storyboard/StoryboardTopActions.vue',
  '@/services/editor/storyboardWorkflow.service',
  '@/services/generation',
  '@/stores/editor',
  '@/stores/project',
  '@/stores/storyboard',
  '@/stores/uiFeedback',
]

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const cloneTagOptions = (): StoryboardTagOptions => ({
  characters: storyboardTagOptions.characters.map((tag) => ({ ...tag })),
  scenes: storyboardTagOptions.scenes.map((tag) => ({ ...tag })),
  props: storyboardTagOptions.props.map((tag) => ({ ...tag })),
})

const createShots = (projectId: string): StoryboardShot[] =>
  storyboardShotsMock.slice(0, 2).map((shot, index) => ({
    ...shot,
    id: `shot-${index + 1}`,
    prompt: `prompt-${projectId}-${index + 1}`,
    characters: shot.characters.map((tag) => ({ ...tag })),
    scenes: shot.scenes.map((tag) => ({ ...tag })),
    props: shot.props.map((tag) => ({ ...tag })),
    voiceAssignments: shot.voiceAssignments.map((assignment) => ({ ...assignment })),
    referenceImages: shot.referenceImages.map((image) => ({ ...image })),
  }))

const emptyStub = defineComponent({ render: () => h('div') })

const promptPanelStub = defineComponent({
  emits: ['optimize-prompt'],
  setup(_props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-test': 'optimize-active-prompt',
          type: 'button',
          onClick: () => emit('optimize-prompt'),
        },
        'optimize',
      )
  },
})

const timelineStub = defineComponent({
  emits: ['select'],
  setup(_props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-test': 'select-shot-2',
          type: 'button',
          onClick: () => emit('select', 'shot-2'),
        },
        'select shot 2',
      )
  },
})

interface MountedStoryboardStep {
  wrapper: VueWrapper
  router: ReturnType<typeof createRouter>
  optimizePrompt: ReturnType<typeof vi.fn>
  updateActiveShotPrompt: ReturnType<typeof vi.fn>
  showToast: ReturnType<typeof vi.fn>
  currentShot: () => StoryboardShot | null
}

const mountStoryboardStep = async (): Promise<MountedStoryboardStep> => {
  vi.resetModules()

  const storyboardState = reactive({
    shots: createShots('project-1'),
    activeShotId: 'shot-1',
    tagOptions: cloneTagOptions(),
  })
  const draftState = reactive<{ draft: ReturnType<typeof createDraft> | null }>({ draft: null })
  const createDraft = (projectId: string) => ({
    projectId,
    shots: createShots(projectId),
    characters: [],
    scenes: [],
    props: [],
    settingAssets: [],
    storyboardGenerationMode: 'image' as const,
  })
  const loadDraft = vi.fn(async (projectId: string) => {
    draftState.draft = createDraft(projectId)
  })
  const selectShot = vi.fn((shotId: string) => {
    storyboardState.activeShotId = shotId
  })
  const updateActiveShotPrompt = vi.fn((prompt: string) => {
    const shot = storyboardState.shots.find((item) => item.id === storyboardState.activeShotId)
    if (shot) shot.prompt = prompt
  })
  const replaceShots = vi.fn((shots: StoryboardShot[]) => {
    storyboardState.shots = shots.map((shot) => ({ ...shot }))
    storyboardState.activeShotId = storyboardState.shots[0]?.id ?? ''
  })
  const showToast = vi.fn()
  const optimizePrompt = vi.fn(async () => ({ prompt: 'optimized-default' }))
  const asyncNoop = vi.fn(async () => undefined)
  const syncNoop = vi.fn()
  const storyboardStore = {
    get shots() {
      return storyboardState.shots
    },
    get activeShotId() {
      return storyboardState.activeShotId
    },
    get activeShot() {
      return storyboardState.shots.find((shot) => shot.id === storyboardState.activeShotId) ?? null
    },
    get referenceImages() {
      return []
    },
    get tagOptions() {
      return storyboardState.tagOptions
    },
    get styleOptions() {
      return storyboardStylesMock
    },
    selectShot,
    updateActiveShotPrompt,
    replaceShots,
    setTagOptions: vi.fn((options: StoryboardTagOptions) => {
      storyboardState.tagOptions = options
    }),
    loadDefaults: asyncNoop,
    addTagToActiveShot: syncNoop,
    applyEditedImageToShot: asyncNoop,
    applyReferenceImageToShot: asyncNoop,
    copyShot: syncNoop,
    createBlankShot: syncNoop,
    deleteShot: syncNoop,
    generateActiveShot: asyncNoop,
    generateShotById: asyncNoop,
    insertBlankShotAfter: syncNoop,
    markShotsGenerating: syncNoop,
    moveShot: syncNoop,
    removeTagFromActiveShot: syncNoop,
    toggleHidden: syncNoop,
    toggleLock: syncNoop,
    toggleStoryboardReviewed: syncNoop,
    updateActiveShotRatio: syncNoop,
    updateActiveShotStyle: syncNoop,
    uploadShotImage: asyncNoop,
    upscaleShotById: asyncNoop,
  }
  const editorStore = {
    get draft() {
      return draftState.draft
    },
    loadDraft,
    saveDraft: asyncNoop,
    updateStoryboardShots: syncNoop,
  }

  vi.doMock('@/api/shared/apiMode', () => ({ apiMode: 'http' }))
  vi.doMock('@/features/editor/storyboardPersistState', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/features/editor/storyboardPersistState')>()),
    resolveStoryboardShots: (shots: StoryboardShot[]) => shots,
  }))
  for (const moduleId of [
    '@/components/common/AppConfirmDialog.vue',
    '@/components/editor/common/BatchSelectionToolbar.vue',
    '@/components/editor/storyboard/StoryboardBatchGenerateDialog.vue',
    '@/components/editor/storyboard/StoryboardImageEditDialog.vue',
    '@/components/editor/storyboard/StoryboardImagePreviewDialog.vue',
    '@/components/editor/storyboard/StoryboardPreviewPanel.vue',
    '@/components/editor/storyboard/StoryboardReferenceRail.vue',
    '@/components/editor/storyboard/StoryboardTopActions.vue',
  ]) {
    vi.doMock(moduleId, () => ({ default: emptyStub }))
  }
  vi.doMock('@/components/editor/storyboard/StoryboardPromptPanel.vue', () => ({ default: promptPanelStub }))
  vi.doMock('@/components/editor/storyboard/StoryboardTimeline.vue', () => ({ default: timelineStub }))
  vi.doMock('@/services/editor/storyboardWorkflow.service', () => ({
    storyboardWorkflowService: {
      generateStoryboard: vi.fn(async () => []),
      persistStoryboard: vi.fn(async () => undefined),
    },
  }))
  vi.doMock('@/services/generation', () => ({ storyboardPromptService: { optimizePrompt } }))
  vi.doMock('@/stores/editor', () => ({ useEditorStore: () => editorStore }))
  vi.doMock('@/stores/project', () => ({
    useProjectStore: () => ({ updateProjectStep: vi.fn(async () => undefined) }),
  }))
  vi.doMock('@/stores/storyboard', () => ({ useStoryboardStore: () => storyboardStore }))
  vi.doMock('@/stores/uiFeedback', () => ({ useUiFeedbackStore: () => ({ showToast }) }))

  const { default: StoryboardStep } = await import('@/pages/editor/steps/StoryboardStep.vue')
  const routeComponent = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/projects/:projectId/storyboard',
        name: 'editor-storyboard',
        component: routeComponent,
      },
      {
        path: '/projects/:projectId/video',
        name: 'editor-video',
        component: routeComponent,
      },
    ],
  })
  await router.push({ name: 'editor-storyboard', params: { projectId: 'project-1' } })
  await router.isReady()

  const wrapper = mount(StoryboardStep as Component, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())

  await vi.waitFor(() => expect(loadDraft).toHaveBeenCalledWith('project-1'))
  await flushPromises()
  await nextTick()

  return {
    wrapper,
    router,
    optimizePrompt,
    updateActiveShotPrompt,
    showToast,
    currentShot: () => storyboardState.shots.find((shot) => shot.id === storyboardState.activeShotId) ?? null,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const moduleId of mockedModuleIds) vi.doUnmock(moduleId)
  vi.resetModules()
})

describe.sequential('StoryboardStep async orchestration', () => {
  it('does not apply or announce an old project prompt optimization result', async () => {
    const mounted = await mountStoryboardStep()
    const deferred = createDeferred<{ prompt: string }>()
    mounted.optimizePrompt.mockReturnValueOnce(deferred.promise)

    await mounted.wrapper.get('[data-test="optimize-active-prompt"]').trigger('click')
    await vi.waitFor(() =>
      expect(mounted.optimizePrompt).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'project-1', shotId: 'shot-1', mode: 'active-shot' }),
      ),
    )

    await mounted.router.push({ name: 'editor-storyboard', params: { projectId: 'project-2' } })
    await vi.waitFor(() => expect(mounted.currentShot()?.prompt).toBe('prompt-project-2-1'))
    deferred.resolve({ prompt: 'stale-project-prompt' })
    await flushPromises()
    await nextTick()

    expect(mounted.updateActiveShotPrompt).not.toHaveBeenCalledWith('stale-project-prompt')
    expect(mounted.currentShot()?.prompt).toBe('prompt-project-2-1')
    expect(mounted.showToast).not.toHaveBeenCalledWith('画面描述已完成 AI 优化', expect.anything())
  })

  it('does not announce an optimization failure after the active shot changes', async () => {
    const mounted = await mountStoryboardStep()
    const deferred = createDeferred<{ prompt: string }>()
    mounted.optimizePrompt.mockReturnValueOnce(deferred.promise)

    await mounted.wrapper.get('[data-test="optimize-active-prompt"]').trigger('click')
    await vi.waitFor(() => expect(mounted.optimizePrompt).toHaveBeenCalledOnce())
    await mounted.wrapper.get('[data-test="select-shot-2"]').trigger('click')
    await vi.waitFor(() => expect(mounted.currentShot()?.id).toBe('shot-2'))

    deferred.reject(new Error('old shot failed'))
    await flushPromises()
    await nextTick()

    expect(mounted.currentShot()?.prompt).toBe('prompt-project-1-2')
    expect(mounted.showToast).not.toHaveBeenCalledWith(expect.stringContaining('失败'), expect.anything())
  })
})
