import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  SystemMessageFilter,
  SystemMessageItem,
  SystemPanelKey,
  SystemPermissionItem,
  SystemPermissionKey,
  SystemStyleItem,
} from '@/types/system'

const nowStamp = (): string => {
  const now = new Date()
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const createPermissionMatrix = (
  resourceLibrary: boolean,
  storyboard: boolean,
  dubbing: boolean,
  systemMessage: boolean,
): Record<SystemPermissionKey, boolean> => ({
  resourceLibrary,
  storyboard,
  dubbing,
  systemMessage,
})

const seedStyles: SystemStyleItem[] = [
  { id: 'style-1', name: '真人写实', category: '写实', prompt: '真实皮肤质感、自然光影、电影级景深。' },
  { id: 'style-2', name: '2D国风动漫', category: '国风', prompt: '细线勾勒、暖金光效、服饰纹样完整。' },
  { id: 'style-3', name: '3D国风动漫', category: '3D', prompt: '角色立体层次更强，国风配色克制。' },
  { id: 'style-4', name: '3D卡通', category: '3D', prompt: '块面明确、角色夸张、饱和度适中。' },
  { id: 'style-5', name: '日系漫画', category: '漫画', prompt: '黑白线稿清晰，镜头切割感强。' },
  { id: 'style-6', name: '美式漫画', category: '漫画', prompt: '高对比硬朗用光，轮廓和结构感突出。' },
]

const seedPermissions: SystemPermissionItem[] = [
  {
    id: 'perm-1',
    role: '超级管理员',
    members: 2,
    permissions: createPermissionMatrix(true, true, true, true),
    updatedAt: '2026-03-17 09:08',
  },
  {
    id: 'perm-2',
    role: '内容编辑',
    members: 8,
    permissions: createPermissionMatrix(true, true, true, false),
    updatedAt: '2026-03-16 14:25',
  },
  {
    id: 'perm-3',
    role: '运营查看',
    members: 5,
    permissions: createPermissionMatrix(false, false, false, true),
    updatedAt: '2026-03-15 18:40',
  },
]

const seedMessages: SystemMessageItem[] = [
  {
    id: 'msg-1',
    title: '登录操作通知',
    summary: '你的账号（默认用户001）在平台登录成功，如非本人操作，请及时修改密码。',
    content: '你的账号（默认用户001）在平台登录成功，如非本人操作，请及时修改密码（密码修改成功后，全平台清空登录状态）。',
    status: 'unread',
    level: 'high',
    relativeTime: '12分钟前',
    platform: '搜狗浏览器',
    loginMethod: '扫码登录',
    location: '中国湖南长沙',
    loginTime: '2026-03-17 09:08:47',
  },
  {
    id: 'msg-2',
    title: '登录操作通知',
    summary: '你的账号（默认用户001）在平台登录成功，如非本人操作，请及时修改密码。',
    content: '你的账号（默认用户001）在平台登录成功，如非本人操作，请及时修改密码（密码修改成功后，全平台清空登录状态）。',
    status: 'unread',
    level: 'high',
    relativeTime: '1天前',
    platform: 'Chrome',
    loginMethod: '账号密码',
    location: '中国上海',
    loginTime: '2026-03-16 10:32:10',
  },
  {
    id: 'msg-3',
    title: '系统更新通知',
    summary: '风格管理模块已完成升级，新增风格筛选和批量导入能力。',
    content: '系统已于 2026-03-16 22:00 完成升级，风格管理模块新增风格筛选和批量导入能力，请刷新页面后使用。',
    status: 'unread',
    level: 'normal',
    relativeTime: '1天前',
    platform: '系统消息',
    loginMethod: '站内通知',
    location: '服务端推送',
    loginTime: '2026-03-16 22:00:00',
  },
  {
    id: 'msg-4',
    title: '登录操作通知',
    summary: '你的账号（默认用户001）在平台登录成功，如非本人操作，请及时修改密码。',
    content: '你的账号（默认用户001）在平台登录成功，如非本人操作，请及时修改密码（密码修改成功后，全平台清空登录状态）。',
    status: 'read',
    level: 'normal',
    relativeTime: '2天前',
    platform: 'Edge',
    loginMethod: '扫码登录',
    location: '中国湖南长沙',
    loginTime: '2026-03-15 09:08:47',
  },
  {
    id: 'msg-5',
    title: '音色管理通知',
    summary: '你上传的音色“浑厚男中音”已审核通过，可以在配音页直接使用。',
    content: '你上传的音色“浑厚男中音”已审核通过，已同步到配音和设定页面的音色选择器。',
    status: 'read',
    level: 'normal',
    relativeTime: '2天前',
    platform: '系统消息',
    loginMethod: '站内通知',
    location: '服务端推送',
    loginTime: '2026-03-15 12:26:11',
  },
  {
    id: 'msg-6',
    title: '登录操作通知',
    summary: '你的账号（默认用户001）在平台登录成功，如非本人操作，请及时修改密码。',
    content: '你的账号（默认用户001）在平台登录成功，如非本人操作，请及时修改密码（密码修改成功后，全平台清空登录状态）。',
    status: 'read',
    level: 'normal',
    relativeTime: '3天前',
    platform: 'Safari',
    loginMethod: '扫码登录',
    location: '中国北京',
    loginTime: '2026-03-14 08:12:35',
  },
  {
    id: 'msg-7',
    title: '权限变更通知',
    summary: '角色“内容编辑”的资源库权限已扩展到主体资产编辑。',
    content: '权限组“内容编辑”已于 2026-03-14 18:40 扩展到主体资产编辑，请相关成员刷新页面后生效。',
    status: 'read',
    level: 'normal',
    relativeTime: '4天前',
    platform: '系统消息',
    loginMethod: '站内通知',
    location: '服务端推送',
    loginTime: '2026-03-14 18:40:00',
  },
  {
    id: 'msg-8',
    title: '登录操作通知',
    summary: '检测到新的异地登录行为，若非本人请立即修改密码。',
    content: '检测到新的异地登录行为，登录平台为 Firefox，登录地为中国广州。若非本人请立即修改密码。',
    status: 'read',
    level: 'high',
    relativeTime: '5天前',
    platform: 'Firefox',
    loginMethod: '账号密码',
    location: '中国广州',
    loginTime: '2026-03-13 07:42:03',
  },
]

export const useSystemStore = defineStore('system', () => {
  const activePanel = ref<SystemPanelKey>('styles')
  const styleSearch = ref('')
  const styles = ref<SystemStyleItem[]>(seedStyles)
  const permissions = ref<SystemPermissionItem[]>(seedPermissions)
  const messages = ref<SystemMessageItem[]>(seedMessages)
  const messageFilter = ref<SystemMessageFilter>('all')
  const messagePage = ref(1)
  const messagePageSize = 4

  const filteredStyles = computed(() => {
    const query = styleSearch.value.trim().toLowerCase()
    if (!query) return styles.value
    return styles.value.filter((item) => `${item.name} ${item.category} ${item.prompt}`.toLowerCase().includes(query))
  })

  const filteredMessages = computed(() => {
    if (messageFilter.value === 'all') return messages.value
    return messages.value.filter((item) => item.status === messageFilter.value)
  })

  const messagePageCount = computed(() => Math.max(1, Math.ceil(filteredMessages.value.length / messagePageSize)))

  const paginatedMessages = computed(() => {
    const start = (messagePage.value - 1) * messagePageSize
    return filteredMessages.value.slice(start, start + messagePageSize)
  })

  const setMessagePage = (page: number): void => {
    const next = Math.min(Math.max(page, 1), messagePageCount.value)
    messagePage.value = next
  }

  const createStyle = (payload: Omit<SystemStyleItem, 'id'>): void => {
    styles.value.push({ id: `style-${Date.now()}`, ...payload })
  }

  const updateStyle = (id: string, patch: Partial<SystemStyleItem>): void => {
    styles.value = styles.value.map((item) => (item.id === id ? { ...item, ...patch } : item))
  }

  const deleteStyle = (id: string): void => {
    styles.value = styles.value.filter((item) => item.id !== id)
  }

  const createPermission = (
    payload: Omit<SystemPermissionItem, 'id' | 'updatedAt'>,
  ): void => {
    permissions.value.push({ id: `perm-${Date.now()}`, ...payload, updatedAt: nowStamp() })
  }

  const updatePermission = (id: string, patch: Partial<SystemPermissionItem>): void => {
    permissions.value = permissions.value.map((item) =>
      item.id === id ? { ...item, ...patch, updatedAt: nowStamp() } : item,
    )
  }

  const deletePermission = (id: string): void => {
    permissions.value = permissions.value.filter((item) => item.id !== id)
  }

  const markMessageRead = (id: string): void => {
    messages.value = messages.value.map((item) => (item.id === id ? { ...item, status: 'read' } : item))
  }

  const markAllRead = (): void => {
    messages.value = messages.value.map((item) => ({ ...item, status: 'read' }))
  }

  const clearMessages = (): void => {
    messages.value = []
    messagePage.value = 1
  }

  return {
    activePanel,
    styleSearch,
    styles,
    filteredStyles,
    permissions,
    messages,
    messageFilter,
    filteredMessages,
    paginatedMessages,
    messagePage,
    messagePageCount,
    messagePageSize,
    createStyle,
    updateStyle,
    deleteStyle,
    createPermission,
    updatePermission,
    deletePermission,
    setMessagePage,
    markMessageRead,
    markAllRead,
    clearMessages,
  }
})
