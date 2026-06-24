import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'
import { resetLocalState } from '@/api/local'

vi.mock('@/api/http', () => ({
  http: {
    put: vi.fn(),
    post: vi.fn(),
  },
}))

describe('scriptGenerationService', () => {
  beforeEach(() => {
    resetLocalState()
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('generates a script through generation tasks in mock mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { scriptGenerationService } = await import('@/services/generation/scriptGeneration.service')

    const result = await scriptGenerationService.generateScript({
      projectId: 'script-service-project',
      sourceText: 'A young hero chooses to face the final enemy alone.',
      promptText: 'Highlight emotional escalation and character growth.',
      modelId: 'gpt-4.0',
    })

    expect(result.script).toContain('第一幕')
    expect(http.put).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('optimizes a generated script through generation tasks', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { scriptGenerationService } = await import('@/services/generation/scriptGeneration.service')

    const result = await scriptGenerationService.optimizeScript({
      projectId: 'script-service-project',
      scriptText: 'Act 1: the hero falls into trouble.\nAct 2: the conflict escalates.\nAct 3: the hero completes the growth arc.',
      modelId: 'gpt-4.0',
    })

    expect(result.script).toContain('优化')
  })

  it('uses backend script generate endpoint in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.put).mockResolvedValue({ data: undefined })
    vi.mocked(http.post).mockResolvedValue({
      data: {
        script: 'generated script from backend',
      },
    })

    const { scriptGenerationService } = await import('@/services/generation/scriptGeneration.service')

    const result = await scriptGenerationService.generateScript({
      projectId: 'project-1',
      sourceText: 'source',
      promptText: 'prompt',
      modelId: 'gpt-4.0',
    })

    expect(http.put).toHaveBeenCalledWith('/aidrama/projects/project-1/script/draft', {
      rawText: 'source',
      prompt: 'prompt',
    })
    expect(http.post).toHaveBeenCalledWith('/aidrama/projects/project-1/script/generate', {
      modelId: 'gpt-4.0',
    })
    expect(result.script).toBe('generated script from backend')
  })
})
