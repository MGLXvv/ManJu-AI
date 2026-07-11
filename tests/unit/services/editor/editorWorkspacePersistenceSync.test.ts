import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { resetLocalState } from '@/api/local'
import { startEditorWorkspacePersistenceSync } from '@/services/editor/editorWorkspacePersistenceSync'
import { useEditorStore } from '@/stores/editor'
import { useSettingAssetsStore } from '@/stores/settingAssets'
import { useStoryboardStore } from '@/stores/storyboard'
import { EDITOR_PERSISTENCE_PARTITIONS } from '@/types/editor'

describe('editor workspace persistence sync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetLocalState()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('synchronizes setting and storyboard stores into the editor draft boundary', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    startEditorWorkspacePersistenceSync(pinia)

    const editorStore = useEditorStore(pinia)
    const settingStore = useSettingAssetsStore(pinia)
    const storyboardStore = useStoryboardStore(pinia)

    const loadPromise = editorStore.loadDraft('project-workspace-sync')
    await vi.advanceTimersByTimeAsync(120)
    await loadPromise

    settingStore.setAssets([
      {
        id: 'asset-sync-1',
        type: 'scene',
        title: '同步场景',
        description: '场景描述',
        prompt: '场景提示词',
        imageUrls: [],
        status: 'empty',
        favorite: false,
        createdAt: '2026-07-11T12:00:00.000Z',
      },
    ])
    await nextTick()

    expect(editorStore.draft?.settingAssets[0]?.id).toBe('asset-sync-1')
    expect(editorStore.dirtyPartitions).toContain(EDITOR_PERSISTENCE_PARTITIONS.setting)

    storyboardStore.replaceShots([
      {
        id: 'shot-sync-1',
        index: 1,
        title: '镜头 1',
        imageUrl: '',
        videoUrl: '',
        prompt: '角色进入同步场景',
        videoPrompt: '',
        dialogue: '',
        durationSeconds: 10,
        voiceAssignments: [],
        attachments: [],
        characters: [],
        scenes: [],
        props: [],
        style: '国风漫画',
        ratio: '16:9',
        status: 'pending-review',
        isHidden: false,
        isLocked: false,
        storyboardReviewed: true,
        videoReviewed: false,
        createdAt: '2026-07-11T12:00:00.000Z',
        referenceImages: [],
      },
    ])
    await nextTick()

    expect(editorStore.draft?.shots[0]).toMatchObject({
      id: 'shot-sync-1',
      storyboardReviewed: true,
    })
    expect(editorStore.dirtyPartitions).toContain(EDITOR_PERSISTENCE_PARTITIONS.storyboard)
  })
})
