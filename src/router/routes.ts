import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [{ path: '', name: 'login', component: () => import('@/pages/auth/LoginPage.vue') }],
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'projects', component: () => import('@/pages/dashboard/ProjectListPage.vue') },
      { path: 'resources', name: 'resources', component: () => import('@/pages/resource/ResourceLibraryPage.vue') },
      { path: 'voices', name: 'voices', component: () => import('@/pages/voice/VoiceManagePage.vue') },
      { path: 'team', name: 'team', component: () => import('@/pages/placeholder/TeamSpacePage.vue') },
      { path: 'points', name: 'points', component: () => import('@/pages/placeholder/PointsMallPage.vue') },
      { path: 'billing', name: 'billing', component: () => import('@/pages/placeholder/BillingPage.vue') },
      { path: 'system', name: 'system', component: () => import('@/pages/system/SystemManagePage.vue') },
      { path: 'user', name: 'user', component: () => import('@/pages/placeholder/UserCenterPage.vue') },
    ],
  },
  {
    path: '/projects/:projectId/editor',
    component: () => import('@/layouts/EditorLayout.vue'),
    children: [
      { path: '', redirect: { name: 'editor-script' } },
      { path: 'script', name: 'editor-script', component: () => import('@/pages/editor/steps/ScriptStep.vue') },
      { path: 'settings', name: 'editor-settings', component: () => import('@/pages/editor/steps/SettingsStep.vue') },
      { path: 'storyboard', name: 'editor-storyboard', component: () => import('@/pages/editor/steps/StoryboardStep.vue') },
      { path: 'video', name: 'editor-video', component: () => import('@/pages/editor/steps/VideoStep.vue') },
      { path: 'dubbing', name: 'editor-dubbing', component: () => import('@/pages/editor/steps/DubbingStep.vue') },
      { path: 'complete', name: 'editor-complete', component: () => import('@/pages/editor/steps/CompleteStep.vue') },
    ],
  },
]
