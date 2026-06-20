import { describe, expect, it } from 'vitest'
import {
  buildScriptTemplateInput,
  createEmptyScriptTemplateInput,
  hasScriptTemplateInputChanges,
  validateScriptTemplateInput,
} from '@/features/editor/scriptTemplateState'
import type { ScriptTemplate } from '@/types/scriptTemplate'

const templates: ScriptTemplate[] = [
  {
    id: 'template-1',
    name: '三幕短剧',
    content: '内容 A',
    updatedAt: '2026-06-09T09:00:00.000Z',
  },
]

describe('scriptTemplateState', () => {
  it('creates an empty template form', () => {
    expect(createEmptyScriptTemplateInput()).toEqual({
      name: '',
      content: '',
    })
  })

  it('builds form input from an existing template', () => {
    expect(buildScriptTemplateInput(templates[0])).toEqual({
      name: '三幕短剧',
      content: '内容 A',
    })
  })

  it('detects whether template form has changed', () => {
    expect(hasScriptTemplateInputChanges({ name: 'A', content: 'B' }, { name: ' A ', content: 'B' })).toBe(false)
    expect(hasScriptTemplateInputChanges({ name: 'A', content: 'B' }, { name: 'A', content: 'C' })).toBe(true)
  })

  it('validates required fields', () => {
    const result = validateScriptTemplateInput(templates, { name: '', content: '' }, null)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.name).toBe('请输入模板名称')
      expect(result.errors.content).toBe('请输入模板内容')
    }
  })

  it('rejects duplicated names regardless of english case', () => {
    const duplicatedTemplates: ScriptTemplate[] = [
      {
        id: 'template-2',
        name: 'Light Comedy',
        content: '内容 B',
        updatedAt: '2026-06-09T09:05:00.000Z',
      },
    ]

    const result = validateScriptTemplateInput(duplicatedTemplates, { name: 'light comedy', content: '内容 C' }, null)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.name).toBe('模板名称已存在，请更换后重试')
    }
  })

  it('allows editing current template without treating its own name as duplicate', () => {
    const result = validateScriptTemplateInput(templates, { name: '三幕短剧', content: '内容 A 2' }, 'template-1')

    expect(result).toEqual({
      ok: true,
      value: {
        name: '三幕短剧',
        content: '内容 A 2',
      },
    })
  })
})
