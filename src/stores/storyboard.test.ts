import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useStoryboardStore } from './storyboard'

describe('storyboard store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('marks all target shots as generating during batch prepare', () => {
    const store = useStoryboardStore()
    const targetIds = store.shots.slice(0, 3).map((shot) => shot.id)

    store.markShotsGenerating(targetIds)

    expect(store.shots.slice(0, 3).every((shot) => shot.status === 'generating')).toBe(true)
  })

  it('allows duplicate voice assignment rows for the same character and removes only one row by id', () => {
    const store = useStoryboardStore()
    const firstShot = store.shots[0]

    store.selectShot(firstShot.id)
    const firstAssignment = store.activeShot?.voiceAssignments?.[0]
    expect(firstAssignment).toBeTruthy()

    store.addActiveShotVoiceAssignment({
      characterId: firstAssignment!.characterId,
      voice: firstAssignment!.voice,
      afterId: firstAssignment!.id,
    })

    const duplicateRows = store.activeShot!.voiceAssignments!.filter((item) => item.characterId === firstAssignment!.characterId)
    expect(duplicateRows).toHaveLength(2)

    store.removeActiveShotVoice(duplicateRows[0].id)

    const remainingRows = store.activeShot!.voiceAssignments!.filter((item) => item.characterId === firstAssignment!.characterId)
    expect(remainingRows).toHaveLength(1)
    expect(remainingRows[0].id).toBe(duplicateRows[1].id)
  })
})
