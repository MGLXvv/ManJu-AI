import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { GENERATION_TASK_STATUSES } from '@/types/api-enums'
import { createAndWaitGenerationTask } from './generationTaskRunner'

describe('generationTaskRunner', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('creates a script generation task and waits for its success result', async () => {
    const task = await createAndWaitGenerationTask(
      {
        projectId: 'runner-project',
        type: 'script',
        payload: {
          sourceText: '主角被迫参加最后一场试炼。',
          promptText: '整理成三幕结构',
          modelId: 'gpt-4.0',
        },
      },
      {
        interval: 10,
        timeout: 1000,
      },
    )

    expect(task.status).toBe(GENERATION_TASK_STATUSES.success)
    expect(task.result).toMatchObject({
      script: expect.any(String),
    })
  })
})
