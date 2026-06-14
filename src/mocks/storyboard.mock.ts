import type { StoryboardShot, StoryboardShotStatus, StoryboardTag, StoryboardTagOptions } from '@/types/storyboard'

const makeImage = (label: string, colorA: string, colorB: string, seed: number): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colorA}" />
        <stop offset="100%" stop-color="${colorB}" />
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#g)" />
    <circle cx="${180 + (seed % 7) * 130}" cy="${120 + (seed % 5) * 90}" r="${36 + (seed % 4) * 10}" fill="rgba(255,255,255,0.16)" />
    <rect x="0" y="612" width="1280" height="108" fill="rgba(0,0,0,0.42)" />
    <text x="30" y="680" fill="white" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="54" font-weight="700">${label}</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const makeTag = (id: string, name: string, type: StoryboardTag['type']): StoryboardTag => ({
  id,
  name,
  type,
})

export const storyboardTagOptions: StoryboardTagOptions = {
  characters: [
    makeTag('ch-zhaolinger', '赵灵儿', 'character'),
    makeTag('ch-xiaolongnv', '小龙女', 'character'),
    makeTag('ch-xuban', '虚斑', 'character'),
    makeTag('ch-lixiaoyao', '李逍遥', 'character'),
  ],
  scenes: [
    makeTag('sc-flower', '花店', 'scene'),
    makeTag('sc-street-night', '夜晚街道', 'scene'),
    makeTag('sc-home', '主角家', 'scene'),
    makeTag('sc-temple', '古庙', 'scene'),
  ],
  props: [
    makeTag('pr-bouquet', '一束花', 'prop'),
    makeTag('pr-sword', '古剑', 'prop'),
    makeTag('pr-letter', '信件', 'prop'),
  ],
}

const ts = '2026年3月12日 17:16'

const createShot = (index: number, status: StoryboardShotStatus = 'pending-review'): StoryboardShot => {
  const label = `分镜${index + 1}`
  const imageUrl = makeImage(label, '#314263', '#8152c2', index)
  return {
    id: `shot-${index + 1}`,
    index: index + 1,
    title: `镜头 ${index + 1}`,
    imageUrl,
    videoUrl: '',
    prompt: '深夜街道霓虹灯映照，角色在雨中停步回头，近景情绪镜头，电影感光影，细节丰富，动态构图。',
    videoPrompt: '角色在夜色街道中缓步前行，镜头缓推，霓虹反射在积水地面，保留人物情绪停顿。',
    dialogue: index % 2 === 0 ? '今晚的风，比想象中更冷。' : '再往前一步，就能看见答案。', 
    durationSeconds: 10,
    voiceAssignments: [
      {
        id: `voice-${index + 1}-1`,
        characterId: storyboardTagOptions.characters[index % storyboardTagOptions.characters.length].id,
        voice: '浑厚男中音',
      },
    ],
    characters: [storyboardTagOptions.characters[index % storyboardTagOptions.characters.length]],
    scenes: [storyboardTagOptions.scenes[index % storyboardTagOptions.scenes.length]],
    props: [storyboardTagOptions.props[index % storyboardTagOptions.props.length]],
    style: '国风漫画',
    ratio: '16:9',
    status,
    isHidden: false,
    isFavorite: index % 2 === 0,
    isLocked: false,
    createdAt: ts,
    referenceImages: [
      { id: `${label}-ref-1`, url: makeImage(`${label}-参考1`, '#563224', '#a87a4f', index + 3) },
      { id: `${label}-ref-2`, url: makeImage(`${label}-参考2`, '#2f3c57', '#576f8f', index + 6) },
      { id: `${label}-ref-3`, url: makeImage(`${label}-参考3`, '#4d2f5e', '#8d4da8', index + 9) },
      { id: `${label}-ref-4`, url: makeImage(`${label}-参考4`, '#3b4532', '#7d9a54', index + 12) },
      { id: `${label}-ref-5`, url: makeImage(`${label}-参考5`, '#423a2d', '#9d7d52', index + 15) },
    ],
  }
}

export const storyboardShotsMock: StoryboardShot[] = [
  createShot(0),
  createShot(1),
  createShot(2),
  createShot(3),
  createShot(4),
  createShot(5),
]

export const storyboardStylesMock = ['国风漫画', '二次元', '写实电影感', '赛博朋克']
