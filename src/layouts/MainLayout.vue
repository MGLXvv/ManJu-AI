<template>
  <div class="main-layout">
    <AppTopBar />
    <main class="main-layout__body">
      <div class="main-layout__content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppTopBar from '@/components/navigation/AppTopBar.vue'
</script>
