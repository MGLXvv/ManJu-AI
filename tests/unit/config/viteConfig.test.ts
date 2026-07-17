import { describe, expect, it } from 'vitest'
import { resolveAssetInlining, resolveVendorChunk } from '../../../vite.config'

describe('vite build policy', () => {
  it('groups framework and HTTP dependencies across path separators', () => {
    expect(resolveVendorChunk('/repo/node_modules/vue/dist/vue.runtime.esm-bundler.js')).toBe('framework')
    expect(resolveVendorChunk('F:\\repo\\node_modules\\@vue\\runtime-core\\dist\\runtime-core.esm-bundler.js')).toBe(
      'framework',
    )
    expect(resolveVendorChunk('/repo/node_modules/axios/index.js')).toBe('http-vendor')
    expect(resolveVendorChunk('/repo/node_modules/date-fns/index.js')).toBeUndefined()
    expect(resolveVendorChunk('/repo/src/main.ts')).toBeUndefined()
  })

  it('keeps SVG payloads out of JavaScript while preserving default handling for other assets', () => {
    expect(resolveAssetInlining('/repo/src/assets/icon.SVG')).toBe(false)
    expect(resolveAssetInlining('/repo/src/assets/photo.webp')).toBeUndefined()
  })
})