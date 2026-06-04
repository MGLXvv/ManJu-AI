import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { projectApi } from '@/api/project.api'
import type { Project, ProjectStatus } from '@/types/project'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  const statusFilter = ref<'all' | ProjectStatus>('all')
  const keyword = ref('')

  const filteredProjects = computed(() => {
    return projects.value.filter((project) => {
      const matchStatus = statusFilter.value === 'all' || project.status === statusFilter.value
      const matchKeyword = !keyword.value || project.name.includes(keyword.value.trim())
      return matchStatus && matchKeyword
    })
  })

  const bootstrap = async (): Promise<void> => {
    if (initialized.value || loading.value) {
      return
    }

    loading.value = true
    try {
      projects.value = await projectApi.list()
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  const createProject = async (
    name: string,
    options?: {
      ratio?: Project['ratio']
      style?: string
    },
  ): Promise<Project> => {
    const created = await projectApi.create({
      name,
      ratio: options?.ratio ?? '16:9',
      style: options?.style ?? '默认',
    })
    projects.value = [created, ...projects.value]
    return created
  }

  const deleteProject = async (id: string): Promise<void> => {
    await projectApi.remove(id)
    projects.value = projects.value.filter((project) => project.id !== id)
  }

  const replaceProject = (next: Project | null): void => {
    if (!next) return
    projects.value = projects.value.map((project) => (project.id === next.id ? next : project))
  }

  const updateProjectStep = async (id: string, step: Project['currentStep']): Promise<void> => {
    replaceProject(await projectApi.update({ id, currentStep: step }))
  }

  const toggleProjectFavorite = async (id: string): Promise<void> => {
    const current = projects.value.find((project) => project.id === id)
    if (!current) return
    replaceProject(await projectApi.update({ id, favorite: !current.favorite }))
  }

  const toggleProjectStatus = async (id: string): Promise<void> => {
    const current = projects.value.find((project) => project.id === id)
    if (!current) return
    const nextStatus: ProjectStatus = current.status === 'completed' ? 'in_progress' : 'completed'
    const nextStep: Project['currentStep'] = nextStatus === 'completed' ? 'complete' : current.currentStep === 'complete' ? 'storyboard' : current.currentStep
    replaceProject(await projectApi.update({ id, status: nextStatus, currentStep: nextStep }))
  }

  return {
    projects,
    statusFilter,
    keyword,
    filteredProjects,
    loading,
    initialized,
    bootstrap,
    createProject,
    deleteProject,
    updateProjectStep,
    toggleProjectFavorite,
    toggleProjectStatus,
  }
})
