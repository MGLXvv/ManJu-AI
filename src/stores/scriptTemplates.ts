import { defineStore } from 'pinia'
import { ref } from 'vue'
import { scriptTemplateApi } from '@/api/scriptTemplate.api'
import type { ScriptTemplate, ScriptTemplateInput } from '@/types/scriptTemplate'

export const useScriptTemplateStore = defineStore('script-templates', () => {
  const templates = ref<ScriptTemplate[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  const loadTemplates = async (): Promise<void> => {
    if (loading.value) {
      return
    }

    loading.value = true
    try {
      templates.value = await scriptTemplateApi.getTemplates()
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  const ensureLoaded = async (): Promise<void> => {
    if (loaded.value) {
      return
    }

    await loadTemplates()
  }

  const createTemplate = async (input: ScriptTemplateInput): Promise<ScriptTemplate> => {
    const created = await scriptTemplateApi.createTemplate(input)
    templates.value = [created, ...templates.value]
    loaded.value = true
    return created
  }

  const updateTemplate = async (templateId: string, input: ScriptTemplateInput): Promise<ScriptTemplate> => {
    const updated = await scriptTemplateApi.updateTemplate(templateId, input)
    templates.value = templates.value.map((template) => (template.id === templateId ? updated : template))
    loaded.value = true
    return updated
  }

  const deleteTemplate = async (templateId: string): Promise<void> => {
    await scriptTemplateApi.deleteTemplate(templateId)
    templates.value = templates.value.filter((template) => template.id !== templateId)
    loaded.value = true
  }

  return {
    templates,
    loaded,
    loading,
    loadTemplates,
    ensureLoaded,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  }
})
