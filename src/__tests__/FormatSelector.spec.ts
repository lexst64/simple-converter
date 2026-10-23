import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
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

  it('renders one upper-cased option per format', () => {
    const wrapper = mountSelector()
    const options = wrapper.findAll('option')
    expect(options.map((o) => o.text())).toEqual(['MP3', 'PNG'])
    expect(options.map((o) => o.attributes('value'))).toEqual(['mp3', 'png'])
  })

  it('reflects and emits the targetFormat model', async () => {
    const wrapper = mountSelector({ targetFormat: 'png' })
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('png')

    await wrapper.find('select').setValue('mp3')
    expect(wrapper.emitted('update:targetFormat')).toEqual([['mp3']])
  })

  it('shows a loading placeholder instead of the select while loading', () => {
    const wrapper = mountSelector({ isLoading: true, isError: true })
    expect(wrapper.text()).toContain('Loading...')
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('shows a disabled error select and a retry button on error', () => {
    const wrapper = mountSelector({ isError: true })
    const select = wrapper.find('select')
    expect(select.attributes('disabled')).toBeDefined()
    expect(select.text()).toBe('Error loading formats')
    expect(wrapper.find('button[title="Retry fetching formats"]').exists()).toBe(true)
  })

  it('refetches formats when retry is clicked', async () => {
    const wrapper = mountSelector({ isError: true })
    await wrapper.find('button').trigger('click')
    expect(ConverterService.getSupportedFormats).toHaveBeenCalledOnce()
  })
})
