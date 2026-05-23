<template>
  <div class="main-layout">
    <AppTopBar />
    <main class="main-layout__body">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppTopBar from '@/components/navigation/AppTopBar.vue'
</script>
