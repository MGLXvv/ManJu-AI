import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { scriptGenerationService } from './scriptGeneration.service'

describe('scriptGenerationService', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('generates a script through generation tasks', async () => {
    const result = await scriptGenerationService.generateScript({
      projectId: 'script-service-project',
      sourceText: '少年为了守护同伴，决定独自面对最终敌人。',
      promptText: '突出情绪升级与成长转折',
      modelId: 'gpt-4.0',
    })

    expect(result.script).toContain('第一幕')
  })

  it('optimizes a generated script through generation tasks', async () => {
    const result = await scriptGenerationService.optimizeScript({
      projectId: 'script-service-project',
      scriptText: '第一幕：角色陷入困境。\n\n第二幕：冲突升级。\n\n第三幕：完成成长。',
      modelId: 'gpt-4.0',
    })

    expect(result.script).toContain('优化版')
  })
})
