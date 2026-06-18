import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetLocalState } from '@/api/local'
import { API_ERROR_CODES } from '@/types/api-enums'
import { useEditorStore } from './editor'
import { useGenerationStore } from './generation'
import { useStoryboardStore } from './storyboard'

describe('storyboard store', () => {
  beforeEach(() => {
    resetLocalState()
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

    const duplicateRows = store.activeShot!.voiceAssignments!.filter(
      (item) => item.characterId === firstAssignment!.characterId,
    )
    expect(duplicateRows).toHaveLength(2)

    store.removeActiveShotVoice(duplicateRows[0].id)

    const remainingRows = store.activeShot!.voiceAssignments!.filter(
      (item) => item.characterId === firstAssignment!.characterId,
    )
    expect(remainingRows).toHaveLength(1)
    expect(remainingRows[0].id).toBe(duplicateRows[1].id)
  })

  it('replaces the shot with a generated image when storyboard generation succeeds', async () => {
    const editorStore = useEditorStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-storyboard'

    const target = store.shots[0]
    await store.generateShotById(target.id)

    expect(store.shots.find((shot) => shot.id === target.id)?.status).toBe('success')
    expect(store.shots.find((shot) => shot.id === target.id)?.imageUrl).toContain('data:image/svg+xml')
  })

  it('marks the shot as failed when storyboard generation fails', async () => {
    const editorStore = useEditorStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-storyboard-fail'

    const target = store.shots[0]
    store.updateActiveShotPrompt('#mock-shot-fail')

    await expect(store.generateShotById(target.id)).rejects.toThrow('STORYBOARD_GENERATE_FAILED')
    expect(store.shots.find((shot) => shot.id === target.id)?.status).toBe('failed')
  })

  it('does not generate a locked storyboard shot', async () => {
    const editorStore = useEditorStore()
    const generationStore = useGenerationStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-storyboard-locked'

    const target = store.shots[0]
    const originalStatus = target.status
    store.toggleLock(target.id)

    await expect(store.generateShotById(target.id)).resolves.toBeUndefined()

    expect(generationStore.tasks.find((task) => task.shotId === target.id)).toBeUndefined()
    expect(store.shots.find((shot) => shot.id === target.id)?.status).toBe(originalStatus)
  })

  it('replaces the shot with a generated video when video generation succeeds', async () => {
    const editorStore = useEditorStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-video'

    const target = store.shots[0]
    await store.generateVideoById(target.id)

    expect(store.shots.find((shot) => shot.id === target.id)?.videoUrl).toContain('mock-video://')
    expect(store.shots.find((shot) => shot.id === target.id)?.status).toBe('success')
  })

  it('marks the shot as failed when video generation fails', async () => {
    const editorStore = useEditorStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-video-fail'

    const target = store.shots[0]
    store.updateActiveShot({ title: '#mock-video-fail' })

    await expect(store.generateVideoById(target.id)).rejects.toThrow(API_ERROR_CODES.videoGenerateFailed)
    expect(store.shots.find((shot) => shot.id === target.id)?.status).toBe('failed')
  })

  it('does not generate a locked storyboard video shot', async () => {
    const editorStore = useEditorStore()
    const generationStore = useGenerationStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-video-locked'

    const target = store.shots[0]
    const originalVideoUrl = target.videoUrl
    const originalStatus = target.status
    store.toggleLock(target.id)

    await expect(store.generateVideoById(target.id)).resolves.toBeUndefined()

    expect(generationStore.tasks.find((task) => task.shotId === target.id && task.type === 'video')).toBeUndefined()
    expect(store.shots.find((shot) => shot.id === target.id)?.videoUrl).toBe(originalVideoUrl)
    expect(store.shots.find((shot) => shot.id === target.id)?.status).toBe(originalStatus)
  })

  it('optimizes shot prompts in batch and keeps failed prompts unchanged', async () => {
    const editorStore = useEditorStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-storyboard-batch-optimize'

    const [firstShot, secondShot] = store.shots
    const firstPrompt = '夜晚街道霓虹灯闪烁，角色在雨中停步回头'
    const secondPrompt = '#mock-optimize-fail'

    store.selectShot(firstShot.id)
    store.updateActiveShotPrompt(firstPrompt)
    store.selectShot(secondShot.id)
    store.updateActiveShotPrompt(secondPrompt)

    await store.optimizeShotPromptsByIds([firstShot.id, secondShot.id])

    expect(store.shots.find((shot) => shot.id === firstShot.id)?.prompt).toContain('镜头')
    expect(store.shots.find((shot) => shot.id === secondShot.id)?.prompt).toBe(secondPrompt)
  })

  it('skips locked and empty prompts during batch optimization', async () => {
    const editorStore = useEditorStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-storyboard-batch-filter'

    const [firstShot, secondShot, thirdShot] = store.shots
    const firstPrompt = '雨夜车站，角色独自等待列车进站'
    const secondPrompt = '   '
    const thirdPrompt = '清晨天台逆光特写，角色转身微笑'

    store.selectShot(firstShot.id)
    store.updateActiveShotPrompt(firstPrompt)
    store.selectShot(secondShot.id)
    store.updateActiveShotPrompt(secondPrompt)
    store.selectShot(thirdShot.id)
    store.updateActiveShotPrompt(thirdPrompt)
    store.toggleLock(thirdShot.id)

    await store.optimizeShotPromptsByIds([firstShot.id, secondShot.id, thirdShot.id])

    expect(store.shots.find((shot) => shot.id === firstShot.id)?.prompt).toContain('镜头')
    expect(store.shots.find((shot) => shot.id === secondShot.id)?.prompt).toBe(secondPrompt)
    expect(store.shots.find((shot) => shot.id === thirdShot.id)?.prompt).toBe(thirdPrompt)
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

  it('replaces the shot with an upscaled image when storyboard upscale succeeds', async () => {
    const editorStore = useEditorStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-storyboard-upscale'

    const target = store.shots[0]
    const originalImageUrl = target.imageUrl

    await store.upscaleShotById(target.id)

    const updated = store.shots.find((shot) => shot.id === target.id)
    expect(updated?.status).toBe('success')
    expect(updated?.imageUrl).not.toBe(originalImageUrl)
    expect(updated?.referenceImages[0]?.sourceShotId).toBe(target.id)
  })

  it('requires an existing image before storyboard upscale', async () => {
    const store = useStoryboardStore()
    const target = store.shots[0]

    store.selectShot(target.id)
    store.updateActiveShot({ imageUrl: '' })

    await expect(store.upscaleShotById(target.id)).rejects.toThrow(API_ERROR_CODES.storyboardUpscaleImageRequired)
  })

  it('marks the shot as failed when storyboard upscale fails', async () => {
    const editorStore = useEditorStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-storyboard-upscale-fail'

    const target = store.shots[0]
    store.selectShot(target.id)
    store.updateActiveShot({ title: '#mock-upscale-fail' })

    await expect(store.upscaleShotById(target.id)).rejects.toThrow(API_ERROR_CODES.storyboardUpscaleFailed)
    expect(store.shots.find((shot) => shot.id === target.id)?.status).toBe('failed')
  })

  it('does not upscale a locked storyboard shot', async () => {
    const editorStore = useEditorStore()
    const generationStore = useGenerationStore()
    const store = useStoryboardStore()
    editorStore.currentProjectId = 'project-storyboard-upscale-locked'

    const target = store.shots[0]
    const originalImageUrl = target.imageUrl
    const originalStatus = target.status
    store.toggleLock(target.id)

    await expect(store.upscaleShotById(target.id)).resolves.toBeUndefined()

    expect(generationStore.tasks.find((task) => task.shotId === target.id && task.type === 'storyboard_upscale')).toBeUndefined()
    expect(store.shots.find((shot) => shot.id === target.id)?.imageUrl).toBe(originalImageUrl)
    expect(store.shots.find((shot) => shot.id === target.id)?.status).toBe(originalStatus)
  })
})
