import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import CreateAssetModal from './CreateAssetModal.vue'

const renderComponent = async (props: Record<string, unknown>) => {
  const context: { teleports?: Record<string, string> } = {}

  await renderToString(
    createSSRApp({
      render: () => h(CreateAssetModal as any, props),
    }),
    context,
  )

  return context.teleports?.body ?? ''
}

describe('CreateAssetModal', () => {
  it('shows default voice selection for character assets when voice options are provided', async () => {
    const html = await renderComponent({
      open: true,
      voiceOptions: [
        { id: 'voice-1', label: '浑厚男中音', value: 'voice-1', name: '浑厚男中音' },
      ],
    })

    expect(html).toContain('默认音色')
    expect(html).toContain('浑厚男中音')
  })
})
