import type { ResourceFolder } from '@/types/resource'

export const resourceFolders: ResourceFolder[] = [
  { id: 'creative-created', label: '我的创建', tab: 'creative', source: 'created' },
  { id: 'creative-favorite', label: '我的收藏', tab: 'creative', source: 'favorite' },
  { id: 'subject-created', label: '我的创建', tab: 'subject', source: 'created' },
  { id: 'subject-favorite', label: '我的收藏', tab: 'subject', source: 'favorite' },
  { id: 'subject-official', label: '官方主体', tab: 'subject', source: 'official' },
]
