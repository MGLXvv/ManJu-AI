import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { systemApi } from '@/api/system.api'
import type {
  SystemMessageFilter,
  SystemPanelKey,
  SystemPermissionItem,
  SystemStyleItem,
  SystemState,
} from '@/types/system'

export const useSystemStore = defineStore('system', () => {
  const activePanel = ref<SystemPanelKey>('styles')
  const styleSearch = ref('')
  const styles = ref<SystemStyleItem[]>([])
  const permissions = ref<SystemPermissionItem[]>([])
  const messages = ref<SystemState['messages']>([])
  const messageFilter = ref<SystemMessageFilter>('all')
  const messagePage = ref(1)
  const messagePageSize = 4
  const loading = ref(false)
  const hydrated = ref(false)

  const filteredStyles = computed(() => {
    const query = styleSearch.value.trim().toLocaleLowerCase()
    if (!query) {
      return styles.value
    }
    return styles.value.filter((item) =>
      `${item.name} ${item.category} ${item.prompt}`.toLocaleLowerCase().includes(query),
    )
  })

  const filteredMessages = computed(() => {
    if (messageFilter.value === 'all') {
      return messages.value
    }
    return messages.value.filter((item) => item.status === messageFilter.value)
  })

  const messagePageCount = computed(() => Math.max(1, Math.ceil(filteredMessages.value.length / messagePageSize)))

  const paginatedMessages = computed(() => {
    const start = (messagePage.value - 1) * messagePageSize
    return filteredMessages.value.slice(start, start + messagePageSize)
  })

  const hydrate = async (): Promise<void> => {
    if (loading.value) {
      return
    }

    loading.value = true
    try {
      const state = await systemApi.getState()
      styles.value = state.styles ?? []
      permissions.value = state.permissions ?? []
      messages.value = state.messages ?? []
      hydrated.value = true
      messagePage.value = 1
    } finally {
      loading.value = false
    }
  }

  const setMessagePage = (page: number): void => {
    const next = Math.min(Math.max(page, 1), messagePageCount.value)
    messagePage.value = next
  }

  const createStyle = async (payload: Omit<SystemStyleItem, 'id'>): Promise<void> => {
    const created = await systemApi.createStyle(payload)
    styles.value.push(created)
  }

  const updateStyle = async (id: string, patch: Partial<SystemStyleItem>): Promise<void> => {
    const updated = await systemApi.updateStyle(id, patch)
    if (!updated) {
      return
    }

    styles.value = styles.value.map((item) => (item.id === id ? updated : item))
  }

  const deleteStyle = async (id: string): Promise<void> => {
    await systemApi.deleteStyle(id)
    styles.value = styles.value.filter((item) => item.id !== id)
  }

  const createPermission = async (
    payload: Omit<SystemPermissionItem, 'id' | 'updatedAt'>,
  ): Promise<void> => {
    const created = await systemApi.createPermission(payload)
    permissions.value.push(created)
  }

  const updatePermission = async (id: string, patch: Partial<SystemPermissionItem>): Promise<void> => {
    const updated = await systemApi.updatePermission(id, patch)
    if (!updated) {
      return
    }

    permissions.value = permissions.value.map((item) => (item.id === id ? updated : item))
  }

  const deletePermission = async (id: string): Promise<void> => {
    await systemApi.deletePermission(id)
    permissions.value = permissions.value.filter((item) => item.id !== id)
  }

  const markMessageRead = async (id: string): Promise<void> => {
    const updated = await systemApi.markMessageRead(id)
    if (updated) {
      messages.value = messages.value.map((item) => (item.id === id ? updated : item))
      return
    }

    messages.value = messages.value.map((item) =>
      item.id === id ? { ...item, status: 'read' } : item,
    )
  }

  const markAllRead = async (): Promise<void> => {
    const updated = await systemApi.markAllRead()
    if (updated.length > 0) {
      messages.value = updated
      return
    }

    messages.value = messages.value.map((item) => ({ ...item, status: 'read' }))
  }

  const clearMessages = async (): Promise<void> => {
    await systemApi.clearMessages()
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
    loading,
    hydrated,
    hydrate,
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