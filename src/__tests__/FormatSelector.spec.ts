import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import Select from 'primevue/select'
import FormatSelector from '@/components/fileconverter/FormatSelector.vue'
import { ConverterService } from '@/services/converter.service'

vi.mock('@/services/converter.service', () => ({
  ConverterService: { getSupportedFormats: vi.fn() },
}))

let pinia: Pinia

const mountSelector = (props: Record<string, unknown> = {}) =>
  mount(FormatSelector, {
    props: { formats: ['mp3', 'png'], ...props },
    global: { plugins: [pinia] },
  })

describe('FormatSelector', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    vi.mocked(ConverterService.getSupportedFormats).mockResolvedValue({
      video: [],
      audio: [],
      image: [],
    })
  })

  it('offers one upper-cased option per format', () => {
    const wrapper = mountSelector()
    expect(wrapper.findComponent(Select).props('options')).toEqual([
      { label: 'MP3', value: 'mp3' },
      { label: 'PNG', value: 'png' },
    ])
  })

  it('reflects and emits the targetFormat model', async () => {
    const wrapper = mountSelector({ targetFormat: 'png' })
    expect(wrapper.findComponent(Select).props('modelValue')).toBe('png')
    expect(wrapper.text()).toContain('PNG')

    await wrapper.findComponent(Select).setValue('mp3')
    expect(wrapper.emitted('update:targetFormat')).toEqual([['mp3']])
  })

  it('shows a disabled loading select while loading', () => {
    const wrapper = mountSelector({ isLoading: true, isError: true })
    const select = wrapper.findComponent(Select)
    expect(wrapper.text()).toContain('Loading...')
    expect(select.props()).toMatchObject({ loading: true, disabled: true })
    expect(wrapper.find('button[title="Retry fetching formats"]').exists()).toBe(false)
  })

  it('shows a disabled error select and a retry button on error', () => {
    const wrapper = mountSelector({ isError: true })
    const select = wrapper.findComponent(Select)
    expect(select.props()).toMatchObject({ disabled: true, invalid: true })
    expect(select.text()).toBe('Error loading formats')
    expect(wrapper.find('button[title="Retry fetching formats"]').exists()).toBe(true)
  })

  it('refetches formats when retry is clicked', async () => {
    const wrapper = mountSelector({ isError: true })
    await wrapper.find('button[title="Retry fetching formats"]').trigger('click')
    expect(ConverterService.getSupportedFormats).toHaveBeenCalledOnce()
  })
})
