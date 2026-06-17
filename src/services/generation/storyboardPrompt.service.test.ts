import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { API_ERROR_CODES } from '@/types/api-enums'
import { storyboardPromptService } from './storyboardPrompt.service'

describe('storyboardPromptService', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('optimizes the current shot prompt through generation tasks', async () => {
    const result = await storyboardPromptService.optimizePrompt({
      projectId: 'storyboard-prompt-project',
      shotId: 'shot-1',
      prompt: '夜晚街道霓虹灯闪烁，角色在雨中停步回头',
      mode: 'active-shot',
    })

    expect(result.prompt).toContain('镜头')
    expect(result.prompt).toContain('光影')
  })

  it('throws storyboard optimize failed when optimization task fails', async () => {
    await expect(
      storyboardPromptService.optimizePrompt({
        projectId: 'storyboard-prompt-project',
        shotId: 'shot-1',
        prompt: '#mock-optimize-fail',
        mode: 'active-shot',
      }),
    ).rejects.toThrow(API_ERROR_CODES.storyboardOptimizeFailed)
  })

  it('returns per-shot results for batch optimization with partial failures', async () => {
    const result = await storyboardPromptService.optimizePrompts({
      projectId: 'storyboard-prompt-project',
      items: [
        {
          shotId: 'shot-1',
          prompt: '夜晚街道霓虹灯闪烁，角色在雨中停步回头',
        },
        {
          shotId: 'shot-2',
          prompt: '#mock-optimize-fail',
        },
      ],
    })

    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({
      shotId: 'shot-1',
      success: true,
    })
    expect(result.items[0]?.prompt).toContain('镜头')
    expect(result.items[1]).toEqual({
      shotId: 'shot-2',
      prompt: '#mock-optimize-fail',
      success: false,
      errorMessage: API_ERROR_CODES.storyboardOptimizeFailed,
    })
  })
})
