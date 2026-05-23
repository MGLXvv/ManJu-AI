import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Asset } from '@/types/asset'

export const useAssetStore = defineStore('asset', () => {
  const assets = ref<Asset[]>([])
  return { assets }
})
