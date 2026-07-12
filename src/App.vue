<template>
  <RouterView />
  <GlobalLoadingOverlay />
  <GlobalToastStack />
  <GlobalRuntimeErrorPanel />
</template>

<script setup lang="ts">
import GlobalLoadingOverlay from '@/components/app/GlobalLoadingOverlay.vue'
import GlobalRuntimeErrorPanel from '@/components/app/GlobalRuntimeErrorPanel.vue'
import GlobalToastStack from '@/components/app/GlobalToastStack.vue'
</script>
