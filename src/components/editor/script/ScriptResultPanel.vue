<template>
  <section class="script-result-block">
    <h2 class="script-column-title">剧本生成</h2>

    <div class="script-result-card">
      <div class="script-result-card__body">
        <div v-if="loading" class="script-result-card__placeholder">正在生成剧本...</div>

        <div v-else-if="!model.trim()" class="script-result-empty" aria-hidden="true">
          <div class="script-result-empty__ufo">🛸</div>
        </div>

        <textarea
          v-else
          v-model="model"
          class="script-result-card__textarea"
          placeholder="生成结果会显示在这里"
        />
      </div>

      <footer class="script-result-card__footer">
        <span class="script-result-card__count">共{{ model.length }}个字</span>

        <div class="script-result-card__tools">
          <button type="button" aria-label="全屏">
            <FigmaIcon name="editor-fullscreen" :size="16" />
          </button>
          <button type="button" aria-label="AI 优化">
            <FigmaIcon name="editor-ai-optimize" :size="16" />
          </button>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

defineProps<{
  loading?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>
