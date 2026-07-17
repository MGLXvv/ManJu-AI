// @vitest-environment happy-dom

import { defineComponent, h, nextTick, reactive, type Component, type PropType } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import type { DubbingRoleCardModel, DubbingRoleLineDraft } from '@/types/dubbing'

const mockedModuleIds = [
  '@/components/common/AppConfirmDialog.vue',
  '@/components/editor/common/EditorModelSelect.vue',
  '@/components/editor/dubbing/DubbingRoleCard.vue',
  '@/components/editor/WorkflowStepper.vue',
  '@/components/icons/FigmaIcon.vue',
  '@/features/editor/dubbingDraftState',
  '@/services/generation',
  '@/stores/editor',
  '@/stores/project',
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

const createCards = (projectId: string): DubbingRoleCardModel[] => [
  {
    id: 'card-1',
    title: `Voice ${projectId}`,
    imageUrl: '',
    selectedVoiceId: 'voice-1',
    voiceOptions: [{ id: 'voice-1', name: 'Voice One' }],
    createdAt: '2026-07-17 00:00',
    hidden: false,
    lines: [
      {
        id: 'line-1',
        shotId: 'shot-1',
        shotLabel: 'Shot 1',
        text: `dialogue-${projectId}`,
        status: 'idle',
      },
    ],
  },
]

const emptyStub = defineComponent({ render: () => h('div') })

const modelStub = defineComponent({
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  render: () => h('div'),
})

const roleCardStub = defineComponent({
  props: {
    id: { type: String, required: true },
    title: { type: String, required: true },
    lines: { type: Array as PropType<DubbingRoleLineDraft[]>, required: true },
  },
  emits: ['generate'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-test': `generate-${props.id}`,
          'data-title': props.title,
          'data-status': props.lines[0]?.status ?? '',
          type: 'button',
          onClick: () => emit('generate', props.id),
        },
        'generate dubbing',
      )
  },
})

interface MountedDubbingStep {
  wrapper: VueWrapper
  router: ReturnType<typeof createRouter>
  generateCard: ReturnType<typeof vi.fn>
  showToast: ReturnType<typeof vi.fn>
}

const mountDubbingStep = async (): Promise<MountedDubbingStep> => {
  vi.resetModules()

  const createDraft = (projectId: string) => ({
    projectId,
    dubbing: {
      modelId: 'index-tts',
      cards: [],
    },
  })
  const draftState = reactive<{ draft: ReturnType<typeof createDraft> | null }>({
    draft: null,
  })
  const loadDraft = vi.fn(async (projectId: string) => {
    draftState.draft = createDraft(projectId)
  })
  const showToast = vi.fn()
  const generateCard = vi.fn(async (input: { card: DubbingRoleCardModel }) => ({
    lines: input.card.lines.map((line) => ({
      ...line,
      audioUrl: 'blob:generated-default',
      status: 'success' as const,
    })),
  }))
  const editorStore = {
    get draft() {
      return draftState.draft
    },
    get currentProjectId() {
      return draftState.draft?.projectId ?? ''
    },
    loadDraft,
    saveDraft: vi.fn(async () => undefined),
    updateDubbingDraft: vi.fn(),
  }

  vi.doMock('@/components/common/AppConfirmDialog.vue', () => ({ default: emptyStub }))
  vi.doMock('@/components/editor/common/EditorModelSelect.vue', () => ({ default: modelStub }))
  vi.doMock('@/components/editor/dubbing/DubbingRoleCard.vue', () => ({ default: roleCardStub }))
  vi.doMock('@/components/editor/WorkflowStepper.vue', () => ({ default: emptyStub }))
  vi.doMock('@/components/icons/FigmaIcon.vue', () => ({ default: emptyStub }))
  vi.doMock('@/features/editor/dubbingDraftState', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/features/editor/dubbingDraftState')>()),
    resolveDubbingCards: (draft: { projectId: string }) => createCards(draft.projectId),
  }))
  vi.doMock('@/services/generation', () => ({
    dubbingGenerationService: { generateCard },
  }))
  vi.doMock('@/stores/editor', () => ({ useEditorStore: () => editorStore }))
  vi.doMock('@/stores/project', () => ({
    useProjectStore: () => ({ updateProjectStep: vi.fn(async () => undefined) }),
  }))
  vi.doMock('@/stores/uiFeedback', () => ({ useUiFeedbackStore: () => ({ showToast }) }))

  const { default: DubbingStep } = await import('@/pages/editor/steps/DubbingStep.vue')
  const routeComponent = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/projects/:projectId/dubbing',
        name: 'editor-dubbing',
        component: routeComponent,
      },
      {
        path: '/projects/:projectId/complete',
        name: 'editor-complete',
        component: routeComponent,
      },
    ],
  })
  await router.push({ name: 'editor-dubbing', params: { projectId: 'project-1' } })
  await router.isReady()

  const wrapper = mount(DubbingStep as Component, {
    global: { plugins: [router] },
  })
  onTestFinished(() => {
    if (wrapper.exists()) wrapper.unmount()
  })

  await vi.waitFor(() => expect(loadDraft).toHaveBeenCalledWith('project-1'))
  await flushPromises()
  await nextTick()

  return { wrapper, router, generateCard, showToast }
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const moduleId of mockedModuleIds) vi.doUnmock(moduleId)
  vi.resetModules()
})

describe.sequential('DubbingStep async orchestration', () => {
  it('does not apply or announce an old project card-generation result', async () => {
    const mounted = await mountDubbingStep()
    const deferred = createDeferred<{ lines: DubbingRoleLineDraft[] }>()
    mounted.generateCard.mockReturnValueOnce(deferred.promise)

    await mounted.wrapper.get('[data-test="generate-card-1"]').trigger('click')
    await vi.waitFor(() =>
      expect(mounted.generateCard).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          modelId: 'index-tts',
          card: expect.objectContaining({ id: 'card-1', title: 'Voice project-1' }),
        }),
      ),
    )

    await mounted.router.push({ name: 'editor-dubbing', params: { projectId: 'project-2' } })
    await vi.waitFor(() =>
      expect(mounted.wrapper.get('[data-test="generate-card-1"]').attributes('data-title')).toBe('Voice project-2'),
    )
    deferred.resolve({
      lines: [
        {
          id: 'line-1',
          shotId: 'shot-1',
          shotLabel: 'Shot 1',
          text: 'stale dialogue',
          audioUrl: 'blob:stale-audio',
          status: 'success',
        },
      ],
    })
    await flushPromises()
    await nextTick()

    const currentCard = mounted.wrapper.get('[data-test="generate-card-1"]')
    expect(currentCard.attributes('data-title')).toBe('Voice project-2')
    expect(currentCard.attributes('data-status')).toBe('idle')
    expect(mounted.showToast).not.toHaveBeenCalled()
  })

  it('does not announce a generation failure after the component unmounts', async () => {
    const mounted = await mountDubbingStep()
    const deferred = createDeferred<{ lines: DubbingRoleLineDraft[] }>()
    mounted.generateCard.mockReturnValueOnce(deferred.promise)

    await mounted.wrapper.get('[data-test="generate-card-1"]').trigger('click')
    await vi.waitFor(() => expect(mounted.generateCard).toHaveBeenCalledOnce())
    mounted.wrapper.unmount()

    deferred.reject(new Error('unmounted generation failed'))
    await flushPromises()
    await nextTick()

    expect(mounted.showToast).not.toHaveBeenCalled()
  })
})
