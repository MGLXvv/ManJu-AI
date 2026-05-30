<template>
  <section class="script-step">
    <div class="script-workbench-bg" aria-hidden="true"></div>

    <div class="script-workbench-card">
      <header class="script-workbench-card__topbar">
        <div ref="modelSelectRef" class="script-model-select-wrap">
          <button
            class="script-model-select"
            type="button"
            aria-haspopup="listbox"
            :aria-expanded="modelMenuOpen"
            @click="toggleModelMenu"
          >
            <img
              v-if="selectedModel.iconUrl"
              class="script-model-select__icon-img"
              :src="selectedModel.iconUrl"
              :alt="selectedModel.name"
            />
            <FigmaIcon v-else class="script-model-select__icon-fallback" :name="selectedModel.iconName" :size="20" />
            <span class="script-model-select__label">{{ selectedModel.name }}</span>
            <span class="script-model-select__arrow">⌄</span>
          </button>

          <div v-if="modelMenuOpen" class="script-model-menu" role="listbox" aria-label="选择模型">
            <button
              v-for="model in modelOptions"
              :key="model.id"
              type="button"
              class="script-model-menu__item"
              :class="{ 'is-active': model.id === selectedModel.id }"
              @click="selectModel(model.id)"
            >
              <img
                v-if="model.iconUrl"
                class="script-model-menu__icon-img"
                :src="model.iconUrl"
                :alt="model.name"
              />
              <FigmaIcon v-else class="script-model-menu__icon-fallback" :name="model.iconName" :size="20" />
              <span>{{ model.name }}</span>
            </button>
          </div>
        </div>

        <button class="script-next-btn" type="button" @click="handleNext">进入分镜</button>
      </header>

      <div class="script-workbench-card__divider"></div>

      <div class="script-workbench-card__body">
        <ScriptInputPanel v-model="sourceText" @import-text="handleImportText" />

        <div class="script-workbench-card__right">
          <ScriptPromptPanel
            v-model="promptText"
            :loading="generating"
            :can-generate="canGenerate"
            @save="handleSave"
            @open-template="handleOpenTemplate"
            @delete="handleDelete"
            @generate="handleGenerate"
          />

          <div class="script-workbench-card__dash-line"></div>

          <ScriptResultPanel v-model="generatedScript" :loading="generating" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import ScriptInputPanel from '@/components/editor/script/ScriptInputPanel.vue'
import ScriptPromptPanel from '@/components/editor/script/ScriptPromptPanel.vue'
import ScriptResultPanel from '@/components/editor/script/ScriptResultPanel.vue'
import type { FigmaIconName } from '@/components/icons/figmaIconLibrary'
import { useEditorStore } from '@/stores/editor'

const router = useRouter()
const route = useRoute()
const editorStore = useEditorStore()

const sourceText = ref('')
const promptText = ref(
  '请将八戒减肥记压缩到800字，保留核心情节和幽默风格，删除次要对话。增强八戒减肥过程中的心理挣扎，加入3处内心独白，体现从抗拒到坚持的转变。',
)
const generatedScript = ref('')
const generating = ref(false)
const modelSelectRef = ref<HTMLElement | null>(null)
const modelMenuOpen = ref(false)

interface ModelOption {
  id: string
  name: string
  iconUrl?: string
  iconName: FigmaIconName
}

const modelOptions: ModelOption[] = [
  {
    id: 'gpt-4.0',
    name: 'Gpt 4.0',
    iconName: 'model-openai',
  },
]

const selectedModelId = ref(modelOptions[0]?.id ?? '')
const selectedModel = computed(
  () => modelOptions.find((option) => option.id === selectedModelId.value) ?? modelOptions[0],
)

const projectId = computed(() => String(route.params.projectId ?? ''))
const canGenerate = computed(() => Boolean(sourceText.value.trim() || promptText.value.trim()))

watch(
  projectId,
  async (nextProjectId) => {
    if (!nextProjectId) {
      return
    }

    await editorStore.loadDraft(nextProjectId)
    sourceText.value = editorStore.draft?.script.content ?? ''
  },
  { immediate: true },
)

watch(sourceText, (content) => {
  editorStore.updateScriptContent(content)
})

const handleImportText = (text: string): void => {
  sourceText.value = text
}

const handleSave = async (): Promise<void> => {
  await editorStore.saveDraft()
}

const handleOpenTemplate = (): void => {
  promptText.value =
    '请将输入故事拆分为适合分镜制作的镜头段落，每段包含场景、角色动作、台词或旁白，并标注情绪变化。'
}

const handleDelete = (): void => {
  sourceText.value = ''
  generatedScript.value = ''
}

const handleGenerate = async (): Promise<void> => {
  if (!canGenerate.value || generating.value) {
    return
  }

  generating.value = true
  try {
    await new Promise((resolve) => window.setTimeout(resolve, 650))
    generatedScript.value = [
      '第一幕：角色在日常中暴露核心困境，外部冲突开始逼近。',
      '第二幕：主角在推进目标时连续受阻，人物关系和心理变化逐步加深。',
      '第三幕：关键抉择触发高潮，角色完成成长并留下下一阶段的分镜线索。',
    ].join('\n\n')
  } finally {
    generating.value = false
  }
}

const toggleModelMenu = (): void => {
  modelMenuOpen.value = !modelMenuOpen.value
}

const selectModel = (modelId: string): void => {
  selectedModelId.value = modelId
  modelMenuOpen.value = false
}

const closeModelMenuOnOutside = (event: MouseEvent): void => {
  const target = event.target as Node | null
  if (!target || !modelSelectRef.value) {
    return
  }
  if (!modelSelectRef.value.contains(target)) {
    modelMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', closeModelMenuOnOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', closeModelMenuOnOutside)
})

const handleNext = (): void => {
  router.push({
    name: 'editor-settings',
    params: route.params,
  })
}
</script>
