export type ProjectArtifactKind = 'project' | 'setting' | 'storyboard' | 'video' | 'dubbing'

export interface ProjectArtifactEnvelope<TPayload> {
  version: 'mock-v1'
  artifact: ProjectArtifactKind
  projectId: string
  exportedAt: string
  payload: TPayload
}

export const sanitizeProjectArtifactId = (value: string, fallback: string): string => {
  const normalized = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || fallback
}

export const buildProjectArtifactEnvelope = <TPayload>(input: {
  artifact: ProjectArtifactKind
  projectId: string
  payload: TPayload
}): ProjectArtifactEnvelope<TPayload> => ({
  version: 'mock-v1',
  artifact: input.artifact,
  projectId: input.projectId,
  exportedAt: new Date().toISOString(),
  payload: input.payload,
})

export const buildProjectArtifactFileName = (projectId: string, artifact: ProjectArtifactKind): string => {
  const sanitized = sanitizeProjectArtifactId(projectId, artifact)
  return `${sanitized}-${artifact}.json`
}
