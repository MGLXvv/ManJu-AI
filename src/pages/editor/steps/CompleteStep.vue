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

        <div class="complete-step__actions">
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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WorkflowStepper from '@/components/editor/WorkflowStepper.vue'
import { buildCompleteSummary } from '@/features/editor/completeSummaryState'
import { buildDubbingArtifact, buildDubbingExportFileName } from '@/features/editor/editorArtifactMapper'
import { buildScopedProjectArtifact, buildScopedProjectExportFileName } from '@/features/editor/editorExportScopeState'
import { useEditorStore } from '@/stores/editor'
import { useProjectStore } from '@/stores/project'
import { useUiFeedbackStore } from '@/stores/uiFeedback'

const route = useRoute()
const router = useRouter()
const editorStore = useEditorStore()
const projectStore = useProjectStore()
const uiFeedback = useUiFeedbackStore()

const submitting = ref(false)
const projectId = computed(() => String(route.params.projectId ?? ''))
const draft = computed(() => editorStore.draft)
const project = computed(() => projectStore.projects.find((item) => item.id === projectId.value) ?? null)
const projectName = computed(() => project.value?.name ?? draft.value?.projectId ?? '当前项目')
const projectStatusText = computed(() => (project.value?.status === 'completed' ? '已完成' : '进行中'))
const completeSummary = computed(() => buildCompleteSummary(draft.value))
const shotCount = computed(() => completeSummary.value.shotCount)
const playableVideoCount = computed(() => completeSummary.value.playableVideoCount)
const generatedAudioCount = computed(() => completeSummary.value.generatedAudioCount)

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
}

const downloadJson = (fileName: string, payload: unknown): void => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const syncProject = async (): Promise<void> => {
  if (!projectId.value) return
  await editorStore.loadDraft(projectId.value)
  if (!projectStore.initialized) {
    await projectStore.bootstrap()
  }
  await projectStore.updateProjectStep(projectId.value, 'complete')
  const current = projectStore.projects.find((item) => item.id === projectId.value)
  if (current?.status !== 'completed') {
    await projectStore.toggleProjectStatus(projectId.value)
  }
}

watch(projectId, () => {
  void syncProject()
}, { immediate: true })

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
  background:
    radial-gradient(circle at top, rgba(172, 105, 255, 0.12), transparent 38%),
    #0a0a0b;
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
