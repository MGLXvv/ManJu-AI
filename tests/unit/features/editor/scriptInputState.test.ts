import { describe, expect, it } from 'vitest'
import { validateScriptImportFile, validateScriptTextContent } from '@/features/editor/scriptInputState'

describe('scriptInputState', () => {
  it('accepts plain text files', () => {
    expect(validateScriptImportFile({ name: 'demo.txt' }).ok).toBe(true)
    expect(validateScriptImportFile({ name: 'demo.md' }).ok).toBe(true)
    expect(validateScriptImportFile({ name: 'demo.text' }).ok).toBe(true)
  })

  it('rejects word documents with a clear message', () => {
    const result = validateScriptImportFile({ name: 'demo.docx' })

    expect(result.ok).toBe(false)
    expect(result.message).toContain('暂不支持 Word 文档导入')
  })

  it('rejects unsupported file types with a format message', () => {
    expect(validateScriptImportFile({ name: 'demo.pdf' })).toEqual({
      ok: false,
      message: '仅支持 TXT、Markdown 或纯文本文件导入',
    })

    expect(validateScriptImportFile({ name: 'demo.png' })).toEqual({
      ok: false,
      message: '仅支持 TXT、Markdown 或纯文本文件导入',
    })
  })

  it('rejects empty text content', () => {
    const result = validateScriptTextContent('   ')

    expect(result.ok).toBe(false)
    expect(result.message).toContain('内容为空')
  })

  it('rejects text over 5000 characters', () => {
    const result = validateScriptTextContent('a'.repeat(5001))

    expect(result.ok).toBe(false)
    expect(result.message).toContain('5000')
  })

  it('accepts valid text content', () => {
    expect(validateScriptTextContent('这是一段文案')).toEqual({ ok: true })
  })
})
