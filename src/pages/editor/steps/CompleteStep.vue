<template>
  <section class="complete-step">
    <div class="complete-step__bg" aria-hidden="true"></div>

    <div class="complete-step__shell">
      <WorkflowStepper />

      <section class="complete-step__card">
        <header class="complete-step__header">
          <div>
            <p class="complete-step__eyebrow">项目结果汇总</p>
            <h1 class="complete-step__title">项目已进入完成阶段</h1>
            <p class="complete-step__desc">
              当前页面用于汇总项目草稿、分镜、视频片段和配音结果；剪映工程导出需等待后续 UI 与导出规则确认。
            </p>
          </div>

          <span class="complete-step__status">{{ projectStatusText }}</span>
        </header>

        <div class="complete-step__stats">
          <article class="complete-step__stat-card">
            <span class="complete-step__stat-label">项目名称</span>
            <strong class="complete-step__stat-value">{{ projectName }}</strong>
          </article>
          <article class="complete-step__stat-card">
            <span class="complete-step__stat-label">分镜数量</span>
            <strong class="complete-step__stat-value">{{ shotCount }}</strong>
          </article>
          <article class="complete-step__stat-card">
            <span class="complete-step__stat-label">可播放视频</span>
            <strong class="complete-step__stat-value">{{ playableVideoCount }}</strong>
          </article>
          <article class="complete-step__stat-card">
            <span class="complete-step__stat-label">已生成配音</span>
            <strong class="complete-step__stat-value">{{ generatedAudioCount }}</strong>
          </article>
        </div>

        <div class="complete-step__notices">
          <article class="complete-step__notice" :class="{ 'is-empty': !completeSummary.hasPlayableVideo }">
            <strong>视频结果</strong>
            <p v-if="completeSummary.hasPlayableVideo">
              已汇总 {{ playableVideoCount }} 个可预览视频片段，可继续随项目草稿一并导出。
            </p>
            <p v-else>{{ completeSummary.videoEmptyText }}</p>
          </article>

          <article class="complete-step__notice" :class="{ 'is-empty': !completeSummary.hasGeneratedAudio }">
            <strong>配音结果</strong>
            <p v-if="completeSummary.hasGeneratedAudio">
              已汇总 {{ generatedAudioCount }} 条已生成配音结果，可继续导出配音 JSON。
            </p>
            <p v-else>{{ completeSummary.audioEmptyText }}</p>
          </article>

          <article class="complete-step__notice is-info">
            <strong>导出说明</strong>
            <p>{{ completeSummary.exportNoticeText }}</p>
          </article>
        </div>

        <section v-if="isHttpMode" class="complete-step__export-panel">
          <div class="complete-step__export-header">
            <div>
              <strong>Mock 导出任务</strong>
              <p v-if="exportLoading">正在读取导出工作区...</p>
              <p v-else-if="canCreateExportTask">当前项目已满足导出条件，可创建 Mock 导出任务。</p>
              <p v-else-if="missingVideoCount > 0">仍有 {{ missingVideoCount }} 个分镜缺少视频，暂不能创建导出任务。</p>
              <p v-else>当前项目暂不满足导出条件，请先检查分镜与视频状态。</p>
            </div>
            <span class="complete-step__export-flag">
              {{ latestExportTask ? '已有导出任务' : '尚未创建导出任务' }}
            </span>
          </div>

          <article v-if="latestExportTask" class="complete-step__export-card">
            <div class="complete-step__export-card-head">
              <strong>最近任务 #{{ latestExportTask.id }}</strong>
              <span class="complete-step__export-status">{{ formatExportStatus(latestExportTask.status) }}</span>
            </div>
            <p>进度：{{ latestExportTask.progress }}%</p>
            <p v-if="latestExportTask.resultUrl">结果地址：{{ latestExportTask.resultUrl }}</p>
            <p v-if="latestExportTask.errorMessage" class="complete-step__export-error">
              错误信息：{{ latestExportTask.errorMessage }}
            </p>
          </article>

          <div v-if="exportTasks.length > 0" class="complete-step__export-history">
            <strong>历史任务</strong>
            <ul class="complete-step__export-list">
              <li v-for="task in exportTasks" :key="task.id">
                <span>#{{ task.id }}</span>
                <span>{{ formatExportStatus(task.status) }}</span>
                <span>{{ task.progress }}%</span>
              </li>
            </ul>
          </div>
        </section>

        <div class="complete-step__actions">
          <button
            v-if="isHttpMode"
            type="button"
            class="complete-step__secondary"
            :disabled="submitting || exportLoading"
            @click="createMockExportTask"
          >
            创建导出任务
          </button>
          <button
            v-if="isHttpMode"
            type="button"
            class="complete-step__secondary"
            :disabled="submitting || downloadLoading || !latestExportTask"
            @click="openMockDownloadUrl"
          >
            获取 Mock 下载地址
          </button>
          <button type="button" class="complete-step__secondary" :disabled="submitting" @click="exportDubbingArtifact">
            导出配音 JSON
          </button>
          <button type="button" class="complete-step__secondary" :disabled="submitting" @click="exportProjectArtifact">
            导出项目草稿 JSON
          </button>
          <button type="button" class="complete-step__primary" :disabled="submitting" @click="goProjects">
            返回项目列表
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { apiMode } from '@/api/shared/apiMode'
import { useRoute, useRouter } from 'vue-router'
import WorkflowStepper from '@/components/editor/WorkflowStepper.vue'
import {
  isCompleteExportDownloadCurrent,
  isCompleteExportProjectCurrent,
} from '@/features/editor/completeExportAsyncState'
import { buildCompleteSummary } from '@/features/editor/completeSummaryState'
import { createCompleteProjectSyncRunner } from '@/features/editor/completeProjectSyncState'
import { buildDubbingArtifact, buildDubbingExportFileName } from '@/features/editor/editorArtifactMapper'
import { buildScopedProjectArtifact, buildScopedProjectExportFileName } from '@/features/editor/editorExportScopeState'
import { createLatestAsyncTaskRunner } from '@/features/shared/latestAsyncTaskState'
import { createObjectUrlRegistry } from '@/features/shared/objectUrlRegistryState'
import { createProjectPhaseRunner } from '@/features/shared/projectPhaseRunnerState'
import { createScopedAsyncTaskRunner } from '@/features/shared/scopedAsyncTaskState'
import { exportWorkflowService } from '@/services/editor/exportWorkflow.service'
import { useEditorStore } from '@/stores/editor'
import { useProjectStore } from '@/stores/project'
import { useUiFeedbackStore } from '@/stores/uiFeedback'

const route = useRoute()
const router = useRouter()
const editorStore = useEditorStore()
const projectStore = useProjectStore()
const uiFeedback = useUiFeedbackStore()

const submitting = ref(false)
const exportLoading = ref(false)
const downloadLoading = ref(false)
const exportWorkspace = ref<Awaited<ReturnType<typeof exportWorkflowService.loadExportWorkspace>>>(null)
const exportWorkspaceTask = createLatestAsyncTaskRunner()
const exportCreationTasks = createProjectPhaseRunner()
const exportDownloadTasks = createScopedAsyncTaskRunner()
const downloadUrlRegistry = createObjectUrlRegistry(URL)
const projectId = computed(() => String(route.params.projectId ?? ''))
const draft = computed(() => editorStore.draft)
const project = computed(() => projectStore.projects.find((item) => item.id === projectId.value) ?? null)
const isHttpMode = apiMode === 'http'
const projectName = computed(() => project.value?.name ?? draft.value?.projectId ?? '当前项目')
const projectStatusText = computed(() => (project.value?.status === 'completed' ? '已完成' : '进行中'))
const completeSummary = computed(() => buildCompleteSummary(draft.value))
const shotCount = computed(() => completeSummary.value.shotCount)
const playableVideoCount = computed(() => completeSummary.value.playableVideoCount)
const generatedAudioCount = computed(() => completeSummary.value.generatedAudioCount)
const canCreateExportTask = computed(() => exportWorkspace.value?.canExport ?? false)
const missingVideoCount = computed(() => exportWorkspace.value?.missingVideoCount ?? 0)
const latestExportTask = computed(() => exportWorkspace.value?.latestTask ?? null)
const exportTasks = computed(() => exportWorkspace.value?.tasks ?? [])

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
}

const formatExportStatus = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'SUCCESS':
      return '已完成'
    case 'FAILED':
      return '失败'
    case 'RUNNING':
      return '进行中'
    case 'PENDING':
      return '排队中'
    default:
      return status
  }
}

const downloadJson = (fileName: string, payload: unknown): void => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = downloadUrlRegistry.create(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  try {
    link.click()
  } finally {
    document.body.removeChild(link)
    queueMicrotask(() => downloadUrlRegistry.release(url))
  }
}

const refreshExportWorkspace = async (targetProjectId = projectId.value): Promise<boolean> => {
  if (!targetProjectId || !isHttpMode) {
    exportWorkspaceTask.invalidate()
    exportWorkspace.value = null
    exportLoading.value = false
    return false
  }

  exportLoading.value = true
  try {
    const result = await exportWorkspaceTask.run(() => exportWorkflowService.loadExportWorkspace(targetProjectId))
    if (result.status === 'stale' || !isCompleteExportProjectCurrent(targetProjectId, projectId.value)) return false
    exportWorkspace.value = result.value
    exportLoading.value = false
    return true
  } catch (error) {
    if (!isCompleteExportProjectCurrent(targetProjectId, projectId.value)) return false
    exportWorkspace.value = null
    exportLoading.value = false
    showToast(error instanceof Error ? error.message : '导出工作区加载失败', 'error')
    return false
  }
}

const completeProjectSync = createCompleteProjectSyncRunner({
  loadDraft: (targetProjectId) => editorStore.loadDraft(targetProjectId),
  ensureProjectsLoaded: async () => {
    if (!projectStore.initialized) {
      await projectStore.bootstrap()
    }
  },
  markProjectComplete: async (targetProjectId) => {
    await projectStore.updateProjectStep(targetProjectId, 'complete')
    const current = projectStore.projects.find((item) => item.id === targetProjectId)
    if (current?.status !== 'completed') {
      await projectStore.toggleProjectStatus(targetProjectId)
    }
  },
  refreshExportWorkspace: async (targetProjectId) => {
    await refreshExportWorkspace(targetProjectId)
  },
})

watch(
  projectId,
  (nextProjectId) => {
    exportWorkspaceTask.invalidate()
    exportCreationTasks.invalidate()
    exportDownloadTasks.invalidate()
    exportWorkspace.value = null
    exportLoading.value = false
    submitting.value = false
    downloadLoading.value = false
    void completeProjectSync.run(nextProjectId).catch((error) => {
      showToast(error instanceof Error ? error.message : '完成页同步失败', 'error')
    })
  },
  { immediate: true },
)

watch(
  () => latestExportTask.value?.id,
  () => {
    exportDownloadTasks.invalidate()
    downloadLoading.value = false
  },
)

onUnmounted(() => {
  completeProjectSync.invalidate()
  exportWorkspaceTask.invalidate()
  exportCreationTasks.invalidate()
  exportDownloadTasks.invalidate()
  downloadUrlRegistry.releaseAll()
})

const exportDubbingArtifact = async (): Promise<void> => {
  if (!draft.value) {
    showToast('未找到当前项目草稿', 'error')
    return
  }

  submitting.value = true
  try {
    const artifact = buildDubbingArtifact(projectId.value, draft.value.dubbing)
    downloadJson(buildDubbingExportFileName(projectId.value), artifact)
    showToast('配音 JSON 已导出', 'success')
  } finally {
    submitting.value = false
  }
}

const exportProjectArtifact = async (): Promise<void> => {
  if (!draft.value) {
    showToast('未找到当前项目草稿', 'error')
    return
  }

  submitting.value = true
  try {
    const artifact = buildScopedProjectArtifact(projectId.value || 'project', draft.value, 'complete')
    downloadJson(buildScopedProjectExportFileName(projectId.value || 'project'), artifact)
    showToast('项目草稿 JSON 已导出', 'success')
  } finally {
    submitting.value = false
  }
}

const createMockExportTask = async (): Promise<void> => {
  if (!projectId.value) {
    showToast('未找到当前项目', 'error')
    return
  }

  if (!canCreateExportTask.value) {
    if (missingVideoCount.value > 0) {
      showToast(`仍有 ${missingVideoCount.value} 个分镜缺少视频，暂不能导出`, 'error')
      return
    }

    showToast('当前项目暂不满足导出条件', 'error')
    return
  }

  const targetProjectId = projectId.value
  submitting.value = true
  try {
    const completed = await exportCreationTasks.run(targetProjectId, [
      async (activeProjectId) => {
        await exportWorkflowService.createExportTask(activeProjectId)
      },
      async (activeProjectId) => {
        await refreshExportWorkspace(activeProjectId)
      },
    ])
    if (!completed || !isCompleteExportProjectCurrent(targetProjectId, projectId.value)) return
    showToast('Mock 导出任务已创建', 'success')
  } catch (error) {
    if (isCompleteExportProjectCurrent(targetProjectId, projectId.value)) {
      showToast(error instanceof Error ? error.message : '创建导出任务失败', 'error')
    }
  } finally {
    if (isCompleteExportProjectCurrent(targetProjectId, projectId.value)) {
      submitting.value = false
    }
  }
}

const openMockDownloadUrl = async (): Promise<void> => {
  if (!latestExportTask.value) {
    showToast('暂无可用的导出任务', 'error')
    return
  }

  const targetProjectId = projectId.value
  const targetTaskId = latestExportTask.value.id
  const isCurrent = (): boolean =>
    isCompleteExportDownloadCurrent({
      targetProjectId,
      currentProjectId: projectId.value,
      targetTaskId,
      currentTaskId: latestExportTask.value?.id,
    })

  downloadLoading.value = true
  try {
    const result = await exportDownloadTasks.run(() => exportWorkflowService.getDownloadUrl(targetTaskId))
    if (result.status === 'stale' || !isCurrent()) return
    if (!result.value) {
      showToast('当前导出任务暂无可用下载地址', 'error')
      return
    }

    window.open(result.value, '_blank', 'noopener')
  } catch (error) {
    if (isCurrent()) {
      showToast(error instanceof Error ? error.message : '获取下载地址失败', 'error')
    }
  } finally {
    if (isCurrent()) {
      downloadLoading.value = false
    }
  }
}

const goProjects = async (): Promise<void> => {
  await router.push({ name: 'projects' })
}
</script>

<style scoped>
.complete-step {
  position: relative;
  min-height: 100%;
  padding: 32px;
  color: #fff;
}

.complete-step__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top, rgba(172, 105, 255, 0.12), transparent 38%), #0a0a0b;
}

.complete-step__shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.complete-step__card {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background: rgba(24, 24, 26, 0.92);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
}

.complete-step__header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
}

.complete-step__eyebrow {
  margin: 0 0 8px;
  font-size: 13px;
  color: #b59cff;
}

.complete-step__title {
  margin: 0;
  font-size: 34px;
  line-height: 1.15;
}

.complete-step__desc {
  margin: 12px 0 0;
  max-width: 680px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 15px;
  line-height: 1.7;
}

.complete-step__status {
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(176, 248, 98, 0.12);
  border: 1px solid rgba(176, 248, 98, 0.2);
  color: #b0f862;
  font-size: 14px;
  white-space: nowrap;
}

.complete-step__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.complete-step__stat-card {
  padding: 20px;
  border-radius: 20px;
  background: rgba(40, 40, 44, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.complete-step__stat-label {
  display: block;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 13px;
}

.complete-step__stat-value {
  font-size: 28px;
  line-height: 1.15;
}

.complete-step__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.complete-step__export-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 24px;
  background: rgba(28, 28, 32, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.complete-step__export-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.complete-step__export-header strong,
.complete-step__export-history strong {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
}

.complete-step__export-header p,
.complete-step__export-card p {
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  font-size: 14px;
  line-height: 1.7;
}

.complete-step__export-flag {
  align-self: flex-start;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(181, 156, 255, 0.12);
  border: 1px solid rgba(181, 156, 255, 0.22);
  color: #d7c8ff;
  font-size: 12px;
  white-space: nowrap;
}

.complete-step__export-card {
  padding: 18px;
  border-radius: 18px;
  background: rgba(38, 38, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.complete-step__export-card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.complete-step__export-status {
  color: #b0f862;
  font-size: 13px;
}

.complete-step__export-error {
  color: #ffbebe;
}

.complete-step__export-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.complete-step__export-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(38, 38, 42, 0.72);
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.complete-step__notices {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.complete-step__notice {
  min-height: 120px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(34, 34, 38, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.complete-step__notice strong {
  display: block;
  margin-bottom: 10px;
  font-size: 15px;
}

.complete-step__notice p {
  margin: 0;
  color: rgba(255, 255, 255, 0.66);
  font-size: 14px;
  line-height: 1.7;
}

.complete-step__notice.is-empty {
  border-color: rgba(255, 190, 118, 0.24);
  background: rgba(255, 190, 118, 0.08);
}

.complete-step__notice.is-info {
  border-color: rgba(181, 156, 255, 0.2);
  background: rgba(181, 156, 255, 0.08);
}

.complete-step__primary,
.complete-step__secondary {
  min-width: 148px;
  height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 15px;
  color: #fff;
  cursor: pointer;
}

.complete-step__secondary {
  background: rgba(46, 46, 50, 0.9);
}

.complete-step__primary {
  border: none;
  background: linear-gradient(90deg, #a55bff 0%, #f4a6ec 100%);
}

.complete-step__primary:disabled,
.complete-step__secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .complete-step__stats,
  .complete-step__notices {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .complete-step {
    padding: 20px;
  }

  .complete-step__header,
  .complete-step__actions {
    flex-direction: column;
  }

  .complete-step__stats,
  .complete-step__notices {
    grid-template-columns: 1fr;
  }
}
</style>
