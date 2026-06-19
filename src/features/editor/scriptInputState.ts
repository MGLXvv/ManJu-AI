export const SCRIPT_TEXT_LIMITS = {
  min: 1,
  max: 5000,
} as const

export const SUPPORTED_SCRIPT_IMPORT_EXTENSIONS = ['txt', 'md', 'text'] as const

export interface ScriptImportValidationResult {
  ok: boolean
  message?: string
}

const getFileExtension = (fileName: string): string => {
  const extension = fileName.split('.').pop()
  return extension?.toLowerCase() ?? ''
}

export const validateScriptImportFile = (file: { name: string }): ScriptImportValidationResult => {
  const extension = getFileExtension(file.name)

  if (!SUPPORTED_SCRIPT_IMPORT_EXTENSIONS.includes(extension as (typeof SUPPORTED_SCRIPT_IMPORT_EXTENSIONS)[number])) {
    if (extension === 'docx' || extension === 'doc') {
      return {
        ok: false,
        message: '当前版本暂不支持 Word 文档导入，请先转换为 TXT 或 Markdown 文本后再上传',
      }
    }

    return {
      ok: false,
      message: '仅支持 TXT、Markdown 或纯文本文件导入',
    }
  }

  return { ok: true }
}

export const validateScriptTextContent = (content: string): ScriptImportValidationResult => {
  const normalized = content.trim()

  if (!normalized || normalized.length < SCRIPT_TEXT_LIMITS.min) {
    return {
      ok: false,
      message: '导入文件内容为空，请检查后重新上传',
    }
  }

  if (normalized.length > SCRIPT_TEXT_LIMITS.max) {
    return {
      ok: false,
      message: `文案内容不能超过 ${SCRIPT_TEXT_LIMITS.max} 字，请精简后再导入`,
    }
  }

  return { ok: true }
}
