// @vitest-environment happy-dom

import { defineComponent, h, nextTick, reactive, type Component } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'

const mockedModuleIds = [
  '@/components/common/AppConfirmDialog.vue',
  '@/components/editor/common/EditorModelSelect.vue',
  '@/components/editor/script/ScriptInputPanel.vue',
  '@/components/editor/script/ScriptPromptPanel.vue',
  '@/components/editor/script/ScriptResultPanel.vue',
  '@/components/editor/script/ScriptTemplatePopover.vue',
  '@/features/capabilities/capabilityRegistry',
  '@/services/editor/scriptGenerationWorkflow.service',
  '@/services/editor/scriptWorkflow.service',
  '@/stores/editor',
  '@/stores/project',
  '@/stores/scriptTemplates',
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

const createDraft = (projectId: string) => ({
  projectId,
  script: {
    content: `source-${projectId}`,
    outline: `outline-${projectId}`,
    prompt: `prompt-${projectId}`,
    generated: `generated-${projectId}`,
    storyboard: '',
  },
})

const modelStub = defineComponent({
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  render: () => h('div'),
})

const emptyStub = defineComponent({ render: () => h('div') })

interface MountedScriptStep {
  wrapper: VueWrapper
  router: ReturnType<typeof createRouter>
  generateScript: ReturnType<typeof vi.fn>
  saveDraft: ReturnType<typeof vi.fn>
  updateGeneratedScript: ReturnType<typeof vi.fn>
  showToast: ReturnType<typeof vi.fn>
}

const mountScriptStep = async (): Promise<MountedScriptStep> => {
  vi.resetModules()

  const generateScript = vi.fn(async () => ({ script: 'generated-result', outline: 'generated-outline' }))
  const generateStoryboardScript = vi.fn(async () => ({ storyboard: 'storyboard-result' }))
  const saveDraft = vi.fn(async () => undefined)
  const updateGeneratedScript = vi.fn()
  const showToast = vi.fn()
  const draftState = reactive<{ draft: ReturnType<typeof createDraft> | null }>({
    draft: createDraft('project-1'),
  })
  const loadDraft = vi.fn(async (projectId: string) => {
    draftState.draft = createDraft(projectId)
  })
  const editorStore = {
    get draft() {
      return draftState.draft
    },
    localSaveStatus: 'saved',
    hasUnsavedChanges: false,
    saveState: 'saved',
    loadDraft,
    saveDraft,
    updateScriptContent: vi.fn(),
    updateScriptOutline: vi.fn(),
    updateScriptPrompt: vi.fn(),
    updateGeneratedScript,
    updateStoryboardText: vi.fn(),
  }

  vi.doMock('@/components/common/AppConfirmDialog.vue', () => ({ default: emptyStub }))
  vi.doMock('@/components/editor/common/EditorModelSelect.vue', () => ({ default: modelStub }))
  vi.doMock('@/components/editor/script/ScriptInputPanel.vue', () => ({ default: modelStub }))
  vi.doMock('@/components/editor/script/ScriptResultPanel.vue', () => ({ default: modelStub }))
  vi.doMock('@/components/editor/script/ScriptTemplatePopover.vue', () => ({ default: emptyStub }))
  vi.doMock('@/components/editor/script/ScriptPromptPanel.vue', () => ({
    default: defineComponent({
      emits: ['generate'],
      setup(_props, { emit }) {
        return () =>
          h(
            'button',
            {
              'data-test': 'generate-script',
              type: 'button',
              onClick: () => emit('generate'),
            },
            'generate',
          )
      },
    }),
  }))
  vi.doMock('@/features/capabilities/capabilityRegistry', () => ({
    resolveCapability: () => ({ available: true, message: '' }),
  }))
  vi.doMock('@/services/editor/scriptGenerationWorkflow.service', () => ({
    scriptGenerationWorkflowService: { generateScript, generateStoryboardScript },
  }))
  vi.doMock('@/services/editor/scriptWorkflow.service', () => ({
    scriptWorkflowService: { confirmScript: vi.fn(async () => undefined) },
  }))
  vi.doMock('@/stores/editor', () => ({ useEditorStore: () => editorStore }))
  vi.doMock('@/stores/project', () => ({
    useProjectStore: () => ({ updateProjectStep: vi.fn(async () => undefined) }),
  }))
  vi.doMock('@/stores/scriptTemplates', () => ({
    useScriptTemplateStore: () => ({
      templates: [],
      ensureLoaded: vi.fn(),
      createTemplate: vi.fn(),
      updateTemplate: vi.fn(),
      deleteTemplate: vi.fn(),
    }),
  }))
  vi.doMock('@/stores/uiFeedback', () => ({ useUiFeedbackStore: () => ({ showToast }) }))

  const { default: ScriptStep } = await import('@/pages/editor/steps/ScriptStep.vue')
  const routeComponent = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/projects/:projectId/script',
        name: 'editor-script-input',
        component: routeComponent,
      },
      {
        path: '/projects/:projectId/script/storyboard',
        name: 'editor-script-storyboard',
        component: routeComponent,
      },
      {
        path: '/projects/:projectId/settings',
        name: 'editor-settings',
        component: routeComponent,
      },
    ],
  })
  await router.push({ name: 'editor-script-input', params: { projectId: 'project-1' } })
  await router.isReady()

  const wrapper = mount(ScriptStep as Component, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())

  await vi.waitFor(() => expect(loadDraft).toHaveBeenCalledWith('project-1'))
  await flushPromises()
  await nextTick()

  return { wrapper, router, generateScript, saveDraft, updateGeneratedScript, showToast }
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const moduleId of mockedModuleIds) vi.doUnmock(moduleId)
  vi.resetModules()
})

describe.sequential('ScriptStep async orchestration', () => {
  it('does not apply, save, or announce an old project generation result', async () => {
    const mounted = await mountScriptStep()
    const deferred = createDeferred<{ script: string; outline?: string }>()
    mounted.generateScript.mockReturnValueOnce(deferred.promise)

    await mounted.wrapper.get('[data-test="generate-script"]').trigger('click')
    await vi.waitFor(() =>
      expect(mounted.generateScript).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'project-1' })),
    )

    await mounted.router.push({ name: 'editor-script-input', params: { projectId: 'project-2' } })
    deferred.resolve({ script: 'stale-project-script', outline: 'stale-project-outline' })
    await flushPromises()
    await nextTick()

    expect(mounted.updateGeneratedScript).not.toHaveBeenCalledWith('stale-project-script')
    expect(mounted.saveDraft).not.toHaveBeenCalled()
    expect(mounted.showToast).not.toHaveBeenCalledWith('剧本生成完成', expect.anything())
  })

  it('does not announce a generation failure after the script stage changes', async () => {
    const mounted = await mountScriptStep()
    const deferred = createDeferred<{ script: string; outline?: string }>()
    mounted.generateScript.mockReturnValueOnce(deferred.promise)

    await mounted.wrapper.get('[data-test="generate-script"]').trigger('click')
    await vi.waitFor(() => expect(mounted.generateScript).toHaveBeenCalledOnce())

    await mounted.router.push({ name: 'editor-script-storyboard', params: { projectId: 'project-1' } })
    deferred.reject(new Error('old stage failed'))
    await flushPromises()
    await nextTick()

    expect(mounted.saveDraft).not.toHaveBeenCalled()
    expect(mounted.showToast).not.toHaveBeenCalledWith(expect.stringContaining('失败'), expect.anything())
  })
})
