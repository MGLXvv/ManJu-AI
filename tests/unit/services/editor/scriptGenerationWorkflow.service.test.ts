import { describe, expect, it } from 'vitest'
import {
  mapBackendScriptGeneration,
  mapBackendStoryboardGeneration,
  scriptGenerationWorkflowService,
} from '@/services/editor/scriptGenerationWorkflow.service'
import { API_ERROR_CODES } from '@/types/api-enums'

describe('scriptGenerationWorkflowService', () => {
  it('maps supported backend response aliases', () => {
    expect(mapBackendScriptGeneration({ generated: 'generated script', outline: 'outline' })).toEqual({
      script: 'generated script',
      outline: 'outline',
    })
    expect(mapBackendStoryboardGeneration({ content: 'storyboard content' })).toEqual({
      storyboard: 'storyboard content',
    })
  })

  it('rejects empty backend generation responses', () => {
    expect(() => mapBackendScriptGeneration({})).toThrow(
      expect.objectContaining({ code: API_ERROR_CODES.scriptGenerateFailed }),
    )
    expect(() => mapBackendStoryboardGeneration({})).toThrow(
      expect.objectContaining({ code: API_ERROR_CODES.storyboardGenerateFailed }),
    )
  })

  it('rejects blank generation inputs before sending a request', async () => {
    await expect(
      scriptGenerationWorkflowService.generateScript({
        projectId: 'project-1',
        source: '   ',
        prompt: '',
      }),
    ).rejects.toHaveProperty('code', API_ERROR_CODES.scriptGenerateFailed)

    await expect(
      scriptGenerationWorkflowService.generateStoryboardScript({
        projectId: 'project-1',
        script: '\n',
        prompt: '',
      }),
    ).rejects.toHaveProperty('code', API_ERROR_CODES.storyboardGenerateFailed)
  })
})
