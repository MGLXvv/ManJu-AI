export const FIGMA_ICON_SPRITE_WIDTH = 1920
export const FIGMA_ICON_SPRITE_HEIGHT = 1080

export type FigmaIconName =
  | 'nav-home-default'
  | 'nav-home-active'
  | 'nav-resource-default'
  | 'nav-resource-active'
  | 'nav-voice-default'
  | 'nav-voice-active'
  | 'nav-team-default'
  | 'nav-team-active'
  | 'nav-points-default'
  | 'nav-points-active'
  | 'nav-system-default'
  | 'nav-system-active'
  | 'toolbar-search'
  | 'toolbar-batch'
  | 'toolbar-add'
  | 'auth-social-wechat'
  | 'auth-social-qq'
  | 'auth-social-alipay'
  | 'toolbar-create'
  | 'toolbar-import'
  | 'editor-fullscreen'
  | 'editor-ai-optimize'
  | 'editor-collapse'
  | 'editor-expand'
  | 'editor-play'
  | 'pager-prev'
  | 'pager-next'
  | 'asset-edit'
  | 'asset-visible'
  | 'asset-lock'
  | 'asset-zoom'
  | 'asset-copy'
  | 'asset-delete'
  | 'asset-edit-active'
  | 'asset-visible-active'
  | 'asset-lock-active'
  | 'asset-zoom-active'
  | 'asset-copy-active'
  | 'asset-delete-active'
  | 'flow-script-edited'
  | 'flow-script-editing'
  | 'flow-script-unedited'
  | 'flow-setting-edited'
  | 'flow-setting-editing'
  | 'flow-setting-unedited'
  | 'flow-storyboard-edited'
  | 'flow-storyboard-editing'
  | 'flow-storyboard-unedited'
  | 'flow-video-edited'
  | 'flow-video-editing'
  | 'flow-video-unedited'
  | 'flow-complete-edited'
  | 'flow-complete-editing'
  | 'flow-complete-unedited'

export interface FigmaIconDef {
  x: number
  y: number
  width: number
  height: number
  label: string
  group: string
}

export const FIGMA_ICON_LIBRARY: Record<FigmaIconName, FigmaIconDef> = {
  'nav-home-default': { x: 1419, y: 107, width: 24, height: 24, label: '首页(默认)', group: '顶部导航' },
  'nav-home-active': { x: 1419, y: 170, width: 24, height: 24, label: '首页(选中)', group: '顶部导航' },
  'nav-resource-default': { x: 1462, y: 107, width: 24, height: 24, label: '资源库(默认)', group: '顶部导航' },
  'nav-resource-active': { x: 1462, y: 170, width: 24, height: 24, label: '资源库(选中)', group: '顶部导航' },
  'nav-voice-default': { x: 1505, y: 107, width: 24, height: 24, label: '音色管理(默认)', group: '顶部导航' },
  'nav-voice-active': { x: 1505, y: 170, width: 24, height: 24, label: '音色管理(选中)', group: '顶部导航' },
  'nav-team-default': { x: 1548, y: 107, width: 24, height: 24, label: '团队空间(默认)', group: '顶部导航' },
  'nav-team-active': { x: 1548, y: 170, width: 24, height: 24, label: '团队空间(选中)', group: '顶部导航' },
  'nav-points-default': { x: 1591, y: 107, width: 24, height: 24, label: '管理充值(默认)', group: '顶部导航' },
  'nav-points-active': { x: 1591, y: 170, width: 24, height: 24, label: '管理充值(选中)', group: '顶部导航' },
  'nav-system-default': { x: 1634, y: 107, width: 24, height: 24, label: '系统管理(默认)', group: '顶部导航' },
  'nav-system-active': { x: 1634, y: 170, width: 24, height: 24, label: '系统管理(选中)', group: '顶部导航' },
  'toolbar-search': { x: 720, y: 176, width: 20, height: 20, label: '搜索', group: '工具栏' },
  'toolbar-batch': { x: 790, y: 176, width: 20, height: 20, label: '批量', group: '工具栏' },
  'toolbar-add': { x: 888, y: 176, width: 20, height: 20, label: '添加', group: '工具栏' },
  'auth-social-wechat': { x: 495, y: 107, width: 24, height: 24, label: '微信', group: '登录页' },
  'auth-social-qq': { x: 557, y: 107, width: 24, height: 24, label: 'QQ', group: '登录页' },
  'auth-social-alipay': { x: 619, y: 107, width: 24, height: 24, label: '支付宝', group: '登录页' },
  'toolbar-create': { x: 494, y: 300, width: 28, height: 28, label: '新建项目', group: '工具栏' },
  'toolbar-import': { x: 574, y: 300, width: 28, height: 28, label: '导入项目', group: '工具栏' },
  'editor-fullscreen': { x: 493, y: 409, width: 20, height: 20, label: '全屏', group: '编辑器操作' },
  'editor-ai-optimize': { x: 559, y: 409, width: 20, height: 20, label: 'AI优化', group: '编辑器操作' },
  'editor-collapse': { x: 666, y: 405, width: 17, height: 32, label: '收起', group: '编辑器操作' },
  'editor-expand': { x: 737, y: 405, width: 17, height: 32, label: '展开', group: '编辑器操作' },
  'editor-play': { x: 819, y: 404, width: 36, height: 36, label: '播放', group: '编辑器操作' },
  'pager-prev': { x: 486, y: 540, width: 16, height: 16, label: '上一页', group: '分页' },
  'pager-next': { x: 780, y: 540, width: 16, height: 16, label: '下一页', group: '分页' },
  'asset-edit': { x: 498, y: 892, width: 24, height: 24, label: '编辑(默认)', group: '资源卡片操作' },
  'asset-visible': { x: 556, y: 892, width: 24, height: 24, label: '可见(默认)', group: '资源卡片操作' },
  'asset-lock': { x: 614, y: 892, width: 24, height: 24, label: '锁定(默认)', group: '资源卡片操作' },
  'asset-zoom': { x: 672, y: 892, width: 24, height: 24, label: '缩放(默认)', group: '资源卡片操作' },
  'asset-copy': { x: 730, y: 892, width: 24, height: 24, label: '复制(默认)', group: '资源卡片操作' },
  'asset-delete': { x: 788, y: 892, width: 24, height: 24, label: '删除(默认)', group: '资源卡片操作' },
  'asset-edit-active': { x: 498, y: 949, width: 24, height: 24, label: '编辑(选中)', group: '资源卡片操作' },
  'asset-visible-active': { x: 556, y: 949, width: 24, height: 24, label: '可见(选中)', group: '资源卡片操作' },
  'asset-lock-active': { x: 614, y: 949, width: 24, height: 24, label: '锁定(选中)', group: '资源卡片操作' },
  'asset-zoom-active': { x: 672, y: 949, width: 24, height: 24, label: '缩放(选中)', group: '资源卡片操作' },
  'asset-copy-active': { x: 730, y: 949, width: 24, height: 24, label: '复制(选中)', group: '资源卡片操作' },
  'asset-delete-active': { x: 788, y: 949, width: 24, height: 24, label: '删除(选中)', group: '资源卡片操作' },
  'flow-script-edited': { x: 100, y: 100, width: 24, height: 24, label: '文案(已编辑)', group: '流程步骤' },
  'flow-script-editing': { x: 165, y: 100, width: 24, height: 24, label: '文案(编辑中)', group: '流程步骤' },
  'flow-script-unedited': { x: 233, y: 100, width: 24, height: 24, label: '文案(未编辑)', group: '流程步骤' },
  'flow-setting-edited': { x: 100, y: 191, width: 24, height: 24, label: '设定(已编辑)', group: '流程步骤' },
  'flow-setting-editing': { x: 165, y: 191, width: 24, height: 24, label: '设定(编辑中)', group: '流程步骤' },
  'flow-setting-unedited': { x: 233, y: 191, width: 24, height: 24, label: '设定(未编辑)', group: '流程步骤' },
  'flow-storyboard-edited': { x: 100, y: 282, width: 24, height: 24, label: '分镜(已编辑)', group: '流程步骤' },
  'flow-storyboard-editing': { x: 165, y: 282, width: 24, height: 24, label: '分镜(编辑中)', group: '流程步骤' },
  'flow-storyboard-unedited': { x: 233, y: 282, width: 24, height: 24, label: '分镜(未编辑)', group: '流程步骤' },
  'flow-video-edited': { x: 100, y: 373, width: 24, height: 24, label: '视频(已编辑)', group: '流程步骤' },
  'flow-video-editing': { x: 165, y: 373, width: 24, height: 24, label: '视频(编辑中)', group: '流程步骤' },
  'flow-video-unedited': { x: 233, y: 373, width: 24, height: 24, label: '视频(未编辑)', group: '流程步骤' },
  'flow-complete-edited': { x: 100, y: 464, width: 24, height: 24, label: '完成(已编辑)', group: '流程步骤' },
  'flow-complete-editing': { x: 165, y: 464, width: 24, height: 24, label: '完成(编辑中)', group: '流程步骤' },
  'flow-complete-unedited': { x: 233, y: 464, width: 24, height: 24, label: '完成(未编辑)', group: '流程步骤' },
}

export const FIGMA_ICON_GROUPS = Array.from(
  Object.entries(
    Object.entries(FIGMA_ICON_LIBRARY).reduce(
      (acc, [name, def]) => {
        const group = def.group
        if (!acc[group]) {
          acc[group] = []
        }
        acc[group].push(name as FigmaIconName)
        return acc
      },
      {} as Record<string, FigmaIconName[]>,
    ),
  ),
).map(([group, icons]) => ({ group, icons }))
