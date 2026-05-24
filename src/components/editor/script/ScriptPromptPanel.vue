<template>
  <section class="script-panel script-prompt-panel">
    <header class="script-panel__header">
      <h2 class="script-panel__title">编辑提示词</h2>
    </header>

    <textarea
      v-model="model"
      class="script-prompt-panel__textarea"
      placeholder="请输入生成剧本时的要求，例如字数、风格、剧情重点、角色表现等"
    />
  </section>
</template>

<script setup lang="ts">
const model = defineModel<string>({ required: true })
</script>
