import { describe, expect, it } from 'vitest'
import {
  isCompleteExportDownloadCurrent,
  isCompleteExportProjectCurrent,
} from '@/features/editor/completeExportAsyncState'

describe('completeExportAsyncState', () => {
  it('accepts work for the active project', () => {
    expect(isCompleteExportProjectCurrent('project-1', 'project-1')).toBe(true)
  })

  it('rejects work after the project changes or clears', () => {
    expect(isCompleteExportProjectCurrent('project-1', 'project-2')).toBe(false)
    expect(isCompleteExportProjectCurrent('', '')).toBe(false)
  })

  it('accepts a download for the active project task', () => {
    expect(
      isCompleteExportDownloadCurrent({
        targetProjectId: 'project-1',
        currentProjectId: 'project-1',
        targetTaskId: 'task-1',
        currentTaskId: 'task-1',
      }),
    ).toBe(true)
  })

  it('rejects a download after the project or task changes', () => {
    expect(
      isCompleteExportDownloadCurrent({
        targetProjectId: 'project-1',
        currentProjectId: 'project-2',
        targetTaskId: 'task-1',
        currentTaskId: 'task-1',
      }),
    ).toBe(false)
    expect(
      isCompleteExportDownloadCurrent({
        targetProjectId: 'project-1',
        currentProjectId: 'project-1',
        targetTaskId: 'task-1',
        currentTaskId: 'task-2',
      }),
    ).toBe(false)
  })
})
