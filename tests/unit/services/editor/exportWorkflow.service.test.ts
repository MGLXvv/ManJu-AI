import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/api/http', () => ({
  http: httpMock,
}))

vi.mock('@/features/capabilities/capabilityRegistry', () => ({
  canUseCapability: vi.fn(() => true),
  requireCapability: vi.fn(),
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
    expect(httpMock.get).not.toHaveBeenCalled()
    expect(httpMock.post).not.toHaveBeenCalled()
  })

  it('loads export workspace in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    httpMock.get.mockResolvedValue({
      data: {
        canExport: false,
        missingVideoCount: 2,
        latestTask: { id: 9, status: 'RUNNING', progress: 50 },
      },
    })

    const { exportWorkflowService } = await import('@/services/editor/exportWorkflow.service')
    const workspace = await exportWorkflowService.loadExportWorkspace('project-1')

    expect(httpMock.get).toHaveBeenCalledWith('/aidrama/projects/project-1/exports/workspace')
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

    httpMock.post.mockResolvedValue({
      data: {
        id: 10,
        status: 'SUCCESS',
        progress: 100,
        resultUrl: '/mock-results/aidrama/tasks/10.mp4',
      },
    })

    const { exportWorkflowService } = await import('@/services/editor/exportWorkflow.service')
    const task = await exportWorkflowService.createExportTask('project-1')

    expect(httpMock.post).toHaveBeenCalledWith('/aidrama/projects/project-1/export')
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

    httpMock.get.mockResolvedValue({
      data: {
        downloadUrl: 'https://example.com/mock-export.mp4',
      },
    })

    const { exportWorkflowService } = await import('@/services/editor/exportWorkflow.service')
    const url = await exportWorkflowService.getDownloadUrl('task-10')

    expect(httpMock.get).toHaveBeenCalledWith('/aidrama/exports/task-10/download-url')
    expect(url).toBe('https://example.com/mock-export.mp4')
  })
})
