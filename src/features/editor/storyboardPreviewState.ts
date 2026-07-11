import { mediaBlobRepository } from '@/services/media/mediaBlobRepository'
import type { StoryboardImageEditRecord, StoryboardImageEditSelection } from '@/types/storyboard'

export interface StoryboardSaveStateInput {
  submitting: boolean
  isDirty: boolean
}

export interface StoryboardSaveState {
  label: '保存中' | '未保存' | '已保存'
  tone: 'saving' | 'dirty' | 'saved'
}

export type StoryboardSelectionRect = StoryboardImageEditSelection

export interface BuildStoryboardEditedImageInput {
  sourceUrl: string
  prompt: string
  title: string
  selection: StoryboardSelectionRect
}

export interface BuildStoryboardEditedImageResult {
  imageUrl: string
  referenceLabel: string
}

export interface BuildStoryboardImageEditRecordInput {
  prompt: string
  selection: StoryboardSelectionRect
  sourceImageUrl: string
  resultImageUrl: string
  id?: string
  now?: string
}

export interface BuildStoryboardUpscaledImageInput {
  sourceUrl: string
  title: string
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

const normalizePrompt = (prompt: string): string => prompt.trim().replace(/\s+/g, ' ')

export const buildStoryboardSaveState = ({ submitting, isDirty }: StoryboardSaveStateInput): StoryboardSaveState => {
  if (submitting) {
    return { label: '保存中', tone: 'saving' }
  }

  if (isDirty) {
    return { label: '未保存', tone: 'dirty' }
  }

  return { label: '已保存', tone: 'saved' }
}

export const clampStoryboardSelection = (selection: StoryboardSelectionRect): StoryboardSelectionRect => {
  const x1 = clamp(Math.min(selection.x, selection.x + selection.width), 0, 100)
  const y1 = clamp(Math.min(selection.y, selection.y + selection.height), 0, 100)
  const x2 = clamp(Math.max(selection.x, selection.x + selection.width), 0, 100)
  const y2 = clamp(Math.max(selection.y, selection.y + selection.height), 0, 100)

  return {
    x: x1,
    y: y1,
    width: Math.max(x2 - x1, 0),
    height: Math.max(y2 - y1, 0),
  }
}

const summarizePrompt = (prompt: string): string => {
  const normalized = normalizePrompt(prompt)
  if (!normalized) {
    return '未填写编辑提示词'
  }

  return normalized.length > 28 ? `${normalized.slice(0, 28)}...` : normalized
}

export const buildStoryboardEditedImage = ({
  sourceUrl,
  prompt,
  title,
  selection,
}: BuildStoryboardEditedImageInput): BuildStoryboardEditedImageResult => {
  const safeSelection = clampStoryboardSelection(selection)
  const overlayX = (safeSelection.x / 100) * 1280
  const overlayY = (safeSelection.y / 100) * 720
  const overlayWidth = (safeSelection.width / 100) * 1280
  const overlayHeight = (safeSelection.height / 100) * 720
  const promptSummary = summarizePrompt(prompt)

  const imageUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6f50ff" stop-opacity="0.76" />
          <stop offset="100%" stop-color="#ef86ff" stop-opacity="0.42" />
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="#111215" />
      <image href="${sourceUrl}" width="1280" height="720" preserveAspectRatio="xMidYMid slice" />
      <rect x="${overlayX}" y="${overlayY}" width="${overlayWidth}" height="${overlayHeight}" rx="18" fill="url(#panel)" stroke="#fff" stroke-width="4" stroke-dasharray="14 10" />
      <rect x="0" y="564" width="1280" height="156" fill="rgba(9,10,12,0.72)" />
      <text x="36" y="626" fill="#ffffff" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="56" font-weight="700">${title} · AI编辑</text>
      <text x="36" y="680" fill="#dfe2ea" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="30">${promptSummary}</text>
    </svg>`,
  )}`

  return {
    imageUrl,
    referenceLabel: '编辑结果',
  }
}

export const buildStoryboardImageEditRecord = ({
  prompt,
  selection,
  sourceImageUrl,
  resultImageUrl,
  id,
  now,
}: BuildStoryboardImageEditRecordInput): StoryboardImageEditRecord => {
  const sourceMediaId = mediaBlobRepository.findIdByUrl(sourceImageUrl)
  const resultMediaId = mediaBlobRepository.findIdByUrl(resultImageUrl)

  return {
    id: id ?? `edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    prompt: normalizePrompt(prompt),
    selection: clampStoryboardSelection(selection),
    sourceImageUrl,
    ...(sourceMediaId ? { sourceMediaId } : {}),
    resultImageUrl,
    ...(resultMediaId ? { resultMediaId } : {}),
    createdAt: now ?? new Date().toISOString(),
  }
}

export const buildStoryboardUpscaledImage = ({
  sourceUrl,
  title,
}: BuildStoryboardUpscaledImageInput): BuildStoryboardEditedImageResult => {
  const imageUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#4fd5ff" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#fff1a6" stop-opacity="0.56" />
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="#0b1220" />
      <image href="${sourceUrl}" width="1280" height="720" preserveAspectRatio="xMidYMid slice" />
      <rect width="1280" height="720" fill="url(#shine)" opacity="0.24" />
      <rect x="48" y="42" width="1184" height="636" rx="28" fill="none" stroke="#ffffff" stroke-opacity="0.9" stroke-width="8" />
      <rect x="0" y="588" width="1280" height="132" fill="rgba(4,8,15,0.62)" />
      <text x="38" y="650" fill="#ffffff" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="54" font-weight="700">${title} · 高清放大</text>
      <text x="38" y="694" fill="#d8edf7" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="28">增强清晰度、细节和边缘质感</text>
    </svg>`,
  )}`

  return {
    imageUrl,
    referenceLabel: '高清放大',
  }
}

export const canOpenStoryboardImageTools = (imageUrl?: string): boolean => Boolean(imageUrl)
