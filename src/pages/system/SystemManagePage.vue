<template>
  <section class="system-page">
    <div class="system-page__bg" aria-hidden="true"></div>

    <div class="system-page__content">
      <SystemSidebar v-model="activePanel" />

      <div class="system-page__main">
        <SystemStylePanel
          v-if="activePanel === 'styles'"
          :items="filteredStyles"
          :search="styleSearch"
          @update:search="styleSearch = $event"
          @create="createStyle"
          @update="updateStyle"
          @delete="deleteStyle"
        />

        <SystemPermissionPanel
          v-else-if="activePanel === 'permissions'"
          :items="permissions"
          @create="createPermission"
          @update="updatePermission"
          @delete="deletePermission"
        />

        <SystemMessagePanel
          v-else
          v-model:filter="messageFilter"
          :items="paginatedMessages"
          :page="messagePage"
          :page-count="messagePageCount"
          @update:page="setMessagePage"
          @clear="clearMessages"
          @mark-all-read="markAllRead"
          @open-detail="openMessageDetail"
        />
      </div>
    </div>

    <SystemMessageDetailModal :message="selectedMessage" @close="selectedMessageId = ''" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { resolveHttpReadonlyState } from '@/features/backend/httpReadonlyState'
import { useRoute } from 'vue-router'
import SystemMessageDetailModal from '@/components/system/SystemMessageDetailModal.vue'
import SystemMessagePanel from '@/components/system/SystemMessagePanel.vue'
import SystemPermissionPanel from '@/components/system/SystemPermissionPanel.vue'
import SystemSidebar from '@/components/system/SystemSidebar.vue'
import SystemStylePanel from '@/components/system/SystemStylePanel.vue'
import { useSystemStore } from '@/stores/system'
import { useUiFeedbackStore } from '@/stores/uiFeedback'
import type { SystemPanelKey, SystemPermissionItem } from '@/types/system'

const route = useRoute()
const store = useSystemStore()
const uiFeedback = useUiFeedbackStore()
const selectedMessageId = ref('')
const readonlyState = resolveHttpReadonlyState('system')

const syncPanelFromQuery = (): void => {
  const panel = route.query.panel
  if (panel === 'styles' || panel === 'permissions' || panel === 'messages') {
    store.activePanel = panel as SystemPanelKey
    selectedMessageId.value = ''
  }
}

onMounted(() => {
  void store.hydrate()
  syncPanelFromQuery()
})

watch(
  () => route.query.panel,
  () => {
    syncPanelFromQuery()
  },
)

const activePanel = computed({
  get: () => store.activePanel,
  set: (value) => {
    store.activePanel = value
    selectedMessageId.value = ''
  },
})

const styleSearch = computed({
  get: () => store.styleSearch,
  set: (value) => {
    store.styleSearch = value
  },
})

const filteredStyles = computed(() => store.filteredStyles)
const permissions = computed(() => store.permissions)
const messageFilter = computed({
  get: () => store.messageFilter,
  set: (value) => {
    store.messageFilter = value
    store.setMessagePage(1)
  },
})
const paginatedMessages = computed(() => store.paginatedMessages)
const messagePage = computed(() => store.messagePage)
const messagePageCount = computed(() => store.messagePageCount)
const selectedMessage = computed(() => store.messages.find((item) => item.id === selectedMessageId.value) ?? null)

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
}

const blockReadonlyWrite = (): boolean => {
  if (!readonlyState.readonly) {
    return false
  }

  showToast(readonlyState.message, 'error')
  return true
}

const createStyle = async (payload: { name: string; category: string; prompt: string }): Promise<void> => {
  if (blockReadonlyWrite()) {
    return
  }
  await store.createStyle(payload)
}

const updateStyle = async (
  id: string,
  payload: { name: string; category: string; prompt: string },
): Promise<void> => {
  if (blockReadonlyWrite()) {
    return
  }
  await store.updateStyle(id, payload)
}

const deleteStyle = async (id: string): Promise<void> => {
  if (blockReadonlyWrite()) {
    return
  }
  await store.deleteStyle(id)
}

const createPermission = async (
  payload: { role: string; members: number; permissions: SystemPermissionItem['permissions'] },
): Promise<void> => {
  if (blockReadonlyWrite()) {
    return
  }
  await store.createPermission(payload)
}

const updatePermission = async (
  id: string,
  payload: { role: string; members: number; permissions: SystemPermissionItem['permissions'] },
): Promise<void> => {
  if (blockReadonlyWrite()) {
    return
  }
  await store.updatePermission(id, payload)
}

const deletePermission = async (id: string): Promise<void> => {
  if (blockReadonlyWrite()) {
    return
  }
  await store.deletePermission(id)
}

const setMessagePage = (page: number): void => {
  store.setMessagePage(page)
}

const markAllRead = async (): Promise<void> => {
  await store.markAllRead()
}

const clearMessages = async (): Promise<void> => {
  await store.clearMessages()
  selectedMessageId.value = ''
}

const openMessageDetail = async (id: string): Promise<void> => {
  await store.markMessageRead(id)
  selectedMessageId.value = id
}
</script>
