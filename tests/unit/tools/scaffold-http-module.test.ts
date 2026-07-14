import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error The executable Node integration helper intentionally ships without TypeScript declarations.
import { scaffoldHttpModule } from '../../../tools/integration/scaffold-http-module.mjs'

const temporaryDirectories: string[] = []

const createTemporaryRoot = async (): Promise<string> => {
  const directory = await mkdtemp(path.join(tmpdir(), 'manju-http-module-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('HTTP module scaffold', () => {
  it('creates a safe six-file adapter module without implementing a guessed endpoint', async () => {
    const rootDir = await createTemporaryRoot()

    const result = await scaffoldHttpModule({
      moduleName: 'example-catalog',
      rootDir,
    })

    expect(result.files).toHaveLength(6)

    const httpSource = await readFile(path.join(rootDir, 'example-catalog/example-catalog.http.ts'), 'utf8')
    const apiSource = await readFile(path.join(rootDir, 'example-catalog/example-catalog.api.ts'), 'utf8')
    const mapperSource = await readFile(path.join(rootDir, 'example-catalog/example-catalog.mapper.ts'), 'utf8')

    expect(httpSource).toContain('EXAMPLE_CATALOG_HTTP_CONTRACT_NOT_IMPLEMENTED')
    expect(httpSource).not.toContain("http.get('")
    expect(apiSource).toContain("runtimeConfig.apiMode === 'http'")
    expect(mapperSource).toContain('mapBackendExampleCatalog')
  })

  it('supports dry-run without writing files', async () => {
    const rootDir = await createTemporaryRoot()

    const result = await scaffoldHttpModule({
      moduleName: 'dry-run-module',
      rootDir,
      dryRun: true,
    })

    expect(result.dryRun).toBe(true)
    await expect(readFile(result.files[0], 'utf8')).rejects.toThrow()
  })

  it('rejects invalid module names', async () => {
    const rootDir = await createTemporaryRoot()

    await expect(
      scaffoldHttpModule({
        moduleName: '../unsafe',
        rootDir,
      }),
    ).rejects.toThrow('HTTP_MODULE_NAME_INVALID')
  })

  it('never overwrites an existing generated module', async () => {
    const rootDir = await createTemporaryRoot()
    const options = {
      moduleName: 'existing-module',
      rootDir,
    }

    await scaffoldHttpModule(options)

    await expect(scaffoldHttpModule(options)).rejects.toThrow('HTTP_MODULE_TARGET_EXISTS')
  })
})
