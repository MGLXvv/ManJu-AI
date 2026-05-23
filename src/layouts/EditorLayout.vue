<template>
  <div class="editor-layout">
    <TopNav />
    <WorkflowStepper />
    <main class="editor-layout__body">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import TopNav from '@/components/layout/TopNav.vue'
import WorkflowStepper from '@/components/editor/WorkflowStepper.vue'
</script>
