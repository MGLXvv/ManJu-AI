import type { Project } from '@/types/project'

export const mockProjects: Project[] = [
  { id: 'journey-west', name: '西游记', status: 'in_progress', currentStep: 'storyboard', ratio: '16:9', style: '写实', updatedAt: '2026/03/12 17:16', duration: '00:45:00' },
  { id: 'nezha', name: '哪吒传', status: 'completed', currentStep: 'complete', ratio: '16:9', style: '国漫', updatedAt: '2026/03/10 09:20' },
  { id: 'red-dream', name: '红楼梦', status: 'in_progress', currentStep: 'settings', ratio: '9:16', style: '古风', updatedAt: '2026/03/08 14:30' },
]
