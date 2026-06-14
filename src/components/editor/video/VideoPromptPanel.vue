<template>
  <section class="video-prompt-panel">
    <div class="video-prompt-panel__title-row">
      <header class="video-prompt-panel__title">视频提示词</header>
      <input ref="attachmentInputRef" class="video-prompt-panel__file-input" type="file" multiple @change="handleAttachmentChange" />
    </div>

    <div class="video-prompt-panel__field">
      <textarea
        :value="videoPrompt"
        class="video-prompt-panel__textarea"
        placeholder="请输入视频镜头提示词"
        @input="emit('update-video-prompt', ($event.target as HTMLTextAreaElement).value)"
      />
      <button type="button" class="video-prompt-panel__attach" aria-label="上传附件" @click="triggerAttachmentUpload">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M15.3032 12.9462L14.1247 11.7677L15.3032 10.5892C16.9304 8.96201 16.9304 6.32381 15.3032 4.69663C13.676 3.06944 11.0378 3.06944 9.4106 4.69663L8.23209 5.87514L7.05359 4.69663L8.23209 3.51811C10.5102 1.24006 14.2036 1.24006 16.4817 3.51811C18.7598 5.79617 18.7598 9.4896 16.4817 11.7677L15.3032 12.9462ZM12.9461 15.3033L11.7676 16.4818C9.4896 18.7598 5.79611 18.7598 3.51805 16.4818C1.23999 14.2037 1.23999 10.5102 3.51805 8.23216L4.69656 7.05365L5.87508 8.23216L4.69656 9.41068C3.06938 11.0378 3.06938 13.676 4.69656 15.3033C6.32374 16.9304 8.96194 16.9304 10.5891 15.3033L11.7676 14.1247L12.9461 15.3033ZM12.3569 6.4644L13.5354 7.64291L7.64284 13.5354L6.46433 12.3569L12.3569 6.4644Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        type="button"
        class="video-prompt-panel__optimize"
        :disabled="optimizingVideoPrompt"
        aria-label="AI优化视频提示词"
        @click="emit('optimize-video-prompt')"
      >
        <FigmaIcon name="result-ai-optimize" :size="20" />
      </button>
    </div>

    <div v-if="attachmentItems.length > 0" class="video-prompt-panel__attachments">
      <button
        v-for="attachment in attachmentItems"
        :key="attachment.id"
        type="button"
        class="video-prompt-panel__attachment-chip"
        :title="attachment.name"
        @click="emit('remove-attachment', attachment.id)"
      >
        <span class="video-prompt-panel__attachment-name">{{ attachment.name }}</span>
        <span class="video-prompt-panel__attachment-remove">×</span>
      </button>
    </div>

    <section class="video-voice-table">
      <header class="video-voice-table__header">
        <span>角色</span>
        <span>音色</span>
        <span>操作</span>
      </header>

      <div class="video-voice-table__body">
        <template v-for="item in voiceRows" :key="item.id">
          <div class="video-voice-table__row">
            <div class="video-voice-table__cell video-voice-table__cell--role">
              <span class="video-voice-table__role-name">{{ resolveCharacterName(item.characterId) }}</span>
            </div>

            <div class="video-voice-table__cell video-voice-table__cell--voice">
              <label class="video-voice-table__select-shell">
                <AppInlineSelect
                  :model-value="item.voice"
                  :options="voiceSelectOptions"
                  variant="plain"
                  class="video-voice-table__inline-select"
                  trigger-class="video-voice-table__inline-select-trigger"
                  menu-class="video-voice-table__inline-select-menu"
                  option-class="video-voice-table__inline-select-option"
                  @update:model-value="emit('update-voice', { assignmentId: item.id, voice: String($event) })"
                />
                <span class="video-voice-table__audio-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4.40187 6.66673L6.66666 4.81371V11.1864L4.40187 9.3334H1.99999V6.66673H4.40187ZM1.33332 10.6667H3.92592L7.45559 13.5546C7.51512 13.6033 7.58972 13.6299 7.66666 13.6299C7.85072 13.6299 7.99999 13.4807 7.99999 13.2966V2.70346C7.99999 2.62651 7.97339 2.55193 7.92466 2.49238C7.80806 2.3499 7.59806 2.3289 7.45559 2.44547L3.92592 5.33338H1.33332C0.965136 5.33338 0.666656 5.63185 0.666656 6.00005V10.0001C0.666656 10.3683 0.965136 10.6667 1.33332 10.6667ZM15.3333 8C15.3333 10.1947 14.3693 12.1642 12.8415 13.5081L11.8963 12.5629C13.1839 11.4625 14 9.82653 14 8C14 6.17344 13.1839 4.53753 11.8963 3.43705L12.8415 2.49186C14.3693 3.83579 15.3333 5.8053 15.3333 8ZM12 8C12 6.72553 11.404 5.59032 10.4755 4.85782L9.52279 5.81056C10.2142 6.29237 10.6667 7.09333 10.6667 8C10.6667 8.90667 10.2142 9.7076 9.52279 10.1894L10.4755 11.1421C11.404 10.4097 12 9.2744 12 8Z"
                      fill="#D2D2D2"
                    />
                  </svg>
                </span>
              </label>
            </div>

            <div class="video-voice-table__cell video-voice-table__cell--actions video-voice-table__cell--ops-panel">
              <button type="button" class="video-voice-table__icon-action" aria-label="新增角色音色行" title="新增" @click="addDraftRow(item.id)">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M9 3V15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path d="M3 9H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
              </button>

              <button type="button" class="video-voice-table__icon-action" aria-label="复制角色音色行" title="复制" @click="duplicateDraftRow(item.id)">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="6.25" y="4.25" width="7.5" height="9.5" rx="1.75" stroke="currentColor" stroke-width="1.5" />
                  <path d="M4.5 11.5H4.25C3.2835 11.5 2.5 10.7165 2.5 9.75V4.25C2.5 3.2835 3.2835 2.5 4.25 2.5H9.75C10.7165 2.5 11.5 3.2835 11.5 4.25V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>

              <button
                type="button"
                class="video-voice-table__icon-action video-voice-table__icon-action--danger"
                aria-label="删除角色音色"
                title="删除"
                @click="emit('remove-character', item.id)"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M4.25 5H13.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <path d="M7 2.75H11L11.5 4.25H6.5L7 2.75Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                  <path d="M6 6.25V12.25C6 13.2165 6.7835 14 7.75 14H10.25C11.2165 14 12 13.2165 12 12.25V6.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <path d="M7.75 8.25V11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <path d="M10.25 8.25V11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div
            v-for="draft in draftsAfter(item.id)"
            :key="draft.id"
            class="video-voice-table__row video-voice-table__row--draft"
            :class="{ 'is-copy': draft.kind === 'copy' }"
          >
            <div class="video-voice-table__cell video-voice-table__cell--role video-voice-table__cell--draft-highlight">
              <label class="video-voice-table__select-shell">
                <AppInlineSelect
                  v-model="draft.characterId"
                  :options="characterSelectOptions"
                  placeholder="选择角色"
                  variant="plain"
                  class="video-voice-table__inline-select video-voice-table__inline-select--draft"
                  trigger-class="video-voice-table__inline-select-trigger video-voice-table__inline-select-trigger--draft"
                  menu-class="video-voice-table__inline-select-menu"
                  option-class="video-voice-table__inline-select-option"
                />
              </label>
            </div>

            <div class="video-voice-table__cell video-voice-table__cell--voice video-voice-table__cell--draft-highlight">
              <label class="video-voice-table__select-shell">
                <AppInlineSelect
                  v-model="draft.voice"
                  :options="voiceSelectOptions"
                  variant="plain"
                  class="video-voice-table__inline-select video-voice-table__inline-select--draft"
                  trigger-class="video-voice-table__inline-select-trigger video-voice-table__inline-select-trigger--draft"
                  menu-class="video-voice-table__inline-select-menu"
                  option-class="video-voice-table__inline-select-option"
                />
              </label>
            </div>

            <div class="video-voice-table__cell video-voice-table__cell--actions video-voice-table__cell--ops-panel">
              <button
                type="button"
                class="video-voice-table__text-action video-voice-table__text-action--primary"
                :disabled="!draft.characterId"
                @click="saveDraftRow(draft.id)"
              >
                确认
              </button>
              <button type="button" class="video-voice-table__text-action video-voice-table__text-action--danger" @click="removeDraftRow(draft.id)">
                删除
              </button>
            </div>
          </div>
        </template>

        <template v-if="showDemoRows">
          <template v-for="demo in demoRows" :key="demo.id">
            <div class="video-voice-table__row">
              <div class="video-voice-table__cell video-voice-table__cell--role">
                <span class="video-voice-table__role-name">{{ demo.name }}</span>
              </div>

              <div class="video-voice-table__cell video-voice-table__cell--voice">
                <label class="video-voice-table__select-shell">
                  <AppInlineSelect
                    :model-value="demo.voice"
                    :options="voiceSelectOptions"
                    variant="plain"
                    class="video-voice-table__inline-select"
                    trigger-class="video-voice-table__inline-select-trigger"
                    menu-class="video-voice-table__inline-select-menu"
                    option-class="video-voice-table__inline-select-option"
                    disabled
                  />
                  <span class="video-voice-table__audio-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M4.40187 6.66673L6.66666 4.81371V11.1864L4.40187 9.3334H1.99999V6.66673H4.40187ZM1.33332 10.6667H3.92592L7.45559 13.5546C7.51512 13.6033 7.58972 13.6299 7.66666 13.6299C7.85072 13.6299 7.99999 13.4807 7.99999 13.2966V2.70346C7.99999 2.62651 7.97339 2.55193 7.92466 2.49238C7.80806 2.3499 7.59806 2.3289 7.45559 2.44547L3.92592 5.33338H1.33332C0.965136 5.33338 0.666656 5.63185 0.666656 6.00005V10.0001C0.666656 10.3683 0.965136 10.6667 1.33332 10.6667ZM15.3333 8C15.3333 10.1947 14.3693 12.1642 12.8415 13.5081L11.8963 12.5629C13.1839 11.4625 14 9.82653 14 8C14 6.17344 13.1839 4.53753 11.8963 3.43705L12.8415 2.49186C14.3693 3.83579 15.3333 5.8053 15.3333 8ZM12 8C12 6.72553 11.404 5.59032 10.4755 4.85782L9.52279 5.81056C10.2142 6.29237 10.6667 7.09333 10.6667 8C10.6667 8.90667 10.2142 9.7076 9.52279 10.1894L10.4755 11.1421C11.404 10.4097 12 9.2744 12 8Z"
                        fill="#D2D2D2"
                      />
                    </svg>
                  </span>
                </label>
              </div>

              <div class="video-voice-table__cell video-voice-table__cell--actions video-voice-table__cell--ops-panel">
                <button type="button" class="video-voice-table__icon-action" aria-label="新增角色音色行" title="新增" @click="addDraftRow(demo.id)">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M9 3V15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    <path d="M3 9H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </button>

                <button type="button" class="video-voice-table__icon-action" aria-label="复制角色音色行" title="复制" @click="duplicateDemoRow(demo)">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect x="6.25" y="4.25" width="7.5" height="9.5" rx="1.75" stroke="currentColor" stroke-width="1.5" />
                    <path d="M4.5 11.5H4.25C3.2835 11.5 2.5 10.7165 2.5 9.75V4.25C2.5 3.2835 3.2835 2.5 4.25 2.5H9.75C10.7165 2.5 11.5 3.2835 11.5 4.25V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </button>

                <button
                  type="button"
                  class="video-voice-table__icon-action video-voice-table__icon-action--danger"
                  aria-label="删除角色音色"
                  title="删除"
                  @click="removeDemoRow(demo.id)"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M4.25 5H13.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    <path d="M7 2.75H11L11.5 4.25H6.5L7 2.75Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                    <path d="M6 6.25V12.25C6 13.2165 6.7835 14 7.75 14H10.25C11.2165 14 12 13.2165 12 12.25V6.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    <path d="M7.75 8.25V11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    <path d="M10.25 8.25V11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              v-for="draft in draftsAfter(demo.id)"
              :key="draft.id"
              class="video-voice-table__row video-voice-table__row--draft"
              :class="{ 'is-copy': draft.kind === 'copy' }"
            >
              <div class="video-voice-table__cell video-voice-table__cell--role video-voice-table__cell--draft-highlight">
                <label class="video-voice-table__select-shell">
                  <AppInlineSelect
                    v-model="draft.characterId"
                    :options="characterSelectOptions"
                    placeholder="选择角色"
                    variant="plain"
                    class="video-voice-table__inline-select video-voice-table__inline-select--draft"
                    trigger-class="video-voice-table__inline-select-trigger video-voice-table__inline-select-trigger--draft"
                    menu-class="video-voice-table__inline-select-menu"
                    option-class="video-voice-table__inline-select-option"
                  />
                </label>
              </div>

              <div class="video-voice-table__cell video-voice-table__cell--voice video-voice-table__cell--draft-highlight">
                <label class="video-voice-table__select-shell">
                  <AppInlineSelect
                    v-model="draft.voice"
                    :options="voiceSelectOptions"
                    variant="plain"
                    class="video-voice-table__inline-select video-voice-table__inline-select--draft"
                    trigger-class="video-voice-table__inline-select-trigger video-voice-table__inline-select-trigger--draft"
                    menu-class="video-voice-table__inline-select-menu"
                    option-class="video-voice-table__inline-select-option"
                  />
                </label>
              </div>

              <div class="video-voice-table__cell video-voice-table__cell--actions video-voice-table__cell--ops-panel">
                <button
                  type="button"
                  class="video-voice-table__text-action video-voice-table__text-action--primary"
                  :disabled="!draft.characterId"
                  @click="saveDraftRow(draft.id)"
                >
                  确认
                </button>
                <button type="button" class="video-voice-table__text-action video-voice-table__text-action--danger" @click="removeDraftRow(draft.id)">
                  删除
                </button>
              </div>
            </div>
          </template>
        </template>

        <div
          v-for="draft in rootDraftRows"
          :key="draft.id"
          class="video-voice-table__row video-voice-table__row--draft"
          :class="{ 'is-copy': draft.kind === 'copy' }"
        >
          <div class="video-voice-table__cell video-voice-table__cell--role video-voice-table__cell--draft-highlight">
            <label class="video-voice-table__select-shell">
              <AppInlineSelect
                v-model="draft.characterId"
                :options="characterSelectOptions"
                placeholder="选择角色"
                variant="plain"
                class="video-voice-table__inline-select video-voice-table__inline-select--draft"
                trigger-class="video-voice-table__inline-select-trigger video-voice-table__inline-select-trigger--draft"
                menu-class="video-voice-table__inline-select-menu"
                option-class="video-voice-table__inline-select-option"
              />
            </label>
          </div>

          <div class="video-voice-table__cell video-voice-table__cell--voice video-voice-table__cell--draft-highlight">
            <label class="video-voice-table__select-shell">
              <AppInlineSelect
                v-model="draft.voice"
                :options="voiceSelectOptions"
                variant="plain"
                class="video-voice-table__inline-select video-voice-table__inline-select--draft"
                trigger-class="video-voice-table__inline-select-trigger video-voice-table__inline-select-trigger--draft"
                menu-class="video-voice-table__inline-select-menu"
                option-class="video-voice-table__inline-select-option"
              />
            </label>
          </div>

          <div class="video-voice-table__cell video-voice-table__cell--actions video-voice-table__cell--ops-panel">
            <button
              type="button"
              class="video-voice-table__text-action video-voice-table__text-action--primary"
              :disabled="!draft.characterId"
              @click="saveDraftRow(draft.id)"
            >
              确认
            </button>
            <button type="button" class="video-voice-table__text-action video-voice-table__text-action--danger" @click="removeDraftRow(draft.id)">
              删除
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="video-dialogue">
      <header class="video-dialogue__title">对白</header>
      <div class="video-dialogue__field">
        <textarea
          :value="dialogue"
          class="video-dialogue__textarea"
          placeholder="请输入对白内容"
          @input="emit('update-dialogue', ($event.target as HTMLTextAreaElement).value)"
        />
        <button
          type="button"
          class="video-dialogue__optimize"
          :disabled="optimizingDialogue"
          aria-label="AI优化对白"
          @click="emit('optimize-dialogue')"
        >
          <FigmaIcon name="result-ai-optimize" :size="20" />
        </button>
      </div>
    </section>

    <section class="video-duration">
      <header class="video-duration__title">时长</header>
      <AppInlineSelect
        :model-value="String(durationSeconds)"
        :options="durationSelectOptions"
        class="video-duration__inline-select"
        trigger-class="video-duration__inline-select-trigger"
        menu-class="video-duration__inline-select-menu"
        option-class="video-duration__inline-select-option"
        @update:model-value="emit('update-duration', Number($event))"
      />
    </section>

    <button type="button" class="video-prompt-panel__generate" @click="emit('generate-video')">生成视频</button>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppInlineSelect, { type AppInlineSelectOption } from '@/components/common/AppInlineSelect.vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { StoryboardAttachment, StoryboardShot, StoryboardTag, StoryboardVoiceAssignment } from '@/types/storyboard'

type VoiceDraftRow = {
  id: string
  afterId: string | null
  kind: 'add' | 'copy'
  characterId: string
  voice: string
}

type DemoVoiceRow = {
  id: string
  characterId: string
  name: string
  voice: string
}

const props = defineProps<{
  shot: StoryboardShot
  availableCharacters?: StoryboardTag[]
  optimizingVideoPrompt?: boolean
  optimizingDialogue?: boolean
}>()

const emit = defineEmits<{
  (e: 'generate-video'): void
  (e: 'update-video-prompt', value: string): void
  (e: 'update-dialogue', value: string): void
  (e: 'optimize-video-prompt'): void
  (e: 'optimize-dialogue'): void
  (e: 'update-duration', value: number): void
  (e: 'update-voice', payload: { assignmentId: string; voice: string }): void
  (e: 'remove-character', assignmentId: string): void
  (e: 'add-character', payload: { characterId: string; voice: string; afterId?: string | null }): void
  (e: 'upload-attachments', files: File[]): void
  (e: 'remove-attachment', attachmentId: string): void
}>()

const voiceOptions = ['温柔女中音', '可爱女声音', '浑厚男中音', '清亮青年音', '温柔女声', '磁性旁白', '活泼少女音']
const voiceSelectOptions: AppInlineSelectOption[] = voiceOptions.map((voice) => ({ label: voice, value: voice }))
const durationSelectOptions: AppInlineSelectOption[] = [
  { label: '5 秒', value: '5' },
  { label: '10 秒', value: '10' },
  { label: '15 秒', value: '15' },
]

const attachmentInputRef = ref<HTMLInputElement | null>(null)
const draftRows = ref<VoiceDraftRow[]>([])
const hiddenDemoRowIds = ref<string[]>([])
const seededDraftShotId = ref<string | null>(null)

const availableCharacterOptions = computed(() => props.availableCharacters ?? [])
const characterPool = computed(() => {
  const merged = [...availableCharacterOptions.value]
  for (const item of props.shot.characters) {
    if (!merged.some((entry) => entry.id === item.id)) {
      merged.push(item)
    }
  }
  return merged
})
const characterSelectOptions = computed<AppInlineSelectOption[]>(() =>
  characterPool.value.map((item) => ({
    label: item.name,
    value: item.id,
  })),
)
const attachmentItems = computed<StoryboardAttachment[]>(() => props.shot.attachments ?? [])
const videoPrompt = computed(() => props.shot.videoPrompt ?? props.shot.prompt)
const dialogue = computed(() => props.shot.dialogue ?? '')
const durationSeconds = computed(() => props.shot.durationSeconds ?? 10)
const voiceRows = computed<StoryboardVoiceAssignment[]>(() => props.shot.voiceAssignments ?? [])
const showDemoRows = computed(() => voiceRows.value.length === 0)

const buildDraftId = (): string => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const buildDraftRow = (afterId: string | null, kind: VoiceDraftRow['kind'], characterId = '', voice = voiceOptions[0]): VoiceDraftRow => ({
  id: buildDraftId(),
  afterId,
  kind,
  characterId,
  voice,
})

const pickDemoCharacter = (index: number) => characterPool.value[index] ?? null

const demoRows = computed<DemoVoiceRow[]>(() => {
  if (!showDemoRows.value) {
    return []
  }

  const presets = [
    { id: 'demo-1', fallbackName: '许红豆', fallbackVoice: voiceOptions[0] },
    { id: 'demo-2', fallbackName: '娜娜', fallbackVoice: voiceOptions[1] ?? voiceOptions[0] },
  ]

  return presets
    .map((preset, index) => {
      const target = pickDemoCharacter(index)
      return {
        id: preset.id,
        characterId: target?.id ?? '',
        name: target?.name ?? preset.fallbackName,
        voice: preset.fallbackVoice,
      }
    })
    .filter((item) => !hiddenDemoRowIds.value.includes(item.id))
})

const draftsAfter = (afterId: string | null): VoiceDraftRow[] => draftRows.value.filter((item) => item.afterId === afterId)
const rootDraftRows = computed<VoiceDraftRow[]>(() => draftsAfter(null))

watch(
  () => props.shot.id,
  () => {
    draftRows.value = []
    hiddenDemoRowIds.value = []
    seededDraftShotId.value = null
  },
  { immediate: true },
)

watch(
  () => voiceRows.value.length,
  (length) => {
    if (length > 0) {
      hiddenDemoRowIds.value = []
      return
    }

    if (seededDraftShotId.value === props.shot.id) {
      return
    }

    draftRows.value.push(
      buildDraftRow(
        null,
        'add',
        pickDemoCharacter(2)?.id ?? pickDemoCharacter(0)?.id ?? '',
        voiceOptions[2] ?? voiceOptions[0],
      ),
    )
    seededDraftShotId.value = props.shot.id
  },
  { immediate: true },
)

const resolveCharacterName = (characterId: string): string => {
  return characterPool.value.find((item) => item.id === characterId)?.name ?? '默认角色'
}

const triggerAttachmentUpload = (): void => {
  attachmentInputRef.value?.click()
}

const handleAttachmentChange = (event: Event): void => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length > 0) {
    emit('upload-attachments', files)
  }
  input.value = ''
}

const addDraftRow = (afterId: string | null = null): void => {
  draftRows.value.push(buildDraftRow(afterId, 'add'))
}

const duplicateDraftRow = (assignmentId: string): void => {
  const source = voiceRows.value.find((item) => item.id === assignmentId)
  if (!source) return
  draftRows.value.push(buildDraftRow(assignmentId, 'copy', source.characterId, source.voice))
}

const duplicateDemoRow = (demo: DemoVoiceRow): void => {
  draftRows.value.push(buildDraftRow(demo.id, 'copy', demo.characterId, demo.voice))
}

const removeDemoRow = (demoId: string): void => {
  hiddenDemoRowIds.value = [...hiddenDemoRowIds.value, demoId]
}

const removeDraftRow = (draftId: string): void => {
  draftRows.value = draftRows.value.filter((item) => item.id !== draftId)
}

const saveDraftRow = (draftId: string): void => {
  const draft = draftRows.value.find((item) => item.id === draftId)
  if (!draft?.characterId) return

  emit('add-character', {
    characterId: draft.characterId,
    voice: draft.voice,
    afterId: draft.afterId,
  })
  removeDraftRow(draftId)
}
</script>
