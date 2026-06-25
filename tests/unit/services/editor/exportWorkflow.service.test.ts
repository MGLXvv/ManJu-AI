import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('exportWorkflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('does nothing in mock mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { exportWorkflowService } = await import('@/services/editor/exportWorkflow.service')

    expect(await exportWorkflowService.loadExportWorkspace('project-1')).toBeNull()
    expect(await exportWorkflowService.createExportTask('project-1')).toBeNull()
    expect(await exportWorkflowService.getDownloadUrl('task-1')).toBe('')
    expect(http.get).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('loads export workspace in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.get).mockResolvedValue({
      data: {
        canExport: false,
        missingVideoCount: 2,
        latestTask: { id: 9, status: 'RUNNING', progress: 50 },
      },
    })

    const { exportWorkflowService } = await import('@/services/editor/exportWorkflow.service')
    const workspace = await exportWorkflowService.loadExportWorkspace('project-1')

    expect(http.get).toHaveBeenCalledWith('/aidrama/projects/project-1/exports/workspace')
    expect(workspace).toMatchObject({
      canExport: false,
      missingVideoCount: 2,
      latestTask: { id: '9', status: 'RUNNING', progress: 50 },
    })
  })

  it('creates export task in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: {
        id: 10,
        status: 'SUCCESS',
        progress: 100,
        resultUrl: '/mock-results/aidrama/tasks/10.mp4',
      },
    })

    const { exportWorkflowService } = await import('@/services/editor/exportWorkflow.service')
    const task = await exportWorkflowService.createExportTask('project-1')

    expect(http.post).toHaveBeenCalledWith('/aidrama/projects/project-1/export')
    expect(task).toMatchObject({
      id: '10',
      status: 'SUCCESS',
      progress: 100,
      resultUrl: '/mock-results/aidrama/tasks/10.mp4',
    })
  })

  it('loads download-url in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.get).mockResolvedValue({
      data: {
        downloadUrl: 'https://example.com/mock-export.mp4',
      },
    })

    const { exportWorkflowService } = await import('@/services/editor/exportWorkflow.service')
    const url = await exportWorkflowService.getDownloadUrl('task-10')

    expect(http.get).toHaveBeenCalledWith('/aidrama/exports/task-10/download-url')
    expect(url).toBe('https://example.com/mock-export.mp4')
  })
})
