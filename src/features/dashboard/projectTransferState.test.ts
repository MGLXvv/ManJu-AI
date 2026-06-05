import { describe, expect, it } from 'vitest'
import { buildProjectExportFileName, parseImportedProjects } from './projectTransferState'

describe('projectTransferState', () => {
  it('builds a safe export filename from project name', () => {
    expect(buildProjectExportFileName('测试 / Project 01')).toBe('测试-Project-01.json')
  })

  it('parses a single imported project object into an array', () => {
    const parsed = parseImportedProjects(
      JSON.stringify({
        name: '导入项目',
        ratio: '16:9',
        style: '国漫',
      }),
    )

    expect(parsed).toEqual([
      {
        name: '导入项目',
        ratio: '16:9',
        style: '国漫',
      },
    ])
  })

  it('throws when imported json has no valid project entries', () => {
    expect(() => parseImportedProjects(JSON.stringify({ foo: 'bar' }))).toThrow('PROJECT_IMPORT_INVALID')
  })
})
