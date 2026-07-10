import { API_ERROR_CODES } from '@/types/api-enums'
import type { SettingAsset, SettingAssetType } from '@/api/modules/setting/setting.types'
import type { StoryboardReferenceImage, StoryboardShot } from '@/api/modules/storyboard/storyboard.types'
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
): StoryboardReferenceImage[] => [
  {
    id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: image.url,
    label: image.label,
    sourceShotId: shot.id,
  },
  ...shot.referenceImages,
].slice(0, 8)

const createStoryboardImage = (title: string, ratio: StoryboardShot['ratio']): string => {
  const portrait = ratio === '9:16'
  const width = portrait ? 720 : 1280
  const height = portrait ? 1280 : 720
  const footerHeight = portrait ? 132 : 108
  const fontSize = portrait ? 42 : 54

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3b4f77"/><stop offset="100%" stop-color="#8254c8"/></linearGradient></defs>
      <rect width="${width}" height="${height}" fill="url(#g)" />
      <rect x="0" y="${height - footerHeight}" width="${width}" height="${footerHeight}" fill="rgba(0,0,0,0.42)" />
      <text x="30" y="${height - (portrait ? 48 : 40)}" fill="white" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="${fontSize}" font-weight="700">${title}</text>
    </svg>`,
  )}`
}

export const generateMockStoryboardImage = (shot: StoryboardShot): { imageUrl: string; shot: StoryboardShot } => {
  const imageUrl = createStoryboardImage(`镜头生成 ${Date.now() % 10000}`, shot.ratio)
  return {
    imageUrl,
    shot: cloneStoryboardShot({
      ...shot,
      status: 'success',
      imageUrl,
      referenceImages: prependReferenceImage(shot, { url: imageUrl, label: '生成结果' }),
    }),
  }
}

export const upscaleMockStoryboardImage = (shot: StoryboardShot): { imageUrl: string; shot: StoryboardShot } => {
  const sourceUrl = shot.imageUrl ?? ''
  const imageUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs><linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4fd5ff" stop-opacity="0.8"/><stop offset="100%" stop-color="#fff1a6" stop-opacity="0.56"/></linearGradient></defs>
      <rect width="1280" height="720" fill="#0b1220"/><image href="${sourceUrl}" width="1280" height="720" preserveAspectRatio="xMidYMid slice"/><rect width="1280" height="720" fill="url(#shine)" opacity="0.24"/><rect x="48" y="42" width="1184" height="636" rx="28" fill="none" stroke="#ffffff" stroke-opacity="0.9" stroke-width="8"/><rect x="0" y="588" width="1280" height="132" fill="rgba(4,8,15,0.62)"/><text x="38" y="650" fill="#ffffff" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="54" font-weight="700">${shot.title} · 高清放大</text><text x="38" y="694" fill="#d8edf7" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="28">增强清晰度、细节和边缘质感</text></svg>`,
  )}`

  return {
    imageUrl,
    shot: cloneStoryboardShot({
      ...shot,
      status: 'success',
      imageUrl,
      referenceImages: prependReferenceImage(shot, { url: imageUrl, label: '高清放大' }),
    }),
  }
}

const cloneSettingAsset = (asset: SettingAsset): SettingAsset => ({
  ...asset,
  imageUrls: [...asset.imageUrls],
  candidateImages: [...(asset.candidateImages ?? [])],
  voiceOptions: asset.voiceOptions?.map((item) => ({ ...item })),
})

const createSettingAssetImage = (title: string, type: SettingAssetType): string => {
  const palettes: Record<SettingAssetType, [string, string]> = {
    character: ['#2e3a62', '#684b9a'],
    scene: ['#584226', '#b68652'],
    prop: ['#2f3446', '#6f79a8'],
  }
  const [colorA, colorB] = palettes[type]

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${colorA}"/><stop offset="100%" stop-color="${colorB}"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="28" y="320" fill="rgba(255,255,255,0.88)" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="28" font-weight="700">${title}</text></svg>`,
  )}`
}

export const shouldFailSettingAssetGeneration = (name: string, description: string, prompt: string): boolean =>
  hasFailureToken([name, description, prompt], ['#mock-image-fail'])

export const generateMockSettingAssetImage = (asset: SettingAsset): { imageUrl: string; asset: SettingAsset } => {
  const imageUrl = createSettingAssetImage(asset.title, asset.type)
  return {
    imageUrl,
    asset: cloneSettingAsset({
      ...asset,
      status: 'ready',
      imageUrls: [imageUrl, ...asset.imageUrls].slice(0, 6),
      candidateImages: [...(asset.candidateImages ?? []), imageUrl].slice(-12),
    }),
  }
}
