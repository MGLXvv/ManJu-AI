import { describe, expect, it } from 'vitest'
import {
  createDefaultStoryboardState,
  storyboardApi,
} from '@/api/modules/storyboard/storyboard.api'
import { MOCK_MEDIA_VIDEO_9_16_URL } from '@/mocks/mockMedia'

describe('storyboard module api', () => {
  it('returns cloned default storyboard data', async () => {
    const defaults = await storyboardApi.listDefaults()
    const local = createDefaultStoryboardState()

    expect(defaults.shots).toHaveLength(local.shots.length)
    expect(defaults.tagOptions.characters[0]?.id).toBe(local.tagOptions.characters[0]?.id)

    defaults.shots[0]!.title = 'mutated'
    expect(createDefaultStoryboardState().shots[0]!.title).not.toBe('mutated')
  })

  it('returns default storyboard shots without manual review marks', async () => {
    const defaults = await storyboardApi.listDefaults()

    expect(defaults.shots.every((shot) => shot.storyboardReviewed === false)).toBe(true)
  })

  it('includes at least one 9:16 default storyboard shot with portrait image data', async () => {
    const defaults = await storyboardApi.listDefaults()
    const portraitShot = defaults.shots.find((shot) => shot.ratio === '9:16')

    expect(portraitShot).toBeTruthy()
    expect(decodeURIComponent(portraitShot!.imageUrl)).toContain('width="720"')
    expect(decodeURIComponent(portraitShot!.imageUrl)).toContain('height="1280"')
  })

  it('generates portrait storyboard images for 9:16 shots', async () => {
    const source = createDefaultStoryboardState().shots.find((shot) => shot.ratio === '9:16')

    expect(source).toBeTruthy()

    const result = await storyboardApi.generateShotImage(source!)

    expect(decodeURIComponent(result.imageUrl)).toContain('width="720"')
    expect(decodeURIComponent(result.imageUrl)).toContain('height="1280"')
    expect(result.shot.imageUrl).toBe(result.imageUrl)
  })

  it('generates a 9:16 mock video url for portrait shots', async () => {
    const source = createDefaultStoryboardState().shots.find((shot) => shot.ratio === '9:16')

    expect(source).toBeTruthy()

    const result = await storyboardApi.generateVideo(source!)

    expect(result.videoUrl).toBe(MOCK_MEDIA_VIDEO_9_16_URL)
    expect(result.shot.videoUrl).toBe(result.videoUrl)
    expect(result.shot.status).toBe('success')
  })
})
