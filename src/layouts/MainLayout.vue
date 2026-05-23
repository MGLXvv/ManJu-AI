<template>
  <div class="main-layout">
    <TopNav />
    <main class="main-layout__body">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import TopNav from '@/components/layout/TopNav.vue'
</script>
