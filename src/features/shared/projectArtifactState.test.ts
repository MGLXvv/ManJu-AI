import { describe, expect, it, vi } from 'vitest'
import { buildProjectArtifactEnvelope, buildProjectArtifactFileName, sanitizeProjectArtifactId } from './projectArtifactState'

describe('projectArtifactState', () => {
  it('sanitizes artifact ids into filesystem-safe names', () => {
    expect(sanitizeProjectArtifactId(' My Project / 01 ', 'fallback')).toBe('My-Project-01')
  })

  it('builds consistent artifact filenames', () => {
    expect(buildProjectArtifactFileName('示例 项目', 'storyboard')).toBe('示例-项目-storyboard.json')
  })

  it('wraps payloads in a shared mock export envelope', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T08:00:00.000Z'))

    expect(
      buildProjectArtifactEnvelope({
        artifact: 'video',
        projectId: 'project-1',
        payload: { ok: true },
      }),
    ).toEqual({
      version: 'mock-v1',
      artifact: 'video',
      projectId: 'project-1',
      exportedAt: '2026-06-06T08:00:00.000Z',
      payload: { ok: true },
    })

    vi.useRealTimers()
  })
})
