<template>
  <section class="video-prompt-panel">
    <header class="video-prompt-panel__title">视频提示词</header>

    <textarea v-model="videoPrompt" class="video-prompt-panel__textarea" placeholder="请输入视频镜头提示词" />

    <section class="video-voice-table">
      <header class="video-voice-table__row video-voice-table__row--head">
        <span>角色</span>
        <span>音色</span>
        <span>操作</span>
      </header>

      <div v-for="item in characterRows" :key="item.id" class="video-voice-table__row">
        <span class="video-voice-table__cell">{{ item.name }}</span>
        <label class="video-voice-table__cell">
          <select v-model="voiceMap[item.id]">
            <option v-for="voice in voiceOptions" :key="voice" :value="voice">{{ voice }}</option>
          </select>
        </label>
        <button type="button" class="video-voice-table__remove" @click="removeCharacter(item.id)">移除</button>
      </div>
    </section>

    <section class="video-dialogue">
      <header class="video-dialogue__title">对白</header>
      <textarea v-model="dialogue" class="video-dialogue__textarea" placeholder="请输入对白内容" />
    </section>

    <section class="video-duration">
      <span>时长</span>
      <select v-model="duration">
        <option value="5">5 秒</option>
        <option value="10">10 秒</option>
        <option value="15">15 秒</option>
      </select>
    </section>

    <button type="button" class="video-prompt-panel__generate" @click="$emit('generate-video')">生成视频</button>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { StoryboardShot } from '@/types/storyboard'

const props = defineProps<{
  shot: StoryboardShot
}>()

defineEmits<{
  (e: 'generate-video'): void
}>()

const videoPrompt = ref(props.shot.prompt)
const dialogue = ref('')
const duration = ref('10')
const voiceOptions = ['浑厚男中音', '清亮青年音', '温柔女声', '磁性旁白', '活泼少女音']
const voiceMap = ref<Record<string, string>>({})

const characterRows = computed(() => {
  if (props.shot.characters.length > 0) return props.shot.characters
  return [{ id: 'default-1', name: '默认角色', type: 'character' as const }]
})

watch(
  characterRows,
  (rows) => {
    for (const row of rows) {
      if (!voiceMap.value[row.id]) {
        voiceMap.value[row.id] = voiceOptions[0]
      }
    }
  },
  { immediate: true },
)

const removeCharacter = (id: string): void => {
  if (id.startsWith('default-')) return
  delete voiceMap.value[id]
}
</script>
