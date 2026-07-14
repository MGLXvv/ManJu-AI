import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const MODULE_NAME_PATTERN = /^[a-z][a-z0-9-]*$/

const toCamelCase = (value) => value.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase())
const toPascalCase = (value) => {
  const camel = toCamelCase(value)
  return `${camel.charAt(0).toUpperCase()}${camel.slice(1)}`
}

const fileExists = async (filePath) => {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

const buildFiles = (moduleName) => {
  const camelName = toCamelCase(moduleName)
  const pascalName = toPascalCase(moduleName)
  const errorPrefix = moduleName.replaceAll('-', '_').toUpperCase()

  return {
    [`${moduleName}.contract.ts`]: `import { defineBackendModuleContract } from '@/api/shared/backendContract'

/**
 * Replace TODO values only after checking the Integration Pack, Phase1 notes, OpenAPI or backend DTO source.
 * A READY/REAL backend endpoint is not frontend-verified until a Fixture and integration test exist.
 */
export const ${camelName}BackendContract = defineBackendModuleContract({
  module: '${moduleName}',
  backendCommit: 'TODO',
  endpoints: [
    {
      method: 'GET',
      path: 'TODO',
      readiness: 'UNKNOWN',
      evidence: 'not-started',
      source: 'TODO',
      notes: 'Do not implement a guessed path or DTO.',
    },
  ],
} as const)
`,
    [`${moduleName}.types.ts`]: `export interface ${pascalName} {
  id: string
}

export interface ${pascalName}ApiContract {
  list(): Promise<${pascalName}[]>
}
`,
    [`${moduleName}.mapper.ts`]: `import type { ${pascalName} } from './${moduleName}.types'

export interface Backend${pascalName}DTO {
  id?: string | number | null
}

/** Keep backend field aliases in this mapper; pages and stores consume only ${pascalName}. */
export const mapBackend${pascalName} = (dto: Backend${pascalName}DTO): ${pascalName} => ({
  id: String(dto.id ?? ''),
})
`,
    [`${moduleName}.http.ts`]: `import type { ${pascalName}ApiContract } from './${moduleName}.types'

/**
 * Implement only after ${moduleName}.contract.ts has a confirmed Method, path, DTO and evidence source.
 * HTTP mode must fail explicitly instead of falling back to Mock data.
 */
export const ${camelName}HttpApi: ${pascalName}ApiContract = {
  async list() {
    throw new Error('${errorPrefix}_HTTP_CONTRACT_NOT_IMPLEMENTED')
  },
}
`,
    [`${moduleName}.mock.ts`]: `import type { ${pascalName}ApiContract } from './${moduleName}.types'

export const ${camelName}MockApi: ${pascalName}ApiContract = {
  async list() {
    return []
  },
}
`,
    [`${moduleName}.api.ts`]: `import { runtimeConfig } from '@/config/runtimeConfig'
import { ${camelName}HttpApi } from './${moduleName}.http'
import { ${camelName}MockApi } from './${moduleName}.mock'
import type { ${pascalName}ApiContract } from './${moduleName}.types'

export const ${camelName}Api: ${pascalName}ApiContract =
  runtimeConfig.apiMode === 'http' ? ${camelName}HttpApi : ${camelName}MockApi
`,
    'index.ts': `export { ${camelName}Api } from './${moduleName}.api'
export { ${camelName}BackendContract } from './${moduleName}.contract'
export type { ${pascalName}, ${pascalName}ApiContract } from './${moduleName}.types'
`,
  }
}

export const scaffoldHttpModule = async ({ moduleName, rootDir = path.resolve('src/api/modules'), dryRun = false }) => {
  if (!MODULE_NAME_PATTERN.test(moduleName)) {
    throw new Error('HTTP_MODULE_NAME_INVALID')
  }

  const targetDir = path.join(rootDir, moduleName)
  const files = buildFiles(moduleName)
  const targets = Object.keys(files).map((fileName) => path.join(targetDir, fileName))

  for (const target of targets) {
    if (await fileExists(target)) {
      throw new Error(`HTTP_MODULE_TARGET_EXISTS:${target}`)
    }
  }

  if (!dryRun) {
    await mkdir(targetDir, { recursive: true })
    await Promise.all(
      Object.entries(files).map(([fileName, content]) => writeFile(path.join(targetDir, fileName), content, 'utf8')),
    )
  }

  return {
    moduleName,
    targetDir,
    files: targets,
    dryRun,
  }
}

const main = async () => {
  const moduleName = process.argv[2]?.trim() ?? ''
  const dryRun = process.argv.includes('--dry-run')

  if (!moduleName) {
    console.error('Usage: pnpm scaffold:http-module <kebab-case-module-name> [--dry-run]')
    process.exitCode = 1
    return
  }

  try {
    const result = await scaffoldHttpModule({ moduleName, dryRun })
    console.log(`${dryRun ? 'Would create' : 'Created'} HTTP module: ${result.moduleName}`)
    for (const filePath of result.files) console.log(`- ${path.relative(process.cwd(), filePath)}`)
    console.log('Next: confirm contract metadata, DTO, Mapper, Fixture, Capability and tests.')
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) await main()
