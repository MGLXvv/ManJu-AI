<template>
  <div class="editor-layout">
    <AppTopBar />
    <div class="editor-layout__body">
      <EditorSideNav />
      <main class="editor-layout__workspace">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import AppTopBar from '@/components/navigation/AppTopBar.vue'
import EditorSideNav from '@/components/navigation/EditorSideNav.vue'
import { retainRuntimeResource } from '@/services/runtime/runtimeResourceDiagnostics'

let releaseEditorMount: (() => void) | null = null

onMounted(() => {
  releaseEditorMount = retainRuntimeResource('mountedEditors')
})

onBeforeUnmount(() => {
  releaseEditorMount?.()
  releaseEditorMount = null
})
</script>
