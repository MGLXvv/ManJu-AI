<template>
  <Teleport to="body">
    <div v-if="diagnostic" class="runtime-error-backdrop" role="presentation">
      <section
        ref="dialogRef"
        class="runtime-error-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="runtime-error-title"
        aria-describedby="runtime-error-description"
        tabindex="-1"
      >
        <div class="runtime-error-panel__badge">运行异常</div>
        <h2 id="runtime-error-title">页面遇到了一些问题</h2>
        <p id="runtime-error-description">{{ diagnostic.message }}</p>
        <dl class="runtime-error-panel__meta">
          <div>
            <dt>错误代码</dt>
            <dd>{{ diagnostic.code }}</dd>
          </div>
          <div>
            <dt>发生时间</dt>
            <dd>{{ formattedTime }}</dd>
          </div>
        </dl>
        <p v-if="corruptedEntryCount > 0" class="runtime-error-panel__hint" aria-live="polite">
          已隔离 {{ corruptedEntryCount }} 项损坏的本地数据，可以清理后重新加载。
        </p>
        <div class="runtime-error-panel__actions">
          <button
            class="runtime-error-panel__button runtime-error-panel__button--primary"
            type="button"
            @click="reloadPage"
          >
            重新加载
          </button>
          <button
            v-if="corruptedEntryCount > 0"
            class="runtime-error-panel__button"
            type="button"
            @click="clearAndReload"
          >
            清理损坏缓存
          </button>
          <button class="runtime-error-panel__button" type="button" @click="goToProjects">返回项目列表</button>
          <button class="runtime-error-panel__button runtime-error-panel__button--quiet" type="button" @click="dismiss">
            暂时关闭
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { clearCorruptedLocalEntries, listCorruptedLocalEntries } from '@/api/local'
import { useAccessibleDialog } from '@/composables/useAccessibleDialog'
import {
  clearRuntimeErrors,
  getCurrentRuntimeError,
  subscribeRuntimeErrors,
  type RuntimeDiagnostic,
} from '@/services/runtime/runtimeDiagnostics'

const diagnostic = shallowRef<RuntimeDiagnostic | null>(getCurrentRuntimeError())
const corruptedEntryCount = ref(listCorruptedLocalEntries().length)
const isOpen = computed(() => Boolean(diagnostic.value))
let unsubscribe: (() => void) | null = null

const formattedTime = computed(() => {
  if (!diagnostic.value) {
    return ''
  }
  return new Date(diagnostic.value.timestamp).toLocaleString()
})

const refreshCorruptedEntryCount = (): void => {
  corruptedEntryCount.value = listCorruptedLocalEntries().length
}

const dismiss = (): void => {
  clearRuntimeErrors()
}

const { dialogRef } = useAccessibleDialog({
  open: isOpen,
  onRequestClose: dismiss,
  initialFocusSelector: '.runtime-error-panel__button--primary',
})

const reloadPage = (): void => {
  clearRuntimeErrors()
  window.location.reload()
}

const clearAndReload = (): void => {
  clearCorruptedLocalEntries()
  clearRuntimeErrors()
  window.location.reload()
}

const goToProjects = (): void => {
  clearRuntimeErrors()
  window.location.assign('/')
}

onMounted(() => {
  unsubscribe = subscribeRuntimeErrors((next) => {
    diagnostic.value = next
    refreshCorruptedEntryCount()
  })
})

onBeforeUnmount(() => {
  unsubscribe?.()
})
</script>

<style scoped>
.runtime-error-backdrop {
  position: fixed;
  z-index: 10000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(15 23 42 / 58%);
  backdrop-filter: blur(8px);
}

.runtime-error-panel {
  width: min(520px, 100%);
  padding: 28px;
  border: 1px solid rgb(148 163 184 / 28%);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 80px rgb(15 23 42 / 24%);
  color: #172033;
}

.runtime-error-panel:focus {
  outline: none;
}

.runtime-error-panel__badge {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 5px 10px;
  border-radius: 999px;
  background: #fff1f0;
  color: #c53b31;
  font-size: 13px;
  font-weight: 600;
}

.runtime-error-panel h2 {
  margin: 0 0 10px;
  font-size: 24px;
}

.runtime-error-panel p {
  margin: 0;
  color: #526079;
  line-height: 1.65;
}

.runtime-error-panel__meta {
  display: grid;
  gap: 10px;
  margin: 20px 0;
  padding: 14px;
  border-radius: 12px;
  background: #f7f8fb;
}

.runtime-error-panel__meta div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.runtime-error-panel__meta dt {
  color: #758198;
}

.runtime-error-panel__meta dd {
  margin: 0;
  color: #26334a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-align: right;
  overflow-wrap: anywhere;
}

.runtime-error-panel__hint {
  margin-bottom: 16px !important;
  color: #9a5b16 !important;
}

.runtime-error-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.runtime-error-panel__button {
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid #d8deea;
  border-radius: 10px;
  background: #fff;
  color: #33415c;
  cursor: pointer;
}

.runtime-error-panel__button:hover,
.runtime-error-panel__button:focus-visible {
  border-color: #7c64d5;
  outline: none;
}

.runtime-error-panel__button--primary {
  border-color: #6f56cf;
  background: #6f56cf;
  color: #fff;
}

.runtime-error-panel__button--quiet {
  color: #69758a;
}
</style>
