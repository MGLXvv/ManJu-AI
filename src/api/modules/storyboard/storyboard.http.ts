import { http } from '@/api/http'
import { assertHttpMediaUrl } from '@/services/media'
import type { StoryboardApiContract, StoryboardShot } from './storyboard.types'

export const storyboardHttpApi: StoryboardApiContract = {
  async listDefaults() {
    const { data } = await http.get('/storyboard/defaults')
    return data
  },

  async applyReferenceImage(shot: StoryboardShot, referenceImageId: string) {
    const { data } = await http.post(`/storyboard/shots/${shot.id}/reference/${referenceImageId}/apply`)
    return data.shot
  },

  async uploadShotImage(shot: StoryboardShot, imageUrl: string) {
    assertHttpMediaUrl(imageUrl, {
      targetType: 'storyboard-image',
      targetId: shot.id,
      kind: 'image',
    })
    const { data } = await http.post(`/storyboard/shots/${shot.id}/image`, { imageUrl })
    return data.shot
  },

  async uploadShotVideo(shot: StoryboardShot, videoUrl: string) {
    assertHttpMediaUrl(videoUrl, {
      targetType: 'storyboard-video',
      targetId: shot.id,
      kind: 'video',
    })
    const { data } = await http.post(`/storyboard/shots/${shot.id}/video`, { videoUrl })
    return data.shot
  },

  async applyEditedImage(shot: StoryboardShot, imageUrl: string) {
    assertHttpMediaUrl(imageUrl, {
      targetType: 'storyboard-edit',
      targetId: shot.id,
      kind: 'image',
    })
    const { data } = await http.post(`/storyboard/shots/${shot.id}/edited-image`, { imageUrl })
    return data.shot
  },

  /**
   * Legacy-compatible direct generation endpoint.
   * Primary image generation should use generation task APIs with type='storyboard'.
   */
  async generateShotImage(shot: StoryboardShot) {
    const { data } = await http.post(`/storyboard/shots/${shot.id}/generate-image`)
    return data
  },

  /**
   * Legacy-compatible direct generation endpoint.
   * Primary video generation should use generation task APIs with type='video'.
   */
  async generateVideo(shot: StoryboardShot) {
    const { data } = await http.post(`/storyboard/shots/${shot.id}/generate-video`)
    return data
  },

  /**
   * Legacy-compatible direct generation endpoint.
   * Primary upscale generation should use generation task APIs with type='storyboard_upscale'.
   */
  async upscaleShotImage(shot: StoryboardShot) {
    const { data } = await http.post(`/storyboard/shots/${shot.id}/upscale-image`)
    return data
  },
}
