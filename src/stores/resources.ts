import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  ResourceAsset,
  ResourceAssetSource,
  ResourceAssetType,
  ResourceFolder,
  ResourceLibraryTab,
  ResourceSourceFilter,
  ResourceTypeFilter,
} from '@/types/resource'
import type { VoiceOption } from '@/types/settingAsset'

const createPlaceholderImage = (label: string, colorA: string, colorB: string): string => {
  const encoded = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${colorA}" />
          <stop offset="100%" stop-color="${colorB}" />
        </linearGradient>
      </defs>
      <rect width="320" height="220" fill="url(#g)" />
      <circle cx="248" cy="54" r="22" fill="rgba(255,255,255,0.14)" />
      <circle cx="80" cy="164" r="16" fill="rgba(255,255,255,0.12)" />
      <text x="24" y="196" fill="rgba(255,255,255,0.88)" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="22" font-weight="700">${label}</text>
    </svg>`,
  )
  return `data:image/svg+xml;charset=UTF-8,${encoded}`
}

const voiceOptions: VoiceOption[] = [
  { id: 'male-mid', name: '浑厚男中音' },
  { id: 'female-soft', name: '温柔女中音' },
  { id: 'girl-lively', name: '活泼少女音' },
]

const folders: ResourceFolder[] = [
  { id: 'creative-created', label: '我的创建', tab: 'creative', source: 'created' },
  { id: 'creative-favorite', label: '我的收藏', tab: 'creative', source: 'favorite' },
  { id: 'subject-created', label: '我的创建', tab: 'subject', source: 'created' },
  { id: 'subject-favorite', label: '我的收藏', tab: 'subject', source: 'favorite' },
  { id: 'subject-official', label: '官方主体', tab: 'subject', source: 'official' },
]

const seedAssets: ResourceAsset[] = [
  {
    id: 'resource-1',
    tab: 'creative',
    type: 'character',
    source: 'created',
    name: '赵灵儿',
    prompt: '国风漫画，少女，灵动眼神，柔和轮廓',
    imageUrl: createPlaceholderImage('赵灵儿', '#5a7f28', '#93c637'),
    selectedVoiceId: 'female-soft',
    voiceOptions,
  },
  {
    id: 'resource-2',
    tab: 'creative',
    type: 'character',
    source: 'created',
    name: '九月',
    prompt: '黑发女主，都市感穿搭，安静气质',
    imageUrl: createPlaceholderImage('九月', '#5d7e2a', '#87b938'),
    selectedVoiceId: 'girl-lively',
    voiceOptions,
  },
  {
    id: 'resource-3',
    tab: 'creative',
    type: 'character',
    source: 'created',
    name: '敖烈',
    prompt: '男性角色，冷峻表情，青蓝色调',
    imageUrl: createPlaceholderImage('敖烈', '#63822f', '#8db638'),
    selectedVoiceId: 'male-mid',
    voiceOptions,
  },
  {
    id: 'resource-4',
    tab: 'creative',
    type: 'character',
    source: 'favorite',
    name: '哪吒',
    prompt: '少年感，锋利眉眼，红金点缀',
    imageUrl: createPlaceholderImage('哪吒', '#567d2f', '#8dbd3d'),
    selectedVoiceId: 'male-mid',
    voiceOptions,
  },
  {
    id: 'resource-5',
    tab: 'creative',
    type: 'scene',
    source: 'created',
    name: '咖啡店',
    prompt: '现代咖啡馆，暖黄灯光，夜间氛围',
    imageUrl: createPlaceholderImage('咖啡店', '#8a6c28', '#d9af3c'),
  },
  {
    id: 'resource-6',
    tab: 'creative',
    type: 'scene',
    source: 'favorite',
    name: '岳麓山',
    prompt: '山路，晨雾，松林层次，写意感',
    imageUrl: createPlaceholderImage('岳麓山', '#876924', '#ca9f35'),
  },
  {
    id: 'resource-7',
    tab: 'subject',
    type: 'character',
    source: 'official',
    name: '官方男主模板',
    prompt: '官方主体角色模板',
    imageUrl: createPlaceholderImage('官方男主', '#5a7f28', '#93c637'),
    selectedVoiceId: 'male-mid',
    voiceOptions,
  },
  {
    id: 'resource-8',
    tab: 'subject',
    type: 'scene',
    source: 'official',
    name: '官方城市场景',
    prompt: '官方城市场景模板',
    imageUrl: createPlaceholderImage('官方城市场景', '#8a6c28', '#d9af3c'),
  },
]

export const useResourcesStore = defineStore('resources', () => {
  const assets = ref<ResourceAsset[]>(seedAssets)
  const activeTab = ref<ResourceLibraryTab>('creative')
  const activeFolderId = ref('creative-created')
  const keyword = ref('')
  const sourceFilter = ref<ResourceSourceFilter>('all')
  const typeFilter = ref<ResourceTypeFilter>('all')

  const visibleFolders = computed(() => folders.filter((folder) => folder.tab === activeTab.value))
  const activeFolder = computed(() => visibleFolders.value.find((folder) => folder.id === activeFolderId.value) ?? visibleFolders.value[0])

  const folderCounts = computed(() =>
    Object.fromEntries(
      folders.map((folder) => [
        folder.id,
        assets.value.filter((asset) => asset.tab === folder.tab && asset.source === folder.source).length,
      ]),
    ) as Record<string, number>,
  )

  const filteredAssets = computed(() => {
    const text = keyword.value.trim()
    const folder = activeFolder.value
    return assets.value.filter((asset) => {
      const tabMatch = asset.tab === activeTab.value
      const folderMatch = folder ? asset.source === folder.source : true
      const sourceMatch = sourceFilter.value === 'all' || asset.source === sourceFilter.value
      const typeMatch = typeFilter.value === 'all' || asset.type === typeFilter.value
      const keywordMatch = !text || asset.name.includes(text) || asset.prompt.includes(text)
      return tabMatch && folderMatch && sourceMatch && typeMatch && keywordMatch
    })
  })

  const setActiveTab = (value: ResourceLibraryTab): void => {
    activeTab.value = value
    const firstFolder = folders.find((folder) => folder.tab === value)
    if (firstFolder) {
      activeFolderId.value = firstFolder.id
    }
  }

  const setActiveFolder = (id: string): void => {
    activeFolderId.value = id
  }

  const createAsset = (payload: {
    tab: ResourceLibraryTab
    type: ResourceAssetType
    source: ResourceAssetSource
    name: string
    prompt: string
    imageUrl: string
    selectedVoiceId?: string
  }): void => {
    assets.value.unshift({
      id: `resource-${Date.now()}`,
      tab: payload.tab,
      type: payload.type,
      source: payload.source,
      name: payload.name,
      prompt: payload.prompt,
      imageUrl: payload.imageUrl,
      selectedVoiceId: payload.selectedVoiceId,
      voiceOptions: payload.type === 'character' ? voiceOptions : undefined,
    })
  }

  const updateAsset = (id: string, patch: Partial<ResourceAsset>): void => {
    assets.value = assets.value.map((asset) => (asset.id === id ? { ...asset, ...patch } : asset))
  }

  const deleteAsset = (id: string): void => {
    assets.value = assets.value.filter((asset) => asset.id !== id)
  }

  return {
    assets,
    activeTab,
    activeFolderId,
    keyword,
    sourceFilter,
    typeFilter,
    visibleFolders,
    folderCounts,
    filteredAssets,
    setActiveTab,
    setActiveFolder,
    createAsset,
    updateAsset,
    deleteAsset,
  }
})
