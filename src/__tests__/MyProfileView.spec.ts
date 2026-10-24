import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MyProfileView from '@/views/MyProfileView.vue'
import type { User } from '@/types/user'

const auth = vi.hoisted(() => ({
  user: null as User | null,
  logout: vi.fn(),
}))

vi.mock('@/composables/useAuth', async () => {
  const { computed } = await import('vue')
  return {
    useAuth: () => ({
      user: computed(() => auth.user),
      token: computed(() => 'tok'),
      isAuthenticated: computed(() => true),
      login: vi.fn(),
      logout: auth.logout,
    }),
  }
})

const emailLine = (w: ReturnType<typeof mount>) =>
  w.findAll('p').find((p) => p.text().startsWith('Email:'))!
const button = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text() === text)!

describe('MyProfileView', () => {
  beforeEach(() => {
    auth.logout.mockClear()
    auth.user = {
      googleId: '1',
      name: 'Alice',
      email: 'alice@example.com',
      picture: 'https://img/a.png',
    }
  })

  it('greets the user and shows their picture', () => {
    const wrapper = mount(MyProfileView)
    expect(wrapper.find('h1').text()).toBe('Hello, Alice!')
    expect(wrapper.find('img').attributes()).toMatchObject({
      src: 'https://img/a.png',
      alt: 'Profile picture',
    })
  })

  it('masks the email by default and toggles it with show/hide', async () => {
    const wrapper = mount(MyProfileView)
    expect(emailLine(wrapper).text()).toBe('Email: a******@example.com [show]')

    await button(wrapper, '[show]').trigger('click')
    expect(emailLine(wrapper).text()).toBe('Email: alice@example.com [hide]')

    await button(wrapper, '[hide]').trigger('click')
    expect(emailLine(wrapper).text()).toBe('Email: a******@example.com [show]')
  })

  it('shows a placeholder when the email cannot be masked', () => {
    auth.user = { ...auth.user!, email: 'not-an-email' }
    const wrapper = mount(MyProfileView)
    expect(emailLine(wrapper).text()).toContain('Invalid email format')
  })

  it('calls logout when the logout button is clicked', async () => {
    const wrapper = mount(MyProfileView)
    await button(wrapper, 'Logout').trigger('click')
    expect(auth.logout).toHaveBeenCalledOnce()
  })
})
