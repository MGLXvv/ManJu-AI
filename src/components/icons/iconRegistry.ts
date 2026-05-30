import type { IconFontName } from '@/assets/iconfont/registry/iconfont-names'
import { iconAliasMap } from './iconAliasMap'

const svgModules = import.meta.glob('/src/assets/icons/svg/*.svg', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const ICON_FILE_MAP = {
  // Topbar
  'topbar-home-default': 'Group 2.svg',
  'topbar-home-active': 'Group 2-1.svg',
  'topbar-resource-default': 'Group 3.svg',
  'topbar-resource-active': 'Group 3-1.svg',
  'topbar-voice-default': 'Group 4.svg',
  'topbar-voice-active': 'Group 4-1.svg',
  'topbar-team-default': 'Group 5.svg',
  'topbar-team-active': 'Group 5-1.svg',
  'topbar-points-default': 'Group 6.svg',
  'topbar-points-active': 'Group 6-1.svg',
  'topbar-system-default': 'Group 7.svg',
  'topbar-system-active': 'Group 7-1.svg',
  'topbar-credit-cart-default': 'Group 1.svg',
  'topbar-credit-cart-active': 'Group 1-1.svg',
  'topbar-credit-diamond-default': 'topbar-credit-diamond-default.svg',
  'topbar-credit-diamond-active': 'topbar-credit-diamond-active.svg',
  'topbar-user-default': 'Frame.svg',
  'topbar-user-active': 'Frame-1.svg',

  // Home/project area
  search: 'Frame-2.svg',
  batch: 'Group 17.svg',
  'project-import': 'Frame 3.svg',
  'pager-prev': 'Group 306.svg',
  'pager-next': 'Group 307.svg',

  // Common actions
  'action-doc': 'Frame-3.svg',
  'action-doc-link': 'action-doc-link.svg',
  'model-openai': 'Frame-4.svg',
  'chevron-down': 'Frame-5.svg',
  'action-save': 'Frame-6.svg',
  'action-template': 'Frame-7.svg',
  'action-delete': 'Frame-8.svg',
  'result-fullscreen': 'result-fullscreen.svg',
  'result-ai-optimize': 'result-ai-optimize.svg',
  'empty-ufo': '空状态(1) 2.svg',

  // Canvas tools
  'tool-edit': 'Group 212.svg',
  'tool-lock': 'Group 214.svg',
  'tool-view': 'Group 213.svg',
  'tool-zoom': 'Group 217.svg',
  'tool-copy': 'Group 216.svg',
  'tool-delete': 'Group 215.svg',
  'tool-edit-active': 'Group 212-1.svg',
  'tool-lock-active': 'Group 214-1.svg',
  'tool-view-off': 'Group 213-1.svg',
  'tool-zoom-out': 'Group 217-1.svg',
  'tool-copy-active': 'Group 216-1.svg',
  'tool-delete-active': 'Group 215-1.svg',

  // Chips/tags
  'chip-add': 'Group 207.svg',
  'chip-close-default': 'Frame-9.svg',
  'chip-close-active': 'Frame-10.svg',
  'chip-close-muted': 'Frame-11.svg',

  // Card operations
  'card-edit': 'Group 22.svg',
  'card-add': 'Group 28.svg',
  'card-delete': 'Group 20.svg',
  'card-upload': 'Group 21.svg',
  'card-star-outline': 'Group 245.svg',
  'card-star-green': 'Group 246.svg',
  'card-star-orange': 'Group 243.svg',
  'asset-star-outline': 'Group 175.svg',
  'asset-star-purple': 'Group 247.svg',
  'asset-trash': 'Group 176.svg',

  // Timeline/video controls
  'timeline-delete-default': 'Group 296.svg',
  'timeline-delete-active': 'Group 295.svg',
  'timeline-copy-default': 'Frame-12.svg',
  'timeline-copy-active': 'Frame-15.svg',
  'timeline-upload-default': 'Frame-13.svg',
  'timeline-upload-active': 'Frame-14.svg',
  'video-play-large': 'Group 223.svg',
  'reference-rail-handle': 'Group 188.svg',
  'create-blank-shot': 'Group 278.svg',

  // Auth/form
  'social-wechat': 'Group 67.svg',
  'social-qq': 'Group 66.svg',
  'social-alipay': 'Group 68.svg',
  'checkbox-checked': 'Frame-16.svg',
  'checkbox-unchecked': 'Frame-17.svg',
  'form-eye-on': 'Frame-18.svg',
  'form-eye-off': 'Frame-19.svg',

  // User menu
  'user-menu-notify': 'Group 316.svg',
  'user-menu-password': 'Frame-20.svg',
  'user-menu-space': 'Frame-21.svg',
  'user-menu-switch-team': 'Frame-18.svg',
  'user-menu-logout': 'Frame-19.svg',

  // Flow sidebar (small icons)
  'flow-script-edited': 'Group 152.svg',
  'flow-settings-edited': 'Group 153.svg',
  'flow-video-edited': 'Group 154.svg',
  'flow-complete-edited': 'Group 155.svg',
  'flow-storyboard-edited': 'Group 156.svg',

  // Flow source sets (backup)
  'flow-script-editing-source': 'Group 157.svg',
  'flow-script-unedited-source': 'Group 162.svg',
  'flow-settings-editing-source': 'Group 158.svg',
  'flow-settings-unedited-source': 'Group 163.svg',
} as const

export type AppIconName = keyof typeof ICON_FILE_MAP

export const APP_ICON_REGISTRY: Record<AppIconName, string> = Object.fromEntries(
  Object.entries(ICON_FILE_MAP).map(([name, file]) => {
    const key = `/src/assets/icons/svg/${file}`
    return [name, svgModules[key] ?? '']
  }),
) as Record<AppIconName, string>

const ICON_FONT_MAP: Partial<Record<AppIconName, IconFontName>> = {
  'topbar-home-default': 'topbar-home',
  'topbar-home-active': 'topbar-home',
  'topbar-resource-default': 'topbar-resource',
  'topbar-resource-active': 'topbar-resource',
  'topbar-voice-default': 'topbar-voice',
  'topbar-voice-active': 'topbar-voice',
  'topbar-team-default': 'topbar-team',
  'topbar-team-active': 'topbar-team',
  'topbar-points-default': 'topbar-points',
  'topbar-points-active': 'topbar-points',
  'topbar-system-default': 'topbar-system',
  'topbar-system-active': 'topbar-system',
  'topbar-credit-cart-default': 'topbar-cart-default',
  'topbar-credit-cart-active': 'topbar-cart-default',
  'topbar-user-default': 'topbar-user',
  'topbar-user-active': 'topbar-user',
  search: 'search',
  batch: 'batch',
  'chip-add': 'chip-add',
  'pager-prev': 'pager-prev',
  'pager-next': 'pager-next',
  'project-import': 'project-import',
  'action-doc': 'action-document',
  'model-openai': 'model-openai',
  'chevron-down': 'chevron-down',
  'action-save': 'action-save',
  'action-template': 'action-template',
  'action-delete': 'action-delete',
  'tool-edit': 'tool-edit',
  'tool-lock': 'tool-lock',
  'tool-view': 'tool-view',
  'tool-view-off': 'tool-view-off',
  'tool-zoom': 'tool-zoom',
  'tool-zoom-out': 'tool-zoom-out',
  'tool-copy': 'tool-copy',
  'card-edit': 'card-edit',
  'card-add': 'card-add',
  'card-delete': 'trash',
  'card-upload': 'card-upload',
  'timeline-delete-default': 'trash',
  'timeline-delete-active': 'trash',
  'timeline-copy-default': 'timeline-copy',
  'timeline-copy-active': 'timeline-copy',
  'timeline-upload-default': 'timeline-upload',
  'timeline-upload-active': 'timeline-upload',
  'social-wechat': 'social-wechat',
  'social-qq': 'social-qq',
  'social-alipay': 'social-alipay',
  'checkbox-checked': 'checkbox-checked',
  'checkbox-unchecked': 'checkbox-checked',
  'user-menu-notify': 'user-menu-notify',
  'user-menu-password': 'user-menu-password',
  'user-menu-space': 'user-menu-space',
  'user-menu-switch-team': 'user-menu-switch-team',
  'user-menu-logout': 'user-menu-logout',
  'flow-script-edited': 'flow-script',
  'flow-settings-edited': 'flow-settings',
  'flow-video-edited': 'flow-video',
  'flow-complete-edited': 'flow-complete',
  'flow-storyboard-edited': 'flow-storyboard',
}

export const resolveAppIconUrl = (name: AppIconName): string => APP_ICON_REGISTRY[name] ?? ''

export const resolveAppIconFontClass = (name: AppIconName): string => {
  const aliasName = iconAliasMap[name as keyof typeof iconAliasMap]
  const fontName = ICON_FONT_MAP[name] ?? aliasName
  return fontName ? `manju-icons-${fontName}` : ''
}

