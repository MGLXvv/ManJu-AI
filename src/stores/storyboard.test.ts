import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEditorStore } from './editor'
import { useGenerationStore } from './generation'
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

  it('creates a central generation task when generating a storyboard shot', async () => {
    const editorStore = useEditorStore()
    const generationStore = useGenerationStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-storyboard'

    const target = store.shots[0]
    await store.generateShotById(target.id)

    const task = generationStore.tasks.find((item) => item.projectId === 'project-storyboard' && item.shotId === target.id)
    expect(task?.type).toBe('storyboard')
    expect(task?.status).toBe('success')
    expect(store.shots.find((shot) => shot.id === target.id)?.status).toBe('success')
  })

  it('uploads a shot image through the storyboard api boundary', async () => {
    const store = useStoryboardStore()
    const target = store.shots[0]
    const imageUrl = 'data:image/png;base64,uploaded'

    await store.uploadShotImage(target.id, imageUrl)

    const updated = store.shots.find((shot) => shot.id === target.id)
    expect(updated?.imageUrl).toBe(imageUrl)
    expect(updated?.referenceImages[0]?.label).toBe('上传图片')
  })
  it('uploads a shot video through the storyboard api boundary', async () => {
    const store = useStoryboardStore()
    const target = store.shots[0]
    const videoUrl = 'blob:mock-video-upload'

    await store.uploadShotVideo(target.id, videoUrl)

    const updated = store.shots.find((shot) => shot.id === target.id)
    expect(updated?.videoUrl).toBe(videoUrl)
  })
})


