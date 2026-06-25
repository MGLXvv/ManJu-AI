import { describe, expect, it } from 'vitest'
import { mapBackendAiTask } from '@/api/modules/editor/aiTask.mapper'

describe('aiTask.mapper', () => {
  it('prefers taskId when present', () => {
    const task = mapBackendAiTask({
      id: 1,
      taskId: 9,
      status: 'SUCCESS',
      progress: 100,
      providerTaskId: 'provider-1',
      resultUrl: '/mock-results/task-9.png',
      errorMsg: '',
    })

    expect(task).toEqual({
      id: '9',
      status: 'SUCCESS',
      progress: 100,
      providerTaskId: 'provider-1',
      resultUrl: '/mock-results/task-9.png',
      errorMessage: '',
    })
  })

  it('falls back to id and default values', () => {
    const task = mapBackendAiTask({
      id: 3,
    })

    expect(task).toEqual({
      id: '3',
      status: 'PENDING',
      progress: 0,
      providerTaskId: '',
      resultUrl: '',
      errorMessage: '',
    })
  })
})
