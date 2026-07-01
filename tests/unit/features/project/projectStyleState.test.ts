import { describe, expect, it } from 'vitest'
import { mapSystemStylesToProjectStyleOptions } from '@/features/project/projectStyleState'

describe('projectStyleState', () => {
  it('maps enabled system styles into project style options', () => {
    expect(
      mapSystemStylesToProjectStyleOptions([
        {
          id: 'style-1',
          name: '国风漫画',
          category: '国风',
          prompt: '水墨线条与暖金配色',
          enabled: true,
        },
      ]),
    ).toEqual([
      {
        id: 'style-1',
        label: '国风漫画',
        value: '国风漫画',
        description: '水墨线条与暖金配色',
        previewUrl: undefined,
      },
    ])
  })

  it('filters out disabled styles', () => {
    expect(
      mapSystemStylesToProjectStyleOptions([
        {
          id: 'style-1',
          name: '国风漫画',
          category: '国风',
          prompt: '可用',
          enabled: true,
        },
        {
          id: 'style-2',
          name: '赛博朋克',
          category: '未来',
          prompt: '禁用',
          enabled: false,
        },
      ]).map((item) => item.value),
    ).toEqual(['国风漫画'])
  })

  it('returns no fallback style when no enabled system style exists', () => {
    expect(mapSystemStylesToProjectStyleOptions([])).toEqual([])
  })
})