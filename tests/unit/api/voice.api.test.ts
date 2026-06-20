import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { voiceApi } from '@/api/voice.api'

describe('voice api', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('hydrates default voices', async () => {
    const voices = await voiceApi.list()

    expect(voices.length).toBeGreaterThan(0)
  })

  it('creates, updates, and removes a voice asset', async () => {
    const created = await voiceApi.create({
      name: '新音色',
      audioUrl: 'mock://voice.wav',
      duration: 12,
    })
    const updated = await voiceApi.update(created.id, {
      name: '新音色-更新',
    })
    const voices = await voiceApi.list()

    expect(updated?.name).toBe('新音色-更新')
    expect(voices.some((item) => item.id === created.id)).toBe(true)

    await voiceApi.remove(created.id)
    const afterDelete = await voiceApi.list()

    expect(afterDelete.some((item) => item.id === created.id)).toBe(false)
  })
})
