import { http } from '@/api/http'
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
    const { data } = await http.post(`/storyboard/shots/${shot.id}/image`, { imageUrl })
    return data.shot
  },

  async uploadShotVideo(shot: StoryboardShot, videoUrl: string) {
    const { data } = await http.post(`/storyboard/shots/${shot.id}/video`, { videoUrl })
    return data.shot
  },

  async applyEditedImage(shot: StoryboardShot, imageUrl: string) {
    const { data } = await http.post(`/storyboard/shots/${shot.id}/edited-image`, { imageUrl })
    return data.shot
  },

  async generateShotImage(shot: StoryboardShot) {
    const { data } = await http.post(`/storyboard/shots/${shot.id}/generate-image`)
    return data
  },

  async generateVideo(shot: StoryboardShot) {
    const { data } = await http.post(`/storyboard/shots/${shot.id}/generate-video`)
    return data
  },

  async upscaleShotImage(shot: StoryboardShot) {
    const { data } = await http.post(`/storyboard/shots/${shot.id}/upscale-image`)
    return data
  },
}
