import { watch, type WatchStopHandle } from 'vue'
import type { Pinia } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useSettingAssetsStore } from '@/stores/settingAssets'
import { useStoryboardStore } from '@/stores/storyboard'

const activePiniaInstances = new WeakSet<Pinia>()

export const startEditorWorkspacePersistenceSync = (pinia: Pinia): WatchStopHandle[] => {
  if (activePiniaInstances.has(pinia)) {
    return []
  }

  activePiniaInstances.add(pinia)
  const editorStore = useEditorStore(pinia)
  const settingAssetsStore = useSettingAssetsStore(pinia)
  const storyboardStore = useStoryboardStore(pinia)

  const stopSettingSync = watch(
    () => settingAssetsStore.assets,
    (assets) => {
      if (!editorStore.currentProjectId || !editorStore.draft) {
        return
      }
      editorStore.updateSettingAssets(assets)
    },
    { deep: true },
  )

  const stopStoryboardSync = watch(
    () => storyboardStore.shots,
    (shots) => {
      if (!editorStore.currentProjectId || !editorStore.draft) {
        return
      }
      editorStore.updateStoryboardShots(shots)
    },
    { deep: true },
  )

  return [stopSettingSync, stopStoryboardSync]
}
