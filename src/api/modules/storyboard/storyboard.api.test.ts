import { describe, expect, it } from 'vitest'
import { createDefaultStoryboardState, storyboardApi } from './storyboard.api'

describe('storyboard module api', () => {
  it('returns cloned default storyboard data', async () => {
    const defaults = await storyboardApi.listDefaults()
    const local = createDefaultStoryboardState()

    expect(defaults.shots).toHaveLength(local.shots.length)
    expect(defaults.tagOptions.characters[0]?.id).toBe(local.tagOptions.characters[0]?.id)

    defaults.shots[0]!.title = 'mutated'
    expect(createDefaultStoryboardState().shots[0]!.title).not.toBe('mutated')
  })

  it('generates a mock video url for the shot', async () => {
    const source = createDefaultStoryboardState().shots[0]!

    const result = await storyboardApi.generateVideo(source)

    expect(result.videoUrl.startsWith(`mock-video://${source.id}/`)).toBe(true)
    expect(result.shot.videoUrl).toBe(result.videoUrl)
    expect(result.shot.status).toBe('success')
  })
})
