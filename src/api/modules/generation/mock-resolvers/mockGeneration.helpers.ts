import { API_ERROR_CODES } from '@/types/api-enums'
import type { SettingAsset } from '@/api/modules/setting/setting.types'
import type { StoryboardReferenceImage, StoryboardShot } from '@/api/modules/storyboard/storyboard.types'
import { MOCK_MEDIA_IMAGE_URL } from '@/mocks/mockMedia'
import type { StoryboardImageEditRecord } from '@/types/storyboard'

const hasFailureToken = (values: string[], tokens: string[]): boolean =>
  values.some((value) => tokens.some((token) => value.includes(token)))

const excerpt = (value: string, fallback: string): string => {
  const normalized = value.trim().replace(/\s+/g, ' ')
  return normalized ? normalized.slice(0, 28) : fallback
}

export const generateMockScript = (sourceText: string, promptText: string): string => {
  if (hasFailureToken([sourceText, promptText], ['#mock-generate-fail'])) {
    throw new Error(API_ERROR_CODES.scriptGenerateFailed)
  }

  const sourceSummary = excerpt(sourceText, '原始文案尚未补充完整')
  const promptSummary = excerpt(promptText, '保持现有节奏与人物设定')

  return [
    `第一幕：围绕“${sourceSummary}”建立主角当下的困境与目标，用一到两个关键情节快速交代故事起点。`,
    `第二幕：按照“${promptSummary}”的要求强化冲突升级，让角色在连续受阻中暴露关系变化与心理转折。`,
    '第三幕：在高潮抉择中完成角色成长，并保留可直接拆分为分镜的动作、情绪与台词线索。',
  ].join('\n\n')
}

export const optimizeMockScript = (scriptText: string): string => {
  if (hasFailureToken([scriptText], ['#mock-optimize-fail'])) {
    throw new Error(API_ERROR_CODES.scriptOptimizeFailed)
  }

  const normalized = scriptText
    .trim()
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean)
  const segments = normalized.length
    ? normalized
    : ['第一幕：补充故事起点。', '第二幕：补充冲突升级。', '第三幕：补充成长收束。']
  const labels = ['优化版·情绪推进', '优化版·冲突升级', '优化版·落点强化']

  return segments
    .map((segment, index) => `${labels[index] ?? '优化版'}：${segment.replace(/^第[一二三]幕：?/, '').trim()}`)
    .join('\n\n')
}

export const shouldFailStoryboardGeneration = (title: string, prompt: string): boolean =>
  hasFailureToken([title, prompt], ['#mock-shot-fail'])

export const optimizeMockStoryboardPrompt = (prompt: string): string => {
  if (hasFailureToken([prompt], ['#mock-optimize-fail'])) {
    throw new Error(API_ERROR_CODES.storyboardOptimizeFailed)
  }

  const normalized = prompt.trim().replace(/\s+/g, ' ')
  if (!normalized) return ''

  const withLens = normalized.includes('镜头') ? normalized : `增加镜头调度与主体层次，${normalized}`
  const withLight = withLens.includes('光') ? withLens : `${withLens}，补充环境光影与景深关系`
  return withLight.includes('情绪') ? withLight : `${withLight}，强化角色情绪与动作指向`
}

const cloneStoryboardShot = (shot: StoryboardShot): StoryboardShot => ({
  ...shot,
  characters: shot.characters.map((item) => ({ ...item })),
  scenes: shot.scenes.map((item) => ({ ...item })),
  props: shot.props.map((item) => ({ ...item })),
  referenceImages: shot.referenceImages.map((item) => ({ ...item })),
  editHistory:
    shot.editHistory?.map<StoryboardImageEditRecord>((item) => ({
      ...item,
      selection: { ...item.selection },
    })) ?? [],
  voiceAssignments: shot.voiceAssignments?.map((item) => ({ ...item })) ?? [],
  attachments: shot.attachments?.map((item) => ({ ...item })) ?? [],
})

const prependReferenceImage = (
  shot: StoryboardShot,
  image: { url: string; label: string },
): StoryboardReferenceImage[] =>
  [
    {
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: image.url,
      label: image.label,
      sourceShotId: shot.id,
    },
    ...shot.referenceImages,
  ].slice(0, 8)

const createMockImageUrl = (kind: string, targetId: string): string =>
  `${MOCK_MEDIA_IMAGE_URL}?kind=${encodeURIComponent(kind)}&target=${encodeURIComponent(targetId)}&v=${Date.now()}`

export const generateMockStoryboardImage = (shot: StoryboardShot): { imageUrl: string; shot: StoryboardShot } => {
  const imageUrl = createMockImageUrl('storyboard', shot.id)
  return {
    imageUrl,
    shot: cloneStoryboardShot({
      ...shot,
      status: 'success',
      imageUrl,
      imageMediaId: undefined,
      referenceImages: prependReferenceImage(shot, { url: imageUrl, label: '生成结果' }),
    }),
  }
}

export const upscaleMockStoryboardImage = (shot: StoryboardShot): { imageUrl: string; shot: StoryboardShot } => {
  const imageUrl = createMockImageUrl('storyboard-upscale', shot.id)
  return {
    imageUrl,
    shot: cloneStoryboardShot({
      ...shot,
      status: 'success',
      imageUrl,
      imageMediaId: undefined,
      referenceImages: prependReferenceImage(shot, { url: imageUrl, label: '高清放大' }),
    }),
  }
}

const cloneSettingAsset = (asset: SettingAsset): SettingAsset => ({
  ...asset,
  imageUrls: [...asset.imageUrls],
  imageMediaIds: asset.imageMediaIds ? [...asset.imageMediaIds] : undefined,
  candidateImages: [...(asset.candidateImages ?? [])],
  candidateMediaIds: asset.candidateMediaIds ? [...asset.candidateMediaIds] : undefined,
  voiceOptions: asset.voiceOptions?.map((item) => ({ ...item })),
})

export const shouldFailSettingAssetGeneration = (name: string, description: string, prompt: string): boolean =>
  hasFailureToken([name, description, prompt], ['#mock-image-fail'])

export const generateMockSettingAssetImage = (asset: SettingAsset): { imageUrl: string; asset: SettingAsset } => {
  const imageUrl = createMockImageUrl(`setting-${asset.type}`, asset.id)
  return {
    imageUrl,
    asset: cloneSettingAsset({
      ...asset,
      status: 'ready',
      imageUrls: [imageUrl, ...asset.imageUrls].slice(0, 6),
      imageMediaIds: undefined,
      candidateImages: [...(asset.candidateImages ?? []), imageUrl].slice(-12),
      candidateMediaIds: undefined,
    }),
  }
}
