import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { mockProjects } from '@/mocks/projects.mock'
import type { Project, ProjectStatus } from '@/types/project'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>(mockProjects)
  const statusFilter = ref<'all' | ProjectStatus>('all')
  const keyword = ref('')

  const filteredProjects = computed(() => {
    return projects.value.filter((project) => {
      const matchStatus = statusFilter.value === 'all' || project.status === statusFilter.value
      const matchKeyword = !keyword.value || project.name.includes(keyword.value)
      return matchStatus && matchKeyword
    })
  })

  return { projects, statusFilter, keyword, filteredProjects }
})
