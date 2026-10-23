import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/common/BaseButton.vue'

describe('BaseButton', () => {
  it('renders the slot inside a type="button" by default', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Click me' } })
    const button = wrapper.find('button')
    expect(button.text()).toBe('Click me')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('passes the type and disabled props through', () => {
    const wrapper = mount(BaseButton, { props: { type: 'submit', disabled: true } })
    expect(wrapper.attributes('type')).toBe('submit')
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('uses the filled style by default and the outlined style when secondary', () => {
    const primary = mount(BaseButton)
    const secondary = mount(BaseButton, { props: { secondary: true } })
    expect(primary.classes()).toContain('bg-indigo-600')
    expect(primary.classes()).not.toContain('border')
    expect(secondary.classes()).toContain('border')
    expect(secondary.classes()).not.toContain('bg-indigo-600')
  })

  it('falls through click listeners and extra classes', async () => {
    const clicks: MouseEvent[] = []
    const wrapper = mount(BaseButton, {
      attrs: { class: 'w-full', onClick: (e: MouseEvent) => clicks.push(e) },
    })
    expect(wrapper.classes()).toContain('w-full')
    await wrapper.trigger('click')
    expect(clicks).toHaveLength(1)
  })

  it('does not fire click when disabled', async () => {
    const clicks: MouseEvent[] = []
    const wrapper = mount(BaseButton, {
      props: { disabled: true },
      attrs: { onClick: (e: MouseEvent) => clicks.push(e) },
    })
    await wrapper.trigger('click')
    expect(clicks).toHaveLength(0)
  })
})
