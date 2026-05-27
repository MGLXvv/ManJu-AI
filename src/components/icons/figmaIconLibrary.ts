import { APP_ICON_REGISTRY, type AppIconName } from './iconRegistry'

export interface FigmaIconDef {
  url: string
}

export type FigmaIconName = AppIconName

export const FIGMA_ICON_LIBRARY: Record<FigmaIconName, FigmaIconDef> = Object.fromEntries(
  Object.entries(APP_ICON_REGISTRY).map(([name, url]) => [name, { url }]),
) as Record<FigmaIconName, FigmaIconDef>

export const FIGMA_ICON_GROUPS = [
  {
    group: 'all',
    icons: Object.keys(APP_ICON_REGISTRY) as FigmaIconName[],
  },
]
