<template>
  <div class="main-layout">
    <AppTopBar />
    <main class="main-layout__body" :class="{ 'is-dashboard': route.name === 'projects' }">
      <div class="main-layout__content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppTopBar from '@/components/navigation/AppTopBar.vue'

const route = useRoute()
</script>
