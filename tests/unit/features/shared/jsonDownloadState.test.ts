import { describe, expect, it, vi } from 'vitest'
import { createJsonDownloadController, type JsonDownloadAnchor } from '@/features/shared/jsonDownloadState'

interface FakeAnchor extends JsonDownloadAnchor {
  id: string
}

const createFixture = (click: () => void = vi.fn()) => {
  const events: string[] = []
  const scheduled: Array<() => void> = []
  const createObjectURL = vi.fn(() => 'blob:json-download')
  const revokeObjectURL = vi.fn()
  const anchor: FakeAnchor = {
    id: 'anchor-1',
    href: '',
    download: '',
    click: () => {
      events.push('click')
      click()
    },
  }
  const controller = createJsonDownloadController({
    createObjectURL,
    revokeObjectURL,
    createAnchor: () => anchor,
    appendAnchor: () => events.push('append'),
    removeAnchor: () => events.push('remove'),
    scheduleRelease: (callback) => scheduled.push(callback),
  })

  return { anchor, controller, createObjectURL, events, revokeObjectURL, scheduled }
}

describe('jsonDownloadState', () => {
  it('downloads formatted JSON and delays URL release until the scheduled callback', async () => {
    const fixture = createFixture()

    fixture.controller.downloadJson('project.json', { projectId: 'project-1' })

    expect(fixture.anchor.href).toBe('blob:json-download')
    expect(fixture.anchor.download).toBe('project.json')
    expect(fixture.events).toEqual(['append', 'click', 'remove'])
    expect(fixture.revokeObjectURL).not.toHaveBeenCalled()
    expect(fixture.scheduled).toHaveLength(1)

    const blob = fixture.createObjectURL.mock.calls[0]?.[0]
    expect(blob).toBeInstanceOf(Blob)
    await expect(blob?.text()).resolves.toBe(JSON.stringify({ projectId: 'project-1' }, null, 2))
    expect(blob?.type).toBe('application/json;charset=utf-8')

    fixture.scheduled[0]?.()
    expect(fixture.revokeObjectURL).toHaveBeenCalledOnce()
    expect(fixture.revokeObjectURL).toHaveBeenCalledWith('blob:json-download')
  })

  it('removes the anchor after a click failure and avoids duplicate release after releaseAll', () => {
    const fixture = createFixture(() => {
      throw new Error('click failed')
    })

    expect(() => fixture.controller.downloadJson('project.json', {})).toThrow('click failed')
    expect(fixture.events).toEqual(['append', 'click', 'remove'])
    expect(fixture.scheduled).toHaveLength(1)

    fixture.controller.releaseAll()
    fixture.scheduled[0]?.()

    expect(fixture.revokeObjectURL).toHaveBeenCalledOnce()
    expect(fixture.revokeObjectURL).toHaveBeenCalledWith('blob:json-download')
  })
})
