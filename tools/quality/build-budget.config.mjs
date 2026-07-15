import { KIB, MIB } from './file-utils.mjs'

export const sourceAssetRules = [
  {
    name: 'image',
    test: /\.(?:png|jpe?g|webp|avif|gif|svg)$/i,
    maxBytes: 1.5 * MIB,
  },
  {
    name: 'font',
    test: /\.(?:woff2?|ttf|otf)$/i,
    maxBytes: 750 * KIB,
  },
  {
    name: 'media',
    test: /\.(?:mp4|webm|mov|mp3|wav|ogg|m4a)$/i,
    maxBytes: 12 * MIB,
  },
]

export const sourceAssetExemptions = []

export const buildFileRules = [
  {
    name: 'JavaScript chunk',
    test: /\.js$/i,
    maxBytes: 850 * KIB,
  },
  {
    name: 'CSS bundle',
    test: /\.css$/i,
    maxBytes: 400 * KIB,
  },
  {
    name: 'image',
    test: /\.(?:png|jpe?g|webp|avif|gif|svg)$/i,
    maxBytes: 1.5 * MIB,
  },
  {
    name: 'font',
    test: /\.(?:woff2?|ttf|otf)$/i,
    maxBytes: 750 * KIB,
  },
  {
    name: 'media',
    test: /\.(?:mp4|webm|mov|mp3|wav|ogg|m4a)$/i,
    maxBytes: 2 * MIB,
  },
]

export const buildFileExemptions = []

export const buildTotalBudgets = {
  javascript: 1.2 * MIB,
  css: 300 * KIB,
  assets: 3.5 * MIB,
  dist: 5 * MIB,
}

export const buildReportTopFileCount = 20
