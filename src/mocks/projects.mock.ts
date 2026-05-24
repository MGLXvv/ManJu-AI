import type { Project } from '@/types/project'

const seedNames = [
  'JOJO的奇妙冒险',
  '葬送的芙莉莲',
  '夏目友人帐',
  '怪兽8号',
  '石纪元',
  '名侦探柯南',
  '假面骑士',
  '成龙历险记',
  '鬼灭之刃',
  'OVERLORDⅡ',
  '动物狂想曲',
  '宝石之国',
  '多罗罗',
  '薰香花朵凛然绽放',
  'JOJO的奇妙冒险',
  '夏日重现',
  '西游记',
  '哪吒传',
  '红楼梦',
  '三国演义',
  '天气之子',
  '宫宫家今天的饭',
  '路人女主的养成方法',
  '舞送的芙莉莲',
]

const coverThemes = [
  ['#3d4f80', '#bc7ce9'],
  ['#3d8d84', '#91ddb5'],
  ['#2c3349', '#91b6dd'],
  ['#2f455e', '#8dd6ff'],
  ['#3c2c58', '#f08bb3'],
  ['#58332f', '#ffad6e'],
]

const createCover = (title: string, index: number): string => {
  const [start, end] = coverThemes[index % coverThemes.length]
  const encoded = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="192" viewBox="0 0 420 192">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="420" height="192" fill="url(#g)" />
      <circle cx="${48 + (index % 8) * 44}" cy="${40 + (index % 6) * 16}" r="${34 + (index % 5) * 3}" fill="rgba(255,255,255,0.16)" />
      <rect x="0" y="116" width="420" height="76" fill="rgba(0,0,0,0.46)" />
      <text x="16" y="158" fill="white" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="26" font-weight="700">${title}</text>
    </svg>`,
  )
  return `data:image/svg+xml;charset=UTF-8,${encoded}`
}

export const mockProjects: Project[] = Array.from({ length: 24 }, (_, index) => {
  const name = seedNames[index % seedNames.length]
  return {
    id: `project-${index + 1}`,
    name,
    status: index % 3 === 1 ? 'completed' : 'in_progress',
    currentStep: index % 3 === 1 ? 'complete' : 'storyboard',
    ratio: '16:9',
    style: index % 2 === 0 ? '国漫' : '写实',
    updatedAt: `2026/03/${String(10 + (index % 18)).padStart(2, '0')} 14:30`,
    duration: index % 4 === 0 ? '00:45:00' : undefined,
    coverUrl: createCover(name, index),
    favorite: index % 5 === 0,
  }
})
