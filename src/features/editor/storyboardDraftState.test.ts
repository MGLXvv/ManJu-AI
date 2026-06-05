import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { storyboardTagOptions } from '@/mocks/storyboard.mock'
import type { StoryboardShot } from '@/types/storyboard'
import { normalizeStoryboardShotsWithTagOptions, resolveStoryboardTagOptions } from './storyboardDraftState'

describe('storyboardDraftState', () => {
  it('uses fallback tag options when draft has no setting summaries', () => {
    const draft = createDefaultEditorDraft('project-1')
    expect(resolveStoryboardTagOptions(draft, storyboardTagOptions)).toEqual(storyboardTagOptions)
  })

  it('builds tag options from setting summaries', () => {
    const draft = createDefaultEditorDraft('project-1')
    draft.characters = [{ id: 'c1', name: '男主', description: 'desc' }]
    draft.scenes = [{ id: 's1', name: '街道', description: 'desc' }]
    draft.props = [{ id: 'p1', name: '长剑', description: 'desc' }]

    expect(resolveStoryboardTagOptions(draft, storyboardTagOptions)).toEqual({
      characters: [{ id: 'c1', name: '男主', type: 'character' }],
      scenes: [{ id: 's1', name: '街道', type: 'scene' }],
      props: [{ id: 'p1', name: '长剑', type: 'prop' }],
    })
  })

  it('drops shot tags that are not present in current tag options', () => {
    const shots: StoryboardShot[] = [
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        imageUrl: '',
        prompt: '',
        characters: [{ id: 'old-character', name: '旧角色', type: 'character' }],
        scenes: [{ id: 's1', name: '街道', type: 'scene' }],
        props: [{ id: 'old-prop', name: '旧道具', type: 'prop' }],
        style: '国风漫画',
        ratio: '16:9',
        status: 'idle',
        referenceImages: [],
        createdAt: '2026-03-12 17:16',
      },
    ]

    const normalized = normalizeStoryboardShotsWithTagOptions(shots, {
      characters: [{ id: 'c1', name: '男主', type: 'character' }],
      scenes: [{ id: 's1', name: '街道', type: 'scene' }],
      props: [{ id: 'p1', name: '长剑', type: 'prop' }],
    })

    expect(normalized[0].characters).toEqual([])
    expect(normalized[0].scenes).toEqual([{ id: 's1', name: '街道', type: 'scene' }])
    expect(normalized[0].props).toEqual([])
  })
})
