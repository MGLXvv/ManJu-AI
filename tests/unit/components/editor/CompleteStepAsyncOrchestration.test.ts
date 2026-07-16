// @vitest-environment happy-dom

import { defineComponent, h, nextTick, type Component } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'

const mockedModuleIds = [
  '@/api/shared/apiMode',
  '@/components/editor/WorkflowStepper.vue',
  '@/services/editor/exportWorkflow.service',
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

const createWorkspace = (projectId: string) => {
  const task = {
    id: `task-${projectId}`,
    status: 'SUCCESS',
    progress: 100,
    resultUrl: '',
    errorMessage: '',
  }
  return {
    canExport: true,
    missingVideoCount: 0,
    latestTask: task,
    tasks: [task],
  }
}

const findButton = (wrapper: VueWrapper, label: string) => {
  const button = wrapper.findAll('button').find((candidate) => candidate.text().includes(label))
  if (!button) throw new Error(`Button not found: ${label}`)
  return button
}

interface MountedCompleteStep {
  wrapper: VueWrapper
  router: ReturnType<typeof createRouter>
  loadExportWorkspace: ReturnType<typeof vi.fn>
  createExportTask: ReturnType<typeof vi.fn>
  getDownloadUrl: ReturnType<typeof vi.fn>
  showToast: ReturnType<typeof vi.fn>
  windowOpen: ReturnType<typeof vi.fn>
}

const mountCompleteStep = async (): Promise<MountedCompleteStep> => {
  vi.resetModules()

  const loadExportWorkspace = vi.fn(async (projectId: string) => createWorkspace(projectId))
  const createExportTask = vi.fn(async () => null)
  const getDownloadUrl = vi.fn(async () => '')
  const showToast = vi.fn()
  const windowOpen = vi.fn()
  const editorStore = {
    draft: null,
    loadDraft: vi.fn(async () => undefined),
  }
  const projectStore = {
    initialized: true,
    projects: [
      { id: 'project-1', name: '项目一', status: 'completed' },
      { id: 'project-2', name: '项目二', status: 'completed' },
    ],
    bootstrap: vi.fn(async () => undefined),
    updateProjectStep: vi.fn(async () => undefined),
    toggleProjectStatus: vi.fn(async () => undefined),
  }

  vi.doMock('@/api/shared/apiMode', () => ({ apiMode: 'http' }))
  vi.doMock('@/components/editor/WorkflowStepper.vue', () => ({
    default: defineComponent({ render: () => h('nav', 'workflow') }),
  }))
  vi.doMock('@/services/editor/exportWorkflow.service', () => ({
    exportWorkflowService: {
      loadExportWorkspace,
      createExportTask,
      getDownloadUrl,
    },
  }))
  vi.doMock('@/stores/editor', () => ({ useEditorStore: () => editorStore }))
  vi.doMock('@/stores/project', () => ({ useProjectStore: () => projectStore }))
  vi.doMock('@/stores/uiFeedback', () => ({ useUiFeedbackStore: () => ({ showToast }) }))
  vi.spyOn(window, 'open').mockImplementation(windowOpen)

  const { default: CompleteStep } = await import('@/pages/editor/steps/CompleteStep.vue')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/projects', name: 'projects', component: { render: () => null } },
      {
        path: '/projects/:projectId/complete',
        name: 'editor-complete',
        component: { render: () => null },
      },
    ],
  })
  await router.push({ name: 'editor-complete', params: { projectId: 'project-1' } })
  await router.isReady()

  const wrapper = mount(CompleteStep as Component, {
    global: {
      plugins: [router],
    },
  })
  onTestFinished(() => wrapper.unmount())

  await vi.waitFor(() => expect(loadExportWorkspace).toHaveBeenCalledWith('project-1'))
  await flushPromises()
  await nextTick()

  return {
    wrapper,
    router,
    loadExportWorkspace,
    createExportTask,
    getDownloadUrl,
    showToast,
    windowOpen,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const moduleId of mockedModuleIds) vi.doUnmock(moduleId)
  vi.resetModules()
})

describe.sequential('CompleteStep async orchestration', () => {
  it('does not refresh or announce an old project export after the route changes', async () => {
    const mounted = await mountCompleteStep()
    const deferred = createDeferred<null>()
    mounted.createExportTask.mockReturnValueOnce(deferred.promise)

    await findButton(mounted.wrapper, '创建导出任务').trigger('click')
    await vi.waitFor(() => expect(mounted.createExportTask).toHaveBeenCalledWith('project-1'))

    await mounted.router.push({ name: 'editor-complete', params: { projectId: 'project-2' } })
    await vi.waitFor(() => expect(mounted.loadExportWorkspace).toHaveBeenCalledWith('project-2'))
    deferred.resolve(null)
    await flushPromises()
    await nextTick()

    expect(mounted.loadExportWorkspace.mock.calls.filter(([projectId]) => projectId === 'project-2')).toHaveLength(1)
    expect(mounted.showToast).not.toHaveBeenCalledWith('Mock 导出任务已创建', expect.anything())
  })

  it('does not open or announce an old task download after the route changes', async () => {
    const mounted = await mountCompleteStep()
    const deferred = createDeferred<string>()
    mounted.getDownloadUrl.mockReturnValueOnce(deferred.promise)

    await findButton(mounted.wrapper, '获取 Mock 下载地址').trigger('click')
    await vi.waitFor(() => expect(mounted.getDownloadUrl).toHaveBeenCalledWith('task-project-1'))

    await mounted.router.push({ name: 'editor-complete', params: { projectId: 'project-2' } })
    await vi.waitFor(() => expect(mounted.loadExportWorkspace).toHaveBeenCalledWith('project-2'))
    deferred.resolve('https://example.com/old-export.zip')
    await flushPromises()
    await nextTick()

    expect(mounted.windowOpen).not.toHaveBeenCalled()
    expect(mounted.showToast).not.toHaveBeenCalledWith(expect.stringContaining('下载地址'), expect.anything())
  })
})
