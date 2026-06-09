import type { ScriptTemplate } from '@/types/scriptTemplate'

export const defaultScriptTemplates: ScriptTemplate[] = [
  {
    id: 'script-template-three-act',
    name: '三幕短剧',
    content: '请将输入故事整理为适合漫画短剧制作的三幕结构，保留核心冲突、角色转折和后续可拆分的镜头线索。',
    updatedAt: '2026-06-09T09:00:00.000Z',
  },
  {
    id: 'script-template-light-comedy',
    name: '轻喜剧节奏',
    content: '请强化轻喜剧节奏，每幕保留一个明确笑点，角色对话简洁自然，结尾保留反转或包袱。',
    updatedAt: '2026-06-09T09:05:00.000Z',
  },
  {
    id: 'script-template-four-characters',
    name: '角色数量限制',
    content: '请将主要出场角色控制在 4 人以内，避免支线过多，并明确每个角色在剧情中的功能定位。',
    updatedAt: '2026-06-09T09:10:00.000Z',
  },
  {
    id: 'script-template-split-shots',
    name: '便于拆镜头',
    content: '请按照后续分镜生成的需要，补充场景切换、角色动作和情绪变化，便于逐镜头拆分与配图。',
    updatedAt: '2026-06-09T09:15:00.000Z',
  },
]
