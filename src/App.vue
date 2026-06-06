<template>
  <RouterView />
  <GlobalLoadingOverlay />
  <GlobalToastStack />
</template>

<script setup lang="ts">
import GlobalLoadingOverlay from '@/components/app/GlobalLoadingOverlay.vue'
import GlobalToastStack from '@/components/app/GlobalToastStack.vue'
</script>
