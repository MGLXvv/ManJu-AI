import { describe, expect, it } from 'vitest'
import { buildImportedProjectName, normalizeImportedProject } from './projectImportState'

describe('projectImportState', () => {
  it('adds an imported marker to the imported project name', () => {
    expect(buildImportedProjectName('测试项目')).toBe('测试项目（导入）')
  })

  it('normalizes imported projects without reusing external identity fields', () => {
    const normalized = normalizeImportedProject({
      name: '示例项目',
      ratio: '16:9',
      style: '国风',
      status: 'in_progress',
      currentStep: 'storyboard',
    })

    expect(normalized).toMatchObject({
      name: '示例项目（导入）',
      ratio: '16:9',
      style: '国风',
      currentStep: 'storyboard',
    })
    expect('id' in normalized).toBe(false)
  })
})
