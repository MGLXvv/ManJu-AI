<template>
  <section class="placeholder-page">
    <h1>{{ title }}</h1>
    <p>模块入口已预留，后续按业务优先级补充页面内容。</p>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
