import { KIB, MIB } from './file-utils.mjs'

const LEGACY_LOGIN_ART_REASON =
  'Legacy login artwork must be recompressed from its original source during preproduction asset work.'
const LEGACY_MOCK_VIDEO_REASON =
  'Fixed Mock playback media must be recompressed or replaced during preproduction performance work.'

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

export const sourceAssetExemptions = [
  {
    test: /^src\/assets\/auth\/login-bg-1\.png$/,
    maxBytes: 1.5 * MIB,
    trackingIssue: '#17',
    reason: LEGACY_LOGIN_ART_REASON,
  },
  {
    test: /^src\/assets\/auth\/login-bg-2\.png$/,
    maxBytes: 5.5 * MIB,
    trackingIssue: '#17',
    reason: LEGACY_LOGIN_ART_REASON,
  },
  {
    test: /^public\/mock-media\/16-9\.mp4$/,
    maxBytes: 12 * MIB,
    trackingIssue: '#17',
    reason: LEGACY_MOCK_VIDEO_REASON,
  },
  {
    test: /^public\/mock-media\/9-16\.mp4$/,
    maxBytes: 27 * MIB,
    trackingIssue: '#17',
    reason: LEGACY_MOCK_VIDEO_REASON,
  },
]

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
    maxBytes: 12 * MIB,
  },
]

export const buildFileExemptions = [
  {
    test: /(?:^|\/)login-bg-1-[^/]+\.png$/,
    maxBytes: 1.5 * MIB,
    trackingIssue: '#17',
    reason: 'Legacy source artwork; runtime now loads only the selected background.',
    excludeFromTotal: true,
  },
  {
    test: /(?:^|\/)login-bg-2-[^/]+\.png$/,
    maxBytes: 5.5 * MIB,
    trackingIssue: '#17',
    reason: 'Legacy source artwork; runtime now loads only the selected background.',
    excludeFromTotal: true,
  },
  {
    test: /(?:^|\/)mock-media\/16-9\.mp4$/,
    maxBytes: 12 * MIB,
    trackingIssue: '#17',
    reason: LEGACY_MOCK_VIDEO_REASON,
    excludeFromTotal: true,
  },
  {
    test: /(?:^|\/)mock-media\/9-16\.mp4$/,
    maxBytes: 27 * MIB,
    trackingIssue: '#17',
    reason: LEGACY_MOCK_VIDEO_REASON,
    excludeFromTotal: true,
  },
]

export const buildTotalBudgets = {
  javascript: 5 * MIB,
  css: 1.5 * MIB,
  assets: 20 * MIB,
  dist: 25 * MIB,
}

export const buildReportTopFileCount = 20
