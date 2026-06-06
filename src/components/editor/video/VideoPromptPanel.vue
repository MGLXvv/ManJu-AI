<template>
  <section class="video-prompt-panel">
    <header class="video-prompt-panel__title">视频提示词</header>

    <textarea
      :value="videoPrompt"
      class="video-prompt-panel__textarea"
      placeholder="请输入视频镜头提示词"
      @input="emit('update-video-prompt', ($event.target as HTMLTextAreaElement).value)"
    />

    <section class="video-voice-table">
      <header class="video-voice-table__row video-voice-table__row--head">
        <span>角色</span>
        <span>音色</span>
        <span>操作</span>
      </header>

      <div v-for="item in characterRows" :key="item.id" class="video-voice-table__row">
        <span class="video-voice-table__cell">{{ item.name }}</span>
        <div class="video-voice-table__cell">
          <label class="video-voice-table__voice-field">
            <select :value="voiceMap[item.id]" @change="updateVoice(item.id, ($event.target as HTMLSelectElement).value)">
              <option v-for="voice in voiceOptions" :key="voice" :value="voice">{{ voice }}</option>
            </select>
          </label>
          <span class="video-voice-table__voice-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4.40187 6.66673L6.66666 4.81371V11.1864L4.40187 9.3334H1.99999V6.66673H4.40187ZM1.33332 10.6667H3.92592L7.45559 13.5546C7.51512 13.6033 7.58972 13.6299 7.66666 13.6299C7.85072 13.6299 7.99999 13.4807 7.99999 13.2966V2.70346C7.99999 2.62651 7.97339 2.55193 7.92466 2.49238C7.80806 2.3499 7.59806 2.3289 7.45559 2.44547L3.92592 5.33338H1.33332C0.965136 5.33338 0.666656 5.63185 0.666656 6.00005V10.0001C0.666656 10.3683 0.965136 10.6667 1.33332 10.6667ZM15.3333 8C15.3333 10.1947 14.3693 12.1642 12.8415 13.5081L11.8963 12.5629C13.1839 11.4625 14 9.82653 14 8C14 6.17344 13.1839 4.53753 11.8963 3.43705L12.8415 2.49186C14.3693 3.83579 15.3333 5.8053 15.3333 8ZM12 8C12 6.72553 11.404 5.59032 10.4755 4.85782L9.52279 5.81056C10.2142 6.29237 10.6667 7.09333 10.6667 8C10.6667 8.90667 10.2142 9.7076 9.52279 10.1894L10.4755 11.1421C11.404 10.4097 12 9.2744 12 8Z"
                fill="#D2D2D2"
              />
            </svg>
          </span>
        </div>
        <button type="button" class="video-voice-table__remove" @click="removeCharacter(item.id)">移除</button>
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
        <button type="button" class="video-dialogue__optimize" aria-label="AI优化对白">
          <FigmaIcon name="result-ai-optimize" :size="20" />
        </button>
      </div>
    </section>

    <section class="video-duration">
      <header class="video-duration__title">时长</header>
      <select :value="String(durationSeconds)" @change="emit('update-duration', Number(($event.target as HTMLSelectElement).value))">
        <option value="5">5 秒</option>
        <option value="10">10 秒</option>
        <option value="15">15 秒</option>
      </select>
    </section>

    <button type="button" class="video-prompt-panel__generate" @click="emit('generate-video')">生成视频</button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { StoryboardShot } from '@/types/storyboard'

const props = defineProps<{
  shot: StoryboardShot
}>()

const emit = defineEmits<{
  (e: 'generate-video'): void
  (e: 'update-video-prompt', value: string): void
  (e: 'update-dialogue', value: string): void
  (e: 'update-duration', value: number): void
  (e: 'update-voice', payload: { characterId: string; voice: string }): void
  (e: 'remove-character', characterId: string): void
}>()

const voiceOptions = ['浑厚男中音', '清亮青年音', '温柔女声', '磁性旁白', '活泼少女音']

const characterRows = computed(() => {
  if (props.shot.characters.length > 0) return props.shot.characters
  return [{ id: 'default-1', name: '默认角色', type: 'character' as const }]
})

const voiceMap = computed<Record<string, string>>(() => {
  const base = Object.fromEntries(characterRows.value.map((item) => [item.id, voiceOptions[0]]))
  for (const assignment of props.shot.voiceAssignments ?? []) {
    base[assignment.characterId] = assignment.voice
  }
  return base
})

const videoPrompt = computed(() => props.shot.videoPrompt ?? props.shot.prompt)
const dialogue = computed(() => props.shot.dialogue ?? '')
const durationSeconds = computed(() => props.shot.durationSeconds ?? 10)

const updateVoice = (characterId: string, voice: string): void => {
  emit('update-voice', { characterId, voice })
}

const removeCharacter = (id: string): void => {
  if (id.startsWith('default-')) return
  emit('remove-character', id)
}
</script>
