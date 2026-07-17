// @vitest-environment happy-dom

import { defineComponent, h, nextTick, reactive, type Component } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { storyboardShotsMock, storyboardTagOptions } from '@/mocks/storyboard.mock'
import type { StoryboardShot, StoryboardTagOptions } from '@/types/storyboard'

const mockedModuleIds = [
  '@/api/shared/apiMode',
  '@/features/editor/storyboardPersistState',
  '@/components/common/AppConfirmDialog.vue',
  '@/components/editor/common/BatchSelectionToolbar.vue',
  '@/components/editor/storyboard/StoryboardImageEditDialog.vue',
  '@/components/editor/storyboard/StoryboardImagePreviewDialog.vue',
  '@/components/editor/storyboard/StoryboardTimeline.vue',
  '@/components/editor/storyboard/StoryboardTopActions.vue',
  '@/components/editor/video/VideoPreviewPanel.vue',
  '@/components/editor/video/VideoPromptPanel.vue',
  '@/services/generation',
  '@/services/media',
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
    prompt: `image-prompt-${projectId}-${index + 1}`,
    videoPrompt: `video-prompt-${projectId}-${index + 1}`,
    dialogue: `dialogue-${projectId}-${index + 1}`,
    characters: shot.characters.map((tag) => ({ ...tag })),
    scenes: shot.scenes.map((tag) => ({ ...tag })),
    props: shot.props.map((tag) => ({ ...tag })),
    voiceAssignments: shot.voiceAssignments.map((assignment) => ({ ...assignment })),
    referenceImages: shot.referenceImages.map((image) => ({ ...image })),
  }))

const emptyStub = defineComponent({ render: () => h('div') })

const promptPanelStub = defineComponent({
  emits: ['optimize-video-prompt', 'optimize-dialogue'],
  setup(_props, { emit }) {
    return () =>
      h('div', [
        h(
          'button',
          {
            'data-test': 'optimize-video-prompt',
            type: 'button',
            onClick: () => emit('optimize-video-prompt'),
          },
          'optimize video prompt',
        ),
        h(
          'button',
          {
            'data-test': 'optimize-dialogue',
            type: 'button',
            onClick: () => emit('optimize-dialogue'),
          },
          'optimize dialogue',
        ),
      ])
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

interface MountedVideoStep {
  wrapper: VueWrapper
  router: ReturnType<typeof createRouter>
  optimizeVideoPrompt: ReturnType<typeof vi.fn>
  optimizeDialogue: ReturnType<typeof vi.fn>
  updateActiveShotVideoPrompt: ReturnType<typeof vi.fn>
  updateActiveShotDialogue: ReturnType<typeof vi.fn>
  showToast: ReturnType<typeof vi.fn>
  currentShot: () => StoryboardShot | null
}

const mountVideoStep = async (): Promise<MountedVideoStep> => {
  vi.resetModules()

  const storyboardState = reactive({
    shots: createShots('project-1'),
    activeShotId: 'shot-1',
    tagOptions: cloneTagOptions(),
  })
  const createDraft = (projectId: string) => ({
    projectId,
    shots: createShots(projectId),
    characters: [],
    scenes: [],
    props: [],
    settingAssets: [],
    storyboardGenerationMode: 'image' as const,
  })
  const draftState = reactive<{ draft: ReturnType<typeof createDraft> | null }>({ draft: null })
  const loadDraft = vi.fn(async (projectId: string) => {
    draftState.draft = createDraft(projectId)
  })
  const selectShot = vi.fn((shotId: string) => {
    storyboardState.activeShotId = shotId
  })
  const updateActiveShotVideoPrompt = vi.fn((value: string) => {
    const shot = storyboardState.shots.find((item) => item.id === storyboardState.activeShotId)
    if (shot) shot.videoPrompt = value
  })
  const updateActiveShotDialogue = vi.fn((value: string) => {
    const shot = storyboardState.shots.find((item) => item.id === storyboardState.activeShotId)
    if (shot) shot.dialogue = value
  })
  const replaceShots = vi.fn((shots: StoryboardShot[]) => {
    storyboardState.shots = shots.map((shot) => ({ ...shot }))
    storyboardState.activeShotId = storyboardState.shots[0]?.id ?? ''
  })
  const showToast = vi.fn()
  const optimizeVideoPrompt = vi.fn(async () => ({ value: 'optimized-video-default' }))
  const optimizeDialogue = vi.fn(async () => ({ value: 'optimized-dialogue-default' }))
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
    get tagOptions() {
      return storyboardState.tagOptions
    },
    selectShot,
    updateActiveShotVideoPrompt,
    updateActiveShotDialogue,
    replaceShots,
    setTagOptions: vi.fn((options: StoryboardTagOptions) => {
      storyboardState.tagOptions = options
    }),
    loadDefaults: asyncNoop,
    addActiveShotAttachment: syncNoop,
    addActiveShotVoiceAssignment: syncNoop,
    addTagToActiveShot: syncNoop,
    applyEditedImageToShot: asyncNoop,
    copyShot: syncNoop,
    createBlankShot: syncNoop,
    deleteShot: syncNoop,
    generateActiveVideo: asyncNoop,
    generateVideoById: asyncNoop,
    removeActiveShotAttachment: syncNoop,
    removeActiveShotVoice: syncNoop,
    toggleLock: syncNoop,
    updateActiveShotDuration: syncNoop,
    updateActiveShotVoice: syncNoop,
    uploadShotVideo: asyncNoop,
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
    '@/components/editor/storyboard/StoryboardImageEditDialog.vue',
    '@/components/editor/storyboard/StoryboardImagePreviewDialog.vue',
    '@/components/editor/storyboard/StoryboardTopActions.vue',
    '@/components/editor/video/VideoPreviewPanel.vue',
  ]) {
    vi.doMock(moduleId, () => ({ default: emptyStub }))
  }
  vi.doMock('@/components/editor/storyboard/StoryboardTimeline.vue', () => ({ default: timelineStub }))
  vi.doMock('@/components/editor/video/VideoPromptPanel.vue', () => ({ default: promptPanelStub }))
  vi.doMock('@/services/generation', () => ({
    videoPromptService: { optimizeVideoPrompt, optimizeDialogue },
  }))
  vi.doMock('@/services/media', () => ({
    mediaUploadService: { uploadFile: vi.fn() },
    mediaBlobRepository: { remove: vi.fn(async () => undefined) },
  }))
  vi.doMock('@/stores/editor', () => ({ useEditorStore: () => editorStore }))
  vi.doMock('@/stores/project', () => ({
    useProjectStore: () => ({ updateProjectStep: vi.fn(async () => undefined) }),
  }))
  vi.doMock('@/stores/storyboard', () => ({ useStoryboardStore: () => storyboardStore }))
  vi.doMock('@/stores/uiFeedback', () => ({ useUiFeedbackStore: () => ({ showToast }) }))

  const { default: VideoStep } = await import('@/pages/editor/steps/VideoStep.vue')
  const routeComponent = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/projects/:projectId/video',
        name: 'editor-video',
        component: routeComponent,
      },
      {
        path: '/projects/:projectId/dubbing',
        name: 'editor-dubbing',
        component: routeComponent,
      },
    ],
  })
  await router.push({ name: 'editor-video', params: { projectId: 'project-1' } })
  await router.isReady()

  const wrapper = mount(VideoStep as Component, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())

  await vi.waitFor(() => expect(loadDraft).toHaveBeenCalledWith('project-1'))
  await flushPromises()
  await nextTick()

  return {
    wrapper,
    router,
    optimizeVideoPrompt,
    optimizeDialogue,
    updateActiveShotVideoPrompt,
    updateActiveShotDialogue,
    showToast,
    currentShot: () => storyboardState.shots.find((shot) => shot.id === storyboardState.activeShotId) ?? null,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const moduleId of mockedModuleIds) vi.doUnmock(moduleId)
  vi.resetModules()
})

describe.sequential('VideoStep async orchestration', () => {
  it('does not apply or announce an old project video-prompt result', async () => {
    const mounted = await mountVideoStep()
    const deferred = createDeferred<{ value: string }>()
    mounted.optimizeVideoPrompt.mockReturnValueOnce(deferred.promise)

    await mounted.wrapper.get('[data-test="optimize-video-prompt"]').trigger('click')
    await vi.waitFor(() =>
      expect(mounted.optimizeVideoPrompt).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'project-1', shotId: 'shot-1' }),
      ),
    )

    await mounted.router.push({ name: 'editor-video', params: { projectId: 'project-2' } })
    await vi.waitFor(() => expect(mounted.currentShot()?.videoPrompt).toBe('video-prompt-project-2-1'))
    deferred.resolve({ value: 'stale-project-video-prompt' })
    await flushPromises()
    await nextTick()

    expect(mounted.updateActiveShotVideoPrompt).not.toHaveBeenCalledWith('stale-project-video-prompt')
    expect(mounted.currentShot()?.videoPrompt).toBe('video-prompt-project-2-1')
    expect(mounted.showToast).not.toHaveBeenCalledWith('视频提示词已优化', expect.anything())
  })

  it('does not announce a dialogue optimization failure after the active shot changes', async () => {
    const mounted = await mountVideoStep()
    const deferred = createDeferred<{ value: string }>()
    mounted.optimizeDialogue.mockReturnValueOnce(deferred.promise)

    await mounted.wrapper.get('[data-test="optimize-dialogue"]').trigger('click')
    await vi.waitFor(() => expect(mounted.optimizeDialogue).toHaveBeenCalledOnce())
    await mounted.wrapper.get('[data-test="select-shot-2"]').trigger('click')
    await vi.waitFor(() => expect(mounted.currentShot()?.id).toBe('shot-2'))

    deferred.reject(new Error('old shot dialogue failed'))
    await flushPromises()
    await nextTick()

    expect(mounted.updateActiveShotDialogue).not.toHaveBeenCalled()
    expect(mounted.currentShot()?.dialogue).toBe('dialogue-project-1-2')
    expect(mounted.showToast).not.toHaveBeenCalledWith(expect.stringContaining('失败'), expect.anything())
  })
})
