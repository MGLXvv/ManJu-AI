import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()

const replaceExactlyOnce = (source, before, after, label) => {
  const firstIndex = source.indexOf(before)
  if (firstIndex < 0) throw new Error(`Unable to find ${label}.`)
  if (source.indexOf(before, firstIndex + before.length) >= 0) throw new Error(`${label} is not unique.`)
  return source.replace(before, after)
}

const loginPath = path.join(ROOT, 'src/pages/auth/LoginPage.vue')
let loginSource = await readFile(loginPath, 'utf8')

loginSource = replaceExactlyOnce(
  loginSource,
  "import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'",
  "import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'",
  'Vue lifecycle import',
)

loginSource = replaceExactlyOnce(
  loginSource,
  "import bg1 from '@/assets/auth/login-bg-1.png'\nimport bg2 from '@/assets/auth/login-bg-2.png'",
  "import { loadAuthHeroBackground, type AuthHeroModule } from '@/features/auth/authHeroBackground'",
  'static login background imports',
)

loginSource = replaceExactlyOnce(
  loginSource,
  `const heroCandidates = [bg1, bg2]\nconst heroIndex = Math.floor(Math.random() * heroCandidates.length)\n\nconst heroStyle = computed(() => ({\n  '--auth-login-hero-image': \`url(\"\${heroCandidates[heroIndex]}\")\`,\n}))`,
  `const heroModules = import.meta.glob<AuthHeroModule>('../../assets/auth/login-bg-*.png', { query: '?url' })\nconst heroLoaders = Object.values(heroModules)\nconst heroUrl = ref('')\n\nconst heroStyle = computed(() =>\n  heroUrl.value\n    ? { '--auth-login-hero-image': \`url(\"\${heroUrl.value}\")\` }\n    : {},\n)\n\nonMounted(async () => {\n  heroUrl.value = (await loadAuthHeroBackground(heroLoaders)) ?? ''\n})`,
  'login hero selection block',
)

await writeFile(loginPath, loginSource, 'utf8')

const stylePath = path.join(ROOT, 'src/styles/pages/login.scss')
let styleSource = await readFile(stylePath, 'utf8')
styleSource = replaceExactlyOnce(
  styleSource,
  '  background: var(--auth-login-hero-image) center / cover no-repeat;',
  `  background-color: #17131f;\n  background-image: var(\n    --auth-login-hero-image,\n    radial-gradient(circle at 28% 24%, rgb(155 92 255 / 32%), transparent 36%),\n    linear-gradient(135deg, #21172f 0%, #0a0a0b 64%)\n  );\n  background-position: center;\n  background-size: cover;\n  background-repeat: no-repeat;`,
  'login hero background declaration',
)
await writeFile(stylePath, styleSource, 'utf8')

console.log('Applied lazy login hero loading and gradient fallback.')
