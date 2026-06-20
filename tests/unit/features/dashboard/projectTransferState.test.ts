import { describe, expect, it } from 'vitest'
import { buildProjectExportFileName, parseImportedProjects } from '@/features/dashboard/projectTransferState'

describe('projectTransferState', () => {
  it('builds a safe export filename from project name', () => {
    expect(buildProjectExportFileName('测试 / Project 01')).toBe('测试-Project-01-project.json')
  })

  it('parses a single project payload', () => {
    const [project] = parseImportedProjects(
      JSON.stringify({
        name: 'Demo',
        ratio: '16:9',
        style: '国风漫画',
        status: 'in_progress',
        currentStep: 'script',
        duration: '00:45:00',
      }),
    )
    expect(project.name).toBe('Demo')
  })

  it('parses an exported project envelope payload', () => {
    const [project] = parseImportedProjects(
      JSON.stringify({
        version: 'mock-v1',
        artifact: 'project',
        projectId: 'p-1',
        exportedAt: '2026-06-06T00:00:00.000Z',
        payload: {
          id: 'p-1',
          name: 'Envelope Demo',
          ratio: '9:16',
          style: '都市短篇',
          status: 'in_progress',
          currentStep: 'script',
          updatedAt: '2026-03-12 17:16:00',
        },
      }),
    )
    expect(project.name).toBe('Envelope Demo')
  })
})
