import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import AuthFormCard from '@/components/auth/AuthFormCard.vue'

const renderComponent = async (props: Record<string, unknown>) =>
  renderToString(
    createSSRApp({
      render: () => h(AuthFormCard as any, props),
    }).use(i18n),
  )

describe('AuthFormCard', () => {
  it('hides register, forgot-password, and social-login entries when disabled by the page', async () => {
    const html = await renderComponent({
      mode: 'password',
      account: 'admin',
      password: '123456',
      agreed: true,
      showRegisterEntry: false,
      showForgotPassword: false,
      showSocialLogin: false,
    })

    expect(html).not.toContain('auth-card__register-link')
    expect(html).not.toContain('auth-card__link')
    expect(html).not.toContain('auth-social')
  })

  it('keeps the code-login tab visible in the simplified login flow', async () => {
    const html = await renderComponent({
      mode: 'code',
      account: '13800138000',
      password: '',
      code: '',
      agreed: true,
      showRegisterEntry: false,
      showForgotPassword: false,
      showSocialLogin: false,
    })

    expect(html).toContain('auth-card__tab')
    expect(html).toContain('auth-card__code-btn')
  })
})
