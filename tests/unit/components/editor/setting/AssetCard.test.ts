import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import AssetCard from '@/components/editor/setting/AssetCard.vue'
import type { SettingAsset } from '@/types/settingAsset'

const baseAsset: SettingAsset = {
  id: 'asset-1',
  type: 'character',
  title: '角色 1',
  roleName: '冷面保镖',
  description: '沉稳寡言的角色设定',
  prompt: '角色提示词',
  imageUrls: ['image-1'],
  candidateImages: ['image-1', 'image-2'],
  selectedVoiceId: 'voice-1',
  voiceOptions: [{ id: 'voice-1', name: '旁白' }],
  status: 'ready',
  favorite: false,
  createdAt: '2026-03-12 17:16',
}

const renderComponent = async (props: Record<string, unknown>) =>
  renderToString(
    createSSRApp({
      render: () => h(AssetCard as any, props),
    }),
  )

describe('AssetCard', () => {
  it('shows the batch checkbox only when batch mode is enabled', async () => {
    const plainHtml = await renderComponent({
      asset: baseAsset,
      isSelected: false,
      isExpanded: false,
      batchMode: false,
      isBatchSelected: false,
    })
    expect(plainHtml).not.toContain('asset-card__batch-check')

    const batchHtml = await renderComponent({
      asset: baseAsset,
      isSelected: false,
      isExpanded: false,
      batchMode: true,
      isBatchSelected: true,
    })
    expect(batchHtml).toContain('asset-card__batch-check')
  })
})
