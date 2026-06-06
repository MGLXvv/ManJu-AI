import { hasAnyMockFailureToken } from '@/features/shared/mockFailureState'

export interface ScriptGenerationInput {
  sourceText: string
  promptText: string
}

const excerpt = (value: string, fallback: string): string => {
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return fallback
  }

  return normalized.slice(0, 28)
}

export const canEnterStoryboard = (generatedScript: string): boolean => {
  return Boolean(generatedScript.trim())
}

export const generateMockScript = ({ sourceText, promptText }: ScriptGenerationInput): string => {
  if (hasAnyMockFailureToken([sourceText, promptText], ['#mock-generate-fail'])) {
    throw new Error('SCRIPT_GENERATE_FAILED')
  }

  const sourceSummary = excerpt(sourceText, '原始文案尚未补充完整')
  const promptSummary = excerpt(promptText, '保持现有节奏与人物设定')

  return [
    `第一幕：围绕“${sourceSummary}”建立主角当下的困境与目标，用一到两个关键情节快速交代故事起点。`,
    `第二幕：按照“${promptSummary}”的要求强化冲突升级，让角色在连续受阻中暴露关系变化与心理转折。`,
    '第三幕：在高潮抉择中完成角色成长，并保留可直接拆分为分镜的动作、情绪与台词线索。',
  ].join('\n\n')
}

export const optimizeMockScript = (generatedScript: string): string => {
  if (hasAnyMockFailureToken([generatedScript], ['#mock-optimize-fail'])) {
    throw new Error('SCRIPT_OPTIMIZE_FAILED')
  }

  const normalized = generatedScript
    .trim()
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  const baseSegments = normalized.length > 0 ? normalized : ['第一幕：补充故事起点。', '第二幕：补充冲突升级。', '第三幕：补充成长收束。']

  return baseSegments
    .map((segment, index) => {
      const labels = ['优化版·情绪推进', '优化版·冲突升级', '优化版·落点强化']
      return `${labels[index] ?? '优化版'}：${segment.replace(/^第[一二三]幕：?/, '').trim()}`
    })
    .join('\n\n')
}
