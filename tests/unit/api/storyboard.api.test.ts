import { describe, expect, it } from 'vitest'
import { createDefaultStoryboardState, storyboardApi } from '@/api/storyboard.api'

describe('storyboardApi', () => {
  it('returns cloned default storyboard data', async () => {
    const defaults = await storyboardApi.listDefaults()
    const local = createDefaultStoryboardState()

    expect(defaults.shots).toHaveLength(local.shots.length)
    expect(defaults.tagOptions.characters[0]?.id).toBe(local.tagOptions.characters[0]?.id)

    defaults.shots[0]!.title = 'mutated'
    expect(createDefaultStoryboardState().shots[0]!.title).not.toBe('mutated')
  })

  it('applies a reference image as the active shot image', async () => {
    const source = createDefaultStoryboardState().shots[0]!
    const referenceId = source.referenceImages[1]!.id

    const updated = await storyboardApi.applyReferenceImage(source, referenceId)

    expect(updated?.imageUrl).toBe(source.referenceImages[1]!.url)
    expect(updated?.status).toBe('success')
  })

  it('generates a mock video url for the shot', async () => {
    const source = createDefaultStoryboardState().shots[0]!

    const result = await storyboardApi.generateVideo(source)

    expect(result.videoUrl.startsWith(`mock-video://${source.id}/`)).toBe(true)
    expect(result.shot.videoUrl).toBe(result.videoUrl)
    expect(result.shot.status).toBe('success')
  })
})
