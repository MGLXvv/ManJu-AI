export interface MockFailureRule {
  token: string
  scope: 'script' | 'editor-save' | 'setting-image' | 'storyboard-image' | 'video-generate' | 'dubbing-generate'
  description: string
}

export const MOCK_FAILURE_RULES: MockFailureRule[] = [
  { token: '#mock-generate-fail', scope: 'script', description: '触发剧本生成失败' },
  { token: '#mock-optimize-fail', scope: 'script', description: '触发剧本优化失败' },
  { token: '#mock-save-fail', scope: 'editor-save', description: '触发草稿保存失败' },
  { token: '#mock-image-fail', scope: 'setting-image', description: '触发设定素材生成失败' },
  { token: '#mock-shot-fail', scope: 'storyboard-image', description: '触发分镜图片生成失败' },
  { token: '#mock-video-fail', scope: 'video-generate', description: '触发视频生成失败' },
  { token: '#mock-dubbing-fail', scope: 'dubbing-generate', description: '触发配音生成失败' },
]

export const hasMockFailureToken = (input: string, token: string): boolean => input.includes(token)

export const hasAnyMockFailureToken = (inputs: string[], tokens: string[]): boolean =>
  inputs.some((input) => tokens.some((token) => hasMockFailureToken(input, token)))

export const getMockFailureRulesByScope = (scope: MockFailureRule['scope']): MockFailureRule[] =>
  MOCK_FAILURE_RULES.filter((rule) => rule.scope === scope)
