<template>
  <section class="script-panel script-result-panel">
    <header class="script-panel__header">
      <h2 class="script-panel__title">剧本生成</h2>
    </header>

    <div class="script-result-panel__body">
      <div v-if="loading" class="script-result-panel__placeholder">正在生成剧本...</div>
      <textarea
        v-else
        v-model="model"
        class="script-result-panel__textarea"
        placeholder="生成结果会显示在这里"
      />
    </div>

    <footer class="script-result-panel__footer">
      <span>共{{ model.length }}个字</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  loading?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>
