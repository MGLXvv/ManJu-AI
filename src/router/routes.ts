import type { RouteRecordRaw } from 'vue-router'
import RecoveryPage from '@/pages/errors/RecoveryPage.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { guestOnly: true, title: '登录' },
    children: [{ path: '', name: 'login', component: () => import('@/pages/auth/LoginPage.vue') }],
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'projects',
        component: () => import('@/pages/dashboard/ProjectListPage.vue'),
        meta: { title: '项目列表' },
      },
      {
        path: 'resources',
        name: 'resources',
        component: () => import('@/pages/resource/ResourceLibraryPage.vue'),
        meta: { title: '资源库' },
      },
      {
        path: 'voices',
        name: 'voices',
        component: () => import('@/pages/voice/VoiceManagePage.vue'),
        meta: { title: '声音管理' },
      },
      { path: 'team', redirect: { name: 'projects' } },
      { path: 'points', redirect: { name: 'projects' } },
      { path: 'billing', redirect: { name: 'projects' } },
      {
        path: 'system',
        name: 'system',
        component: () => import('@/pages/system/SystemManagePage.vue'),
        meta: { title: '系统管理' },
      },
      { path: 'user', redirect: { name: 'projects' } },
    ],
  },
  {
    path: '/projects/:projectId/unavailable',
    name: 'project-unavailable',
    component: RecoveryPage,
    props: {
      code: 'PROJECT_UNAVAILABLE',
      title: '项目暂时无法打开',
      description: '项目草稿加载失败或本地数据不可用。请返回项目列表重试，或者重新加载当前页面。',
    },
    meta: { requiresAuth: true, title: '项目无法打开' },
  },
  {
    path: '/projects/:projectId/editor',
    component: () => import('@/layouts/EditorLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'editor-script-input' } },
      { path: 'script', redirect: { name: 'editor-script-input' } },
      {
        path: 'script/input',
        name: 'editor-script-input',
        component: () => import('@/pages/editor/steps/ScriptStep.vue'),
        meta: { title: '文案创作' },
      },
      {
        path: 'script/storyboard',
        name: 'editor-script-storyboard',
        component: () => import('@/pages/editor/steps/ScriptStep.vue'),
        meta: { title: '剧本分镜' },
      },
      {
        path: 'settings',
        name: 'editor-settings',
        component: () => import('@/pages/editor/steps/SettingsStep.vue'),
        meta: { title: '设定管理' },
      },
      {
        path: 'storyboard',
        name: 'editor-storyboard',
        component: () => import('@/pages/editor/steps/StoryboardStep.vue'),
        meta: { title: '分镜制作' },
      },
      {
        path: 'video',
        name: 'editor-video',
        component: () => import('@/pages/editor/steps/VideoStep.vue'),
        meta: { title: '视频生成' },
      },
      {
        path: 'dubbing',
        name: 'editor-dubbing',
        component: () => import('@/pages/editor/steps/DubbingStep.vue'),
        meta: { title: '配音制作' },
      },
      {
        path: 'complete',
        name: 'editor-complete',
        component: () => import('@/pages/editor/steps/CompleteStep.vue'),
        meta: { title: '项目完成' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: RecoveryPage,
    props: {
      code: '404',
      title: '页面不存在',
      description: '当前地址无效，页面可能已移动或被删除。',
    },
    meta: { title: '页面不存在' },
  },
]
