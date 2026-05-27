export const FIGMA_ICON_SPRITE_WIDTH = 1920
export const FIGMA_ICON_SPRITE_HEIGHT = 1080

export interface FigmaIconDef {
  x: number
  y: number
  width: number
  height: number
  label: string
  group: string
}

export const FIGMA_ICON_LIBRARY = {
  // Top nav
  'nav-home-default': { x: 1419, y: 107, width: 24, height: 24, label: '首页(默认)', group: '顶部导航' },
  'nav-home-active': { x: 1419, y: 170, width: 24, height: 24, label: '首页(选中)', group: '顶部导航' },
  'nav-resource-default': { x: 1462, y: 107, width: 24, height: 24, label: '资源库(默认)', group: '顶部导航' },
  'nav-resource-active': { x: 1462, y: 170, width: 24, height: 24, label: '资源库(选中)', group: '顶部导航' },
  'nav-voice-default': { x: 1505, y: 107, width: 24, height: 24, label: '音色管理(默认)', group: '顶部导航' },
  'nav-voice-active': { x: 1505, y: 170, width: 24, height: 24, label: '音色管理(选中)', group: '顶部导航' },
  'nav-team-default': { x: 1548, y: 107, width: 24, height: 24, label: '团队空间(默认)', group: '顶部导航' },
  'nav-team-active': { x: 1548, y: 170, width: 24, height: 24, label: '团队空间(选中)', group: '顶部导航' },
  'nav-points-default': { x: 1591, y: 107, width: 24, height: 24, label: '积分(默认)', group: '顶部导航' },
  'nav-points-active': { x: 1591, y: 170, width: 24, height: 24, label: '积分(选中)', group: '顶部导航' },
  'nav-system-default': { x: 1634, y: 107, width: 24, height: 24, label: '系统管理(默认)', group: '顶部导航' },
  'nav-system-active': { x: 1634, y: 170, width: 24, height: 24, label: '系统管理(选中)', group: '顶部导航' },

  // Top right
  'topbar-cart': { x: 1780, y: 107, width: 24, height: 24, label: '购物车', group: '顶部导航' },
  'topbar-user': { x: 1836, y: 107, width: 24, height: 24, label: '用户', group: '顶部导航' },
  'topbar-user-active': { x: 1836, y: 170, width: 24, height: 24, label: '用户(选中)', group: '顶部导航' },

  // Toolbar
  'toolbar-search': { x: 720, y: 176, width: 20, height: 20, label: '搜索', group: '工具栏' },
  'toolbar-batch': { x: 790, y: 176, width: 20, height: 20, label: '批量', group: '工具栏' },
  'toolbar-add': { x: 888, y: 176, width: 20, height: 20, label: '添加', group: '工具栏' },
  'toolbar-create': { x: 494, y: 300, width: 28, height: 28, label: '新建项目', group: '工具栏' },
  'toolbar-import': { x: 574, y: 300, width: 28, height: 28, label: '导入项目', group: '工具栏' },

  // Auth
  'auth-social-wechat': { x: 495, y: 107, width: 24, height: 24, label: '微信', group: '登录页' },
  'auth-social-qq': { x: 557, y: 107, width: 24, height: 24, label: 'QQ', group: '登录页' },
  'auth-social-alipay': { x: 619, y: 107, width: 24, height: 24, label: '支付宝', group: '登录页' },

  // Form
  'form-checkbox-checked': { x: 682, y: 107, width: 16, height: 16, label: '复选框(已选)', group: '表单' },
  'form-checkbox-unchecked': { x: 713, y: 107, width: 16, height: 16, label: '复选框(未选)', group: '表单' },
  'form-eye-off': { x: 1738, y: 660, width: 24, height: 24, label: '密码不可见', group: '表单' },
  'form-close': { x: 1195, y: 321, width: 24, height: 24, label: '关闭', group: '表单' },
  'form-chevron-down': { x: 1183, y: 625, width: 16, height: 16, label: '下拉', group: '表单' },

  // Common actions
  'action-document': { x: 657, y: 250, width: 20, height: 20, label: '文档', group: '通用操作' },
  'action-delete': { x: 752, y: 250, width: 20, height: 20, label: '删除', group: '通用操作' },
  'action-save': { x: 852, y: 250, width: 20, height: 20, label: '保存', group: '通用操作' },
  'action-template': { x: 952, y: 250, width: 20, height: 20, label: '模板', group: '通用操作' },
  'action-generate': { x: 1322, y: 391, width: 20, height: 20, label: '生成', group: '通用操作' },

  // Editor actions
  'editor-fullscreen': { x: 493, y: 409, width: 20, height: 20, label: '全屏', group: '编辑器操作' },
  'editor-ai-optimize': { x: 559, y: 409, width: 20, height: 20, label: 'AI优化', group: '编辑器操作' },
  'editor-collapse': { x: 666, y: 405, width: 17, height: 32, label: '收起', group: '编辑器操作' },
  'editor-expand': { x: 737, y: 405, width: 17, height: 32, label: '展开', group: '编辑器操作' },
  'editor-play': { x: 819, y: 404, width: 36, height: 36, label: '播放', group: '编辑器操作' },

  // Pager
  'pager-prev': { x: 486, y: 540, width: 16, height: 16, label: '上一页', group: '分页' },
  'pager-next': { x: 780, y: 540, width: 16, height: 16, label: '下一页', group: '分页' },

  // Asset actions
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
  'asset-upload': { x: 1418, y: 540, width: 16, height: 16, label: '上传', group: '资源卡片操作' },
  'asset-upload-active': { x: 1418, y: 624, width: 16, height: 16, label: '上传(选中)', group: '资源卡片操作' },
  'asset-star': { x: 1515, y: 391, width: 20, height: 20, label: '收藏', group: '资源卡片操作' },
  'asset-star-active': { x: 1574, y: 391, width: 20, height: 20, label: '收藏(选中)', group: '资源卡片操作' },
  'asset-check': { x: 667, y: 700, width: 18, height: 18, label: '已选择', group: '资源卡片操作' },

  // Flow steps
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
  'flow-dubbing-edited': { x: 100, y: 373, width: 24, height: 24, label: '配音(已编辑)', group: '流程步骤' },
  'flow-dubbing-editing': { x: 165, y: 373, width: 24, height: 24, label: '配音(编辑中)', group: '流程步骤' },
  'flow-dubbing-unedited': { x: 233, y: 373, width: 24, height: 24, label: '配音(未编辑)', group: '流程步骤' },
  'flow-complete-edited': { x: 100, y: 464, width: 24, height: 24, label: '完成(已编辑)', group: '流程步骤' },
  'flow-complete-editing': { x: 165, y: 464, width: 24, height: 24, label: '完成(编辑中)', group: '流程步骤' },
  'flow-complete-unedited': { x: 233, y: 464, width: 24, height: 24, label: '完成(未编辑)', group: '流程步骤' },
} satisfies Record<string, FigmaIconDef>

export type FigmaIconName = keyof typeof FIGMA_ICON_LIBRARY

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
