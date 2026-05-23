export interface Asset {
  id: string
  type: 'character' | 'scene' | 'prop'
  name: string
  prompt: string
  imageUrls: string[]
  favorite: boolean
}
