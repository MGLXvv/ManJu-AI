import type { StoryboardShot, StoryboardShotStatus, StoryboardTag, StoryboardTagOptions } from '@/types/storyboard'

const makeImage = (
  label: string,
  colorA: string,
  colorB: string,
  seed: number,
  ratio: StoryboardShot['ratio'] = '16:9',
): string => {
  const isPortrait = ratio === '9:16'
  const width = isPortrait ? 720 : 1280
  const height = isPortrait ? 1280 : 720
  const footerHeight = isPortrait ? 132 : 108
  const footerY = height - footerHeight
  const fontSize = isPortrait ? 42 : 54
  const textY = height - (isPortrait ? 48 : 40)
  const circleCx = isPortrait ? 120 + (seed % 4) * 120 : 180 + (seed % 7) * 130
  const circleCy = isPortrait ? 160 + (seed % 6) * 130 : 120 + (seed % 5) * 90
  const circleR = 36 + (seed % 4) * 10

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colorA}" />
        <stop offset="100%" stop-color="${colorB}" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)" />
    <circle cx="${circleCx}" cy="${circleCy}" r="${circleR}" fill="rgba(255,255,255,0.16)" />
    <rect x="0" y="${footerY}" width="${width}" height="${footerHeight}" fill="rgba(0,0,0,0.42)" />
    <text x="30" y="${textY}" fill="white" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="${fontSize}" font-weight="700">${label}</text>
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

const firstDubbingSampleDialogues = [
  '今晚的风，比想象中更冷。',
  '如果这里就是答案，那我宁愿再问一次。',
  '你听见了吗，远处的钟声好像停了。',
  '我不是害怕黑夜，只是不想一个人走完它。',
  '这条街和记忆里不一样，连灯光都变得陌生。',
  '别回头，至少现在还不能让他们发现。',
  '那封信我看过了，字迹确实是他的。',
  '有些事情一旦说出口，就再也回不到从前。',
  '雨停之前，我们必须离开这里。',
  '我一直以为答案在前方，后来才知道它藏在过去。',
  '如果你还相信我，就把这一次交给我。',
  '等天亮以后，一切都会变得不一样。',
]

const createShot = (
  index: number,
  status: StoryboardShotStatus = 'pending-review',
  ratio: StoryboardShot['ratio'] = '16:9',
  options: {
    characterIndex?: number
    dialogue?: string
  } = {},
): StoryboardShot => {
  const label = `分镜${index + 1}`
  const imageUrl = makeImage(label, '#314263', '#8152c2', index, ratio)
  const characterIndex = options.characterIndex ?? index % storyboardTagOptions.characters.length
  const character = storyboardTagOptions.characters[characterIndex]

  return {
    id: `shot-${index + 1}`,
    index: index + 1,
    title: `镜头 ${index + 1}`,
    imageUrl,
    videoUrl: '',
    prompt: '深夜街道霓虹灯映照，角色在雨中停步回头，近景情绪镜头，电影感光影，细节丰富，动态构图。',
    videoPrompt: '角色在夜色街道中缓步前行，镜头缓推，霓虹反射在积水地面，保留人物情绪停顿。',
    dialogue: options.dialogue ?? (index % 2 === 0 ? '今晚的风，比想象中更冷。' : '再往前一步，就能看见答案。'),
    durationSeconds: 10,
    voiceAssignments: [
      {
        id: `voice-${index + 1}-1`,
        characterId: character.id,
        voice: '浑厚男中音',
      },
    ],
    characters: [character],
    scenes: [storyboardTagOptions.scenes[index % storyboardTagOptions.scenes.length]],
    props: [storyboardTagOptions.props[index % storyboardTagOptions.props.length]],
    style: '国风漫画',
    ratio,
    status,
    isHidden: false,
    storyboardReviewed: false,
    videoReviewed: false,
    isLocked: false,
    createdAt: ts,
    referenceImages: [
      { id: `${label}-ref-1`, url: makeImage(`${label}-参考1`, '#563224', '#a87a4f', index + 3, ratio) },
      { id: `${label}-ref-2`, url: makeImage(`${label}-参考2`, '#2f3c57', '#576f8f', index + 6, ratio) },
      { id: `${label}-ref-3`, url: makeImage(`${label}-参考3`, '#4d2f5e', '#8d4da8', index + 9, ratio) },
      { id: `${label}-ref-4`, url: makeImage(`${label}-参考4`, '#3b4532', '#7d9a54', index + 12, ratio) },
      { id: `${label}-ref-5`, url: makeImage(`${label}-参考5`, '#423a2d', '#9d7d52', index + 15, ratio) },
    ],
  }
}

export const storyboardShotsMock: StoryboardShot[] = [
  createShot(0, 'pending-review', '16:9', { characterIndex: 0, dialogue: firstDubbingSampleDialogues[0] }),
  createShot(1, 'pending-review', '9:16'),
  createShot(2),
  createShot(3),
  createShot(4, 'pending-review', '9:16'),
  createShot(5),
  ...firstDubbingSampleDialogues.slice(1).map((dialogue, offset) =>
    createShot(offset + 6, 'pending-review', offset % 2 === 0 ? '16:9' : '9:16', {
      characterIndex: 0,
      dialogue,
    }),
  ),
]

export const storyboardStylesMock = ['国风漫画', '二次元', '写实电影感', '赛博朋克']
