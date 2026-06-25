import { describe, expect, it } from 'vitest'
import {
  mapBackendExportDownloadUrl,
  mapBackendExportTask,
  mapBackendExportWorkspace,
  resolveBackendExportTaskList,
} from '@/api/modules/editor/export.mapper'

describe('export.mapper', () => {
  it('maps id and errorMsg fields from backend export task', () => {
    const task = mapBackendExportTask({
      id: 12,
      status: 'SUCCESS',
      progress: 100,
      resultUrl: '/mock-results/aidrama/tasks/12.mp4',
      errorMsg: '',
    })

    expect(task).toEqual({
      id: '12',
      status: 'SUCCESS',
      progress: 100,
      resultUrl: '/mock-results/aidrama/tasks/12.mp4',
      errorMessage: '',
    })
  })

  it('falls back to exportTaskId and errorMessage fields', () => {
    const task = mapBackendExportTask({
      exportTaskId: 'task-9',
      status: 'FAILED',
      progress: null,
      resultUrl: null,
      errorMessage: 'EXPORT_FAILED',
    })

    expect(task).toEqual({
      id: 'task-9',
      status: 'FAILED',
      progress: 0,
      resultUrl: '',
      errorMessage: 'EXPORT_FAILED',
    })
  })

  it('maps export workspace and defaults missingVideoCount to 0', () => {
    const workspace = mapBackendExportWorkspace({
      canExport: true,
      latestTask: {
        id: 3,
        status: 'SUCCESS',
        progress: 100,
        resultUrl: '/mock-results/aidrama/tasks/3.mp4',
      },
      histories: [
        { id: 1, status: 'FAILED', progress: 100, errorMsg: 'EXPORT_FAILED' },
        { exportTaskId: 2, status: 'SUCCESS', progress: 100, resultUrl: '/mock-results/aidrama/tasks/2.mp4' },
      ],
    })

    expect(workspace.canExport).toBe(true)
    expect(workspace.missingVideoCount).toBe(0)
    expect(workspace.latestTask?.id).toBe('3')
    expect(workspace.tasks.map((task) => task.id)).toEqual(['1', '2'])
  })

  it('supports recentTask and exports/list fallbacks', () => {
    const tasks = resolveBackendExportTaskList({
      exports: [{ id: 4, status: 'SUCCESS', progress: 100 }],
    })
    const workspace = mapBackendExportWorkspace({
      canExport: false,
      missingVideoCount: 2,
      recentTask: { id: 5, status: 'RUNNING', progress: 40 },
      list: [{ id: 6, status: 'PENDING', progress: 0 }],
    })

    expect(tasks).toHaveLength(1)
    expect(workspace.latestTask?.id).toBe('5')
    expect(workspace.tasks.map((task) => task.id)).toEqual(['6'])
    expect(workspace.missingVideoCount).toBe(2)
  })

  it('maps object and string download-url responses', () => {
    expect(mapBackendExportDownloadUrl({ downloadUrl: 'https://example.com/a.mp4' })).toBe(
      'https://example.com/a.mp4',
    )
    expect(mapBackendExportDownloadUrl('https://example.com/b.mp4')).toBe('https://example.com/b.mp4')
    expect(mapBackendExportDownloadUrl({})).toBe('')
  })
})
