import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import ScriptResultPanel from '@/components/editor/script/ScriptResultPanel.vue'

const renderComponent = async (props: Record<string, unknown>, model = '已生成内容') =>
  renderToString(
    createSSRApp({
      render: () => h(ScriptResultPanel as any, { ...props, modelValue: model, 'onUpdate:modelValue': () => undefined }),
    }),
  )

describe('ScriptResultPanel', () => {
  it('hides the optimize entry when the page disables it', async () => {
    const html = await renderComponent({
      showOptimize: false,
    })

    expect(html).not.toContain('AI优化')
  })
})
