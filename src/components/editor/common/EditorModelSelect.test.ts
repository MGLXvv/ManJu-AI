import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import EditorModelSelect from './EditorModelSelect.vue'

const renderComponent = async (props: Record<string, unknown> = {}) =>
  renderToString(
    createSSRApp({
      render: () =>
        h(EditorModelSelect as any, {
          ...props,
          'onUpdate:modelValue': () => undefined,
        }),
    }),
  )

describe('EditorModelSelect', () => {
  it('renders shared editor-model-select classes and the default model label', async () => {
    const html = await renderComponent()

    expect(html).toContain('editor-model-select-wrap')
    expect(html).toContain('editor-model-select')
    expect(html).toContain('editor-model-select__label')
    expect(html).toContain('Gpt 4.0')
  })
})
