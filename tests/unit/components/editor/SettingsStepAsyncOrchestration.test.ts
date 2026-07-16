// @vitest-environment happy-dom

import { defineComponent, h, nextTick, reactive, type Component } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import type { SettingAsset } from '@/types/settingAsset'

const mockedModuleIds = [
  '@/api/shared/apiMode',
  '@/components/common/AppConfirmDialog.vue',
  '@/components/editor/common/BatchSelectionToolbar.vue',
  '@/components/editor/setting/AssetGrid.vue',
  '@/components/editor/setting/AssetPreviewModal.vue',
  '@/components/editor/setting/CreateAssetModal.vue',
  '@/components/editor/setting/ResourceLibraryImportDialog.vue',
  '@/components/editor/setting/SettingTabs.vue',
  '@/components/editor/setting/SettingToolbar.vue',
  '@/services/editor/assetWorkflow.service',
  '@/services/editor/resourceLibrary.service',
  '@/stores/editor',
  '@/stores/project',
  '@/stores/settingAssets',
  '@/stores/uiFeedback',
  '@/stores/voices',
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

const createAsset = (id: string): SettingAsset => ({
  id,
  type: 'character',
  title: id,
  description: `description-${id}`,
  prompt: `prompt-${id}`,
  imageUrls: [],
  status: 'ready',
  createdAt: '2026-07-16 00:00',
})

const emptyStub = defineComponent({ render: () => h('div') })

const toolbarStub = defineComponent({
  emits: ['import-library'],
  setup(_props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-test': 'open-library',
          type: 'button',
          onClick: () => emit('import-library'),
        },
        'open library',
      )
  },
})

const resourceDialogStub = defineComponent({
  props: { open: Boolean },
  emits: ['import'],
  setup(props, { emit }) {
    return () =>
      props.open
        ? h(
            'button',
            {
              'data-test': 'import-library-asset',
              type: 'button',
              onClick: () => emit('import', 'library-asset-1'),
            },
            'import asset',
          )
        : null
  },
})

interface MountOptions {
  projectOneWorkspace?: Promise<SettingAsset[] | null>
}

interface MountedSettingsStep {
  wrapper: VueWrapper
  router: ReturnType<typeof createRouter>
  loadAssetWorkspace: ReturnType<typeof vi.fn>
  importFromLibrary: ReturnType<typeof vi.fn>
  setAssets: ReturnType<typeof vi.fn>
  updateSettingAssets: ReturnType<typeof vi.fn>
  showToast: ReturnType<typeof vi.fn>
  currentAssets: () => SettingAsset[]
}

const mountSettingsStep = async (options: MountOptions = {}): Promise<MountedSettingsStep> => {
  vi.resetModules()

  const assetState = reactive({
    assets: [createAsset('initial')],
    keyword: '',
    activeType: 'all',
  })
  const draftState = reactive<{ draft: { projectId: string; settingAssets: SettingAsset[] } | null }>({
    draft: null,
  })
  const setAssets = vi.fn((assets: SettingAsset[]) => {
    assetState.assets = assets.map((asset) => ({ ...asset, imageUrls: [...asset.imageUrls] }))
  })
  const loadDraft = vi.fn(async (projectId: string) => {
    draftState.draft = {
      projectId,
      settingAssets: [createAsset(`draft-${projectId}`)],
    }
  })
  const updateSettingAssets = vi.fn()
  const showToast = vi.fn()
  const loadAssetWorkspace = vi.fn((projectId: string): Promise<SettingAsset[] | null> => {
    if (projectId === 'project-1' && options.projectOneWorkspace) return options.projectOneWorkspace
    return Promise.resolve([createAsset(`backend-${projectId}`)])
  })
  const importFromLibrary = vi.fn(async () => [createAsset('imported-default')])
  const assetsStore = {
    get assets() {
      return assetState.assets
    },
    get keyword() {
      return assetState.keyword
    },
    get activeType() {
      return assetState.activeType
    },
    get filteredAssets() {
      return assetState.assets
    },
    get counts() {
      return { all: assetState.assets.length, character: assetState.assets.length, scene: 0, prop: 0 }
    },
    setKeyword: vi.fn((value: string) => {
      assetState.keyword = value
    }),
    setActiveType: vi.fn((value: string) => {
      assetState.activeType = value
    }),
    setAssets,
    resetAssets: vi.fn(() => {
      assetState.assets = [createAsset('fallback')]
    }),
    createAsset: vi.fn(),
    updateAsset: vi.fn(),
    deleteAsset: vi.fn(),
    toggleFavorite: vi.fn(),
    setFavoriteForAssets: vi.fn(),
    uploadAssetImage: vi.fn(),
    selectCandidateImage: vi.fn(),
    generateAssetImage: vi.fn(),
  }
  const editorStore = {
    get draft() {
      return draftState.draft
    },
    loadDraft,
    updateSettingAssets,
    updateStoryboardGenerationMode: vi.fn(),
    saveDraft: vi.fn(async () => undefined),
  }

  vi.doMock('@/api/shared/apiMode', () => ({ apiMode: 'http' }))
  vi.doMock('@/components/common/AppConfirmDialog.vue', () => ({ default: emptyStub }))
  vi.doMock('@/components/editor/common/BatchSelectionToolbar.vue', () => ({ default: emptyStub }))
  vi.doMock('@/components/editor/setting/AssetGrid.vue', () => ({ default: emptyStub }))
  vi.doMock('@/components/editor/setting/AssetPreviewModal.vue', () => ({ default: emptyStub }))
  vi.doMock('@/components/editor/setting/CreateAssetModal.vue', () => ({ default: emptyStub }))
  vi.doMock('@/components/editor/setting/ResourceLibraryImportDialog.vue', () => ({ default: resourceDialogStub }))
  vi.doMock('@/components/editor/setting/SettingTabs.vue', () => ({ default: emptyStub }))
  vi.doMock('@/components/editor/setting/SettingToolbar.vue', () => ({ default: toolbarStub }))
  vi.doMock('@/services/editor/assetWorkflow.service', () => ({
    assetWorkflowService: {
      loadAssetWorkspace,
      syncAssets: vi.fn(async () => null),
    },
  }))
  vi.doMock('@/services/editor/resourceLibrary.service', () => ({
    resourceLibraryService: {
      listLibraryItems: vi.fn(async () => ({ items: [createAsset('library-asset-1')], total: 1 })),
      importFromLibrary,
    },
  }))
  vi.doMock('@/stores/editor', () => ({ useEditorStore: () => editorStore }))
  vi.doMock('@/stores/project', () => ({
    useProjectStore: () => ({ updateProjectStep: vi.fn(async () => undefined) }),
  }))
  vi.doMock('@/stores/settingAssets', () => ({
    createDefaultSettingAssets: () => [createAsset('fallback')],
    useSettingAssetsStore: () => assetsStore,
  }))
  vi.doMock('@/stores/uiFeedback', () => ({ useUiFeedbackStore: () => ({ showToast }) }))
  vi.doMock('@/stores/voices', () => ({
    useVoicesStore: () => ({ voices: [], hydrate: vi.fn(async () => undefined) }),
  }))

  const { default: SettingsStep } = await import('@/pages/editor/steps/SettingsStep.vue')
  const routeComponent = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/projects/:projectId/settings',
        name: 'editor-settings',
        component: routeComponent,
      },
      {
        path: '/projects/:projectId/storyboard',
        name: 'editor-storyboard',
        component: routeComponent,
      },
    ],
  })
  await router.push({ name: 'editor-settings', params: { projectId: 'project-1' } })
  await router.isReady()

  const wrapper = mount(SettingsStep as Component, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())

  await vi.waitFor(() => expect(loadDraft).toHaveBeenCalledWith('project-1'))
  await flushPromises()
  await nextTick()

  return {
    wrapper,
    router,
    loadAssetWorkspace,
    importFromLibrary,
    setAssets,
    updateSettingAssets,
    showToast,
    currentAssets: () => assetState.assets,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const moduleId of mockedModuleIds) vi.doUnmock(moduleId)
  vi.resetModules()
})

describe.sequential('SettingsStep async orchestration', () => {
  it('does not replace the new project assets with an old workspace result', async () => {
    const oldWorkspace = createDeferred<SettingAsset[] | null>()
    const mounted = await mountSettingsStep({ projectOneWorkspace: oldWorkspace.promise })

    await mounted.router.push({ name: 'editor-settings', params: { projectId: 'project-2' } })
    await vi.waitFor(() => expect(mounted.loadAssetWorkspace).toHaveBeenCalledWith('project-2'))
    await vi.waitFor(() => expect(mounted.currentAssets().map(({ id }) => id)).toEqual(['backend-project-2']))

    oldWorkspace.resolve([createAsset('stale-project-1-workspace')])
    await flushPromises()
    await nextTick()

    expect(mounted.currentAssets().map(({ id }) => id)).toEqual(['backend-project-2'])
    expect(mounted.setAssets).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'stale-project-1-workspace' })]),
    )
  })

  it('does not apply or announce an old project resource import', async () => {
    const mounted = await mountSettingsStep()
    const oldImport = createDeferred<SettingAsset[] | null>()
    mounted.importFromLibrary.mockReturnValueOnce(oldImport.promise)

    await mounted.wrapper.get('[data-test="open-library"]').trigger('click')
    await flushPromises()
    await mounted.wrapper.get('[data-test="import-library-asset"]').trigger('click')
    await vi.waitFor(() => expect(mounted.importFromLibrary).toHaveBeenCalledWith('project-1', ['library-asset-1']))

    await mounted.router.push({ name: 'editor-settings', params: { projectId: 'project-2' } })
    await vi.waitFor(() => expect(mounted.loadAssetWorkspace).toHaveBeenCalledWith('project-2'))
    oldImport.resolve([createAsset('stale-imported-asset')])
    await flushPromises()
    await nextTick()

    expect(mounted.currentAssets().map(({ id }) => id)).toEqual(['backend-project-2'])
    expect(mounted.updateSettingAssets).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'stale-imported-asset' })]),
    )
    expect(mounted.showToast).not.toHaveBeenCalledWith('已从资源库导入', expect.anything())
    expect(mounted.wrapper.find('[data-test="import-library-asset"]').exists()).toBe(true)
  })
})
