import { http } from '@/api/http'
import { isMockMode } from '@/api/shared/apiMode'

export interface ScriptGenerationInput {
  projectId: string
  source: string
  prompt: string
  modelId?: string
}

export interface StoryboardScriptGenerationInput {
  projectId: string
  script: string
  prompt: string
  modelId?: string
}

export interface ScriptGenerationResult {
  script: string
  outline?: string
}

export interface StoryboardScriptGenerationResult {
  storyboard: string
}

interface BackendScriptGenerationDTO {
  script?: string
  content?: string
  generated?: string
  outline?: string
}

interface BackendStoryboardScriptGenerationDTO {
  storyboard?: string
  content?: string
  generated?: string
}

const splitIdeaLines = (value: string): string[] =>
  value
    .split(/\r?\n|[。！？!?]/)
    .map((line) => line.trim())
    .filter(Boolean)

const buildMockScriptFromSource = (source: string, prompt: string): string => {
  const parts = splitIdeaLines(source)
  const [
    opening = '城市夜景，霓虹闪烁',
    setup = '主角穿过街道，心绪不安',
    conflict = '一次意外让故事冲突开始升级',
    suspense = '镜头停在人物表情，留下新的悬念',
  ] = parts
  const promptHint = prompt.trim()

  return [
    '【镜头1】开场-0:00-0:05',
    '',
    `画面：${opening}`,
    '',
    `旁白：${opening}，故事在夜色里缓缓展开。`,
    '',
    '字幕：弹出标题',
    '',
    '【镜头2】铺垫-0:05-0:10',
    '',
    `画面：${setup}`,
    '',
    `旁白：${setup}，人物情绪开始被拉紧。`,
    '',
    '字幕：情绪逐渐铺开',
    '',
    '【镜头3】冲突-0:10-0:15',
    '',
    `画面：${conflict}`,
    '',
    `旁白：${conflict}，主线矛盾被正式抛出。`,
    '',
    '字幕：冲突升级',
    '',
    '【镜头4】悬念-0:15-0:20',
    '',
    `画面：${suspense}`,
    '',
    `旁白：${suspense}，为下一阶段留下继续展开的空间。`,
    '',
    `字幕：${promptHint ? `风格：${promptHint}` : '留下下一幕悬念'}`,
  ].join('\n')
}

const buildMockStoryboardFromScript = (script: string, prompt: string): string => {
  const baseLines = splitIdeaLines(script).filter((line) => !line.startsWith('【镜头'))
  const promptHint = prompt.trim()

  return Array.from({ length: 8 }, (_, index) => {
    const narration = baseLines[index % Math.max(baseLines.length, 1)] ?? '在这个不眠的城市里，故事继续推进。'
    const shotSize = ['全景', '中景', '近景'][index % 3]
    const visual =
      index % 2 === 0
        ? '城市夜景，霓虹闪烁，车流穿梭'
        : '角色穿过街道，灯牌闪动，氛围逐渐压紧'
    const camera =
      index % 2 === 0 ? '固定机位，轻微延迟效果' : '跟随机位，缓慢横移推进'

    return [
      `分镜${index + 1}/8`,
      '',
      '时长：5秒',
      '',
      `景别：${shotSize}`,
      '',
      `画面：${visual}`,
      '',
      `旁白：${narration}`,
      '',
      `机位：${camera}`,
      ...(promptHint ? ['', `补充要求：${promptHint}`] : []),
    ].join('\n')
  }).join('\n\n')
}

const resolveBackendScript = (data: BackendScriptGenerationDTO): ScriptGenerationResult => ({
  script: data.script || data.generated || data.content || '',
  outline: data.outline || '',
})

const resolveBackendStoryboard = (data: BackendStoryboardScriptGenerationDTO): StoryboardScriptGenerationResult => ({
  storyboard: data.storyboard || data.generated || data.content || '',
})

export const scriptGenerationWorkflowService = {
  async generateScript(input: ScriptGenerationInput): Promise<ScriptGenerationResult> {
    if (isMockMode) {
      return {
        script: buildMockScriptFromSource(input.source, input.prompt),
        outline: '',
      }
    }

    const { data } = await http.post<BackendScriptGenerationDTO>(
      `/aidrama/projects/${input.projectId}/script/generate`,
      {
        source: input.source,
        prompt: input.prompt,
        modelId: input.modelId,
      },
    )

    return resolveBackendScript(data)
  },

  async generateStoryboardScript(input: StoryboardScriptGenerationInput): Promise<StoryboardScriptGenerationResult> {
    if (isMockMode) {
      return {
        storyboard: buildMockStoryboardFromScript(input.script, input.prompt),
      }
    }

    const { data } = await http.post<BackendStoryboardScriptGenerationDTO>(
      `/aidrama/projects/${input.projectId}/script/storyboard/generate`,
      {
        script: input.script,
        prompt: input.prompt,
        modelId: input.modelId,
      },
    )

    return resolveBackendStoryboard(data)
  },
}
