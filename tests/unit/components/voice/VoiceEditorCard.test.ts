// @vitest-environment happy-dom

import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VoiceEditorCard from '@/components/voice/VoiceEditorCard.vue'

const setInputFile = (input: HTMLInputElement, file: File): void => {
  Object.defineProperty(input, 'files', { configurable: true, value: [file] })
}

const finishMetadata = (audio: HTMLAudioElement, duration: number): void => {
  Object.defineProperty(audio, 'duration', { configurable: true, value: duration })
  audio.onloadedmetadata?.(new Event('loadedmetadata'))
}

describe('VoiceEditorCard media lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('releases replaced previews and ignores stale duration results', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:audio-first')
      .mockReturnValueOnce('blob:audio-second')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const originalCreateElement = document.createElement.bind(document)
    const audioElements: HTMLAudioElement[] = []
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options)
      if (tagName === 'audio') audioElements.push(element as HTMLAudioElement)
      return element
    }) as typeof document.createElement)

    const wrapper = mount(VoiceEditorCard, {
      props: { modelValue: '测试音色' },
      global: { stubs: { FigmaIcon: defineComponent({ template: '<span />' }) } },
    })
    const input = wrapper.get('input[type="file"]')
    const firstFile = new File(['first'], 'first.mp3', { type: 'audio/mpeg' })
    const secondFile = new File(['second'], 'second.mp3', { type: 'audio/mpeg' })

    setInputFile(input.element as HTMLInputElement, firstFile)
    await input.trigger('change')
    await nextTick()
    setInputFile(input.element as HTMLInputElement, secondFile)
    await input.trigger('change')
    await nextTick()

    expect(createObjectURL).toHaveBeenNthCalledWith(1, firstFile)
    expect(createObjectURL).toHaveBeenNthCalledWith(2, secondFile)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:audio-first')

    finishMetadata(audioElements[0], 11)
    finishMetadata(audioElements[1], 22)
    await flushPromises()
    await wrapper.get('.voice-editor-card__save').trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      name: '测试音色',
      audioUrl: 'blob:audio-second',
      audioFile: secondFile,
      duration: 22,
    })

    wrapper.unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:audio-second')
    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
  })

  it('releases an unsaved preview when editing is cancelled', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:audio-cancelled')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const wrapper = mount(VoiceEditorCard, {
      props: { modelValue: '待取消音色' },
      global: { stubs: { FigmaIcon: defineComponent({ template: '<span />' }) } },
    })
    const input = wrapper.get('input[type="file"]')
    setInputFile(input.element as HTMLInputElement, new File(['audio'], 'cancel.mp3', { type: 'audio/mpeg' }))
    await input.trigger('change')
    await wrapper.get('.voice-editor-card__ghost').trigger('click')

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:audio-cancelled')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    wrapper.unmount()
    expect(revokeObjectURL).toHaveBeenCalledTimes(1)
  })
})
