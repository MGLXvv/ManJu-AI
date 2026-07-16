<template>
  <section class="voice-manage-page">
    <div class="voice-manage-page__bg" aria-hidden="true"></div>

    <div class="voice-manage-page__content">
      <header class="voice-manage-page__toolbar">
        <label class="voice-manage-page__search">
          <input v-model="keyword" type="text" placeholder="请输入音色名称" />
          <FigmaIcon name="search" :size="18" />
        </label>

        <div class="voice-manage-page__toolbar-right">
          <p class="voice-manage-page__summary">共 {{ filteredVoices.length }} 个音色文件</p>
          <button class="voice-manage-page__batch-btn" type="button" @click="toggleBatchMode">
            {{ batchMode ? '退出批量' : '批量操作' }}
          </button>
        </div>
      </header>

      <BatchSelectionToolbar
        v-if="batchMode"
        action-label="批量删除"
        primary-label="本页全选"
        :selected-count="selectedIds.length"
        :total-count="filteredVoices.length"
        :primary-selected="isPageFullySelected"
        :action-disabled="selectedIds.length === 0"
        @exit="exitBatchMode"
        @toggle-primary="toggleSelectCurrentPage"
        @action="deleteSelected"
      />

      <div class="voice-manage-page__grid">
        <button v-if="!batchMode && !adding" type="button" class="voice-add-card" @click="beginAdd">
          <span>添加音色</span>
        </button>

        <VoiceEditorCard
          v-else-if="!batchMode && adding"
          v-model="draftName"
          @save="saveNewVoice"
          @cancel="cancelAdd"
        />

        <template v-for="voice in pagedVoices" :key="voice.id">
          <VoiceEditorCard
            v-if="editingId === voice.id"
            v-model="draftName"
            :audio-url="draftAudioUrl"
            :show-delete="true"
            @save="(payload) => saveEditingVoice(voice.id, payload)"
            @delete="deleteVoice(voice.id)"
            @cancel="cancelEdit"
          />
          <VoiceCard
            v-else
            :voice="voice"
            :batch-mode="batchMode"
            :selected="selectedIds.includes(voice.id)"
            @edit="beginEdit"
            @delete="deleteVoice"
            @toggle-select="toggleSelect"
          />
        </template>
      </div>

      <footer class="project-pagination">
        <span class="voice-manage-page__pagination-total">共 {{ totalPages }} 页</span>
        <button
          type="button"
          class="project-pagination__arrow is-plain"
          :disabled="currentPage === 1"
          @click="currentPage -= 1"
        >
          ‹
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          class="project-pagination__item"
          :class="{ 'is-active': currentPage === page }"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <button
          type="button"
          class="project-pagination__arrow is-plain"
          :disabled="currentPage === totalPages"
          @click="currentPage += 1"
        >
          ›
        </button>

        <div class="project-pagination__jump-wrap">
          <select v-model.number="currentPage" class="project-pagination__select">
            <option v-for="page in totalPages" :key="page" :value="page">{{ page }}/页</option>
          </select>
          <FigmaIcon class="project-pagination__select-icon" name="chevron-down" :size="14" />
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BatchSelectionToolbar from '@/components/editor/common/BatchSelectionToolbar.vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import VoiceCard from '@/components/voice/VoiceCard.vue'
import VoiceEditorCard from '@/components/voice/VoiceEditorCard.vue'
import { useVoicesStore } from '@/stores/voices'
import type { VoiceEditorSavePayload } from '@/types/voice'

const store = useVoicesStore()

const PAGE_SIZE = 8

const batchMode = ref(false)
const adding = ref(false)
const editingId = ref('')
const draftName = ref('')
const draftAudioUrl = ref('')
const selectedIds = ref<string[]>([])
const currentPage = ref(1)

const keyword = computed({
  get: () => store.keyword,
  set: (value: string) => store.setKeyword(value),
})

const filteredVoices = computed(() => store.filteredVoices)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredVoices.value.length / PAGE_SIZE)))
const pagedVoices = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredVoices.value.slice(start, start + PAGE_SIZE)
})
const currentPageIds = computed(() => pagedVoices.value.map((voice) => voice.id))
const isPageFullySelected = computed(
  () => currentPageIds.value.length > 0 && currentPageIds.value.every((id) => selectedIds.value.includes(id)),
)
const visiblePages = computed(() => {
  const pages = Array.from({ length: totalPages.value }, (_, index) => index + 1)
  return pages.slice(0, 5)
})

onMounted(() => {
  void store.hydrate()
})

watch(filteredVoices, (value) => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }

  selectedIds.value = selectedIds.value.filter((id) => value.some((voice) => voice.id === id))
})

const resetDraft = (): void => {
  draftName.value = ''
  draftAudioUrl.value = ''
}

const beginAdd = (): void => {
  adding.value = true
  editingId.value = ''
  resetDraft()
}

const cancelAdd = (): void => {
  adding.value = false
  resetDraft()
}

const saveNewVoice = async (payload: VoiceEditorSavePayload): Promise<void> => {
  await store.createVoice(payload)
  adding.value = false
  resetDraft()
  currentPage.value = 1
}

const beginEdit = (id: string): void => {
  const voice = store.voices.find((item) => item.id === id)
  if (!voice) return
  adding.value = false
  editingId.value = id
  draftName.value = voice.name
  draftAudioUrl.value = voice.audioUrl
}

const cancelEdit = (): void => {
  editingId.value = ''
  resetDraft()
}

const saveEditingVoice = async (id: string, payload: VoiceEditorSavePayload): Promise<void> => {
  await store.updateVoice(id, payload)
  cancelEdit()
}

const deleteVoice = async (id: string): Promise<void> => {
  await store.deleteVoice(id)
  selectedIds.value = selectedIds.value.filter((item) => item !== id)
  if (editingId.value === id) {
    cancelEdit()
  }
}

const toggleBatchMode = (): void => {
  if (batchMode.value) {
    exitBatchMode()
    return
  }

  adding.value = false
  editingId.value = ''
  batchMode.value = true
}

const exitBatchMode = (): void => {
  batchMode.value = false
  selectedIds.value = []
}

const toggleSelect = (id: string): void => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((item) => item !== id)
    : [...selectedIds.value, id]
}

const toggleSelectCurrentPage = (): void => {
  if (isPageFullySelected.value) {
    selectedIds.value = selectedIds.value.filter((id) => !currentPageIds.value.includes(id))
    return
  }

  selectedIds.value = Array.from(new Set([...selectedIds.value, ...currentPageIds.value]))
}

const deleteSelected = async (): Promise<void> => {
  for (const id of [...selectedIds.value]) {
    await store.deleteVoice(id)
  }
  exitBatchMode()
}
</script>
