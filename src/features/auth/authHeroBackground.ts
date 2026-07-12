export interface AuthHeroModule {
  default: string
}

export type AuthHeroLoader = () => Promise<AuthHeroModule>

export const pickAuthHeroLoader = (
  loaders: readonly AuthHeroLoader[],
  random: () => number = Math.random,
): AuthHeroLoader | null => {
  if (loaders.length === 0) return null

  const randomValue = random()
  const sample = Number.isFinite(randomValue) ? Math.min(Math.max(randomValue, 0), 0.999999999) : 0
  const index = Math.floor(sample * loaders.length)
  return loaders[index] ?? loaders[0] ?? null
}

export const loadAuthHeroBackground = async (
  loaders: readonly AuthHeroLoader[],
  random: () => number = Math.random,
): Promise<string | null> => {
  const loader = pickAuthHeroLoader(loaders, random)
  if (!loader) return null

  try {
    const module = await loader()
    return module.default || null
  } catch {
    return null
  }
}
