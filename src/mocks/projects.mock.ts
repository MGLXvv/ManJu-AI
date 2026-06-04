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
  'OVERLORD',
  '动物狂想曲',
  '宝石之国',
  '斗罗大陆',
  '咒术回战',
  '夏日重现',
  '西游记',
  '哪吒传奇',
  '红楼梦',
  '三国演义',
  '天气之子',
  '宫崎骏家的饭',
  '路人女主的养成方法',
  '间谍过家家',
  '孤独摇滚',
  '有兽焉',
  '非人哉',
  '水浒传',
  '封神榜',
  '聊斋志异',
  '神雕侠侣',
  '三侠五义',
  '西厢记',
  '封神演义',
  '秦时明月',
  '罗小黑战记',
  '凡人修仙传',
  '一人之下',
  '狐妖小红娘',
  '灵笼',
  '长安三万里',
  '镖人',
  '画江湖之不良人',
  '伍六七',
  '大理寺日志',
  '时光代理人',
  '眷思量',
  '大鱼海棠',
  '雾山五行',
  '少年歌行',
  '剑来',
  '庆余年',
  '赘婿',
  '仙逆',
  '星辰变',
  '完美世界',
  '吞噬星空',
  '全职高手',
  '镇魂街',
  '十万个冷笑话',
  '秦侠',
]

const coverThemes = [
  ['#3d4f80', '#bc7ce9'],
  ['#3d8d84', '#91ddb5'],
  ['#2c3349', '#91b6dd'],
  ['#2f455e', '#8dd6ff'],
  ['#3c2c58', '#f08bb3'],
  ['#58332f', '#ffad6e'],
  ['#2d5048', '#b0f862'],
  ['#5b3c2c', '#f7c06b'],
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

const stepPool: Project['currentStep'][] = ['script', 'settings', 'storyboard', 'video', 'dubbing']
const durationPool = ['00:45:00', '00:32:18', '01:05:27', '00:18:42', '00:56:10']

export const mockProjects: Project[] = Array.from({ length: 60 }, (_, index) => {
  const name = seedNames[index % seedNames.length]
  const status = index % 4 === 1 ? 'completed' : 'in_progress'
  return {
    id: `project-${index + 1}`,
    name,
    status,
    currentStep: status === 'completed' ? 'complete' : stepPool[index % stepPool.length],
    ratio: index % 5 === 0 ? '9:16' : '16:9',
    style: index % 2 === 0 ? '国漫' : '写实',
    updatedAt: `2026/${String(3 + Math.floor(index / 20)).padStart(2, '0')}/${String(3 + (index % 25)).padStart(2, '0')} ${String(9 + (index % 10)).padStart(2, '0')}:${String(12 + (index % 47)).padStart(2, '0')}:00`,
    duration: durationPool[index % durationPool.length],
    coverUrl: createCover(name, index),
    favorite: index % 6 === 0,
  }
})
