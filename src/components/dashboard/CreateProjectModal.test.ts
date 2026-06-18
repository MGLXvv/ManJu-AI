import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import CreateProjectModal from './CreateProjectModal.vue'

const renderComponent = async (props: Record<string, unknown>) => {
  const context: { teleports?: Record<string, string> } = {}

  await renderToString(
    createSSRApp({
      render: () => h(CreateProjectModal as any, props),
    }),
    context,
  )

  return context.teleports?.body ?? ''
}

describe('CreateProjectModal', () => {
  it('renders project style options from props instead of hard-coded presets', async () => {
    const html = await renderComponent({
      open: true,
      styleOptions: [
        { id: 'style-1', label: '水墨叙事', value: '水墨叙事' },
        { id: 'style-2', label: '低饱和电影感', value: '低饱和电影感' },
      ],
    })

    expect(html).toContain('水墨叙事')
    expect(html).toContain('低饱和电影感')
    expect(html).not.toContain('国漫')
    expect(html).not.toContain('赛博朋克')
  })

  it('shows a stable empty-state message and disables submit when no styles are available', async () => {
    const html = await renderComponent({
      open: true,
      styleOptions: [],
    })

    expect(html).toContain('暂无可用风格，请先到系统管理中添加风格')
    expect(html).toContain('disabled')
  })
})
