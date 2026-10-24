import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import TheHome from '@/components/TheHome.vue'
import { useFileStore } from '@/stores/useFileStore'
import { useFormatStore } from '@/stores/useFormatStore'
import { useToastStore } from '@/stores/useToastStore'
import { MAX_FILE_SIZE } from '@/utils'
import { makeDragEvent, makeFile } from './component-helpers'

const push = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@/services/converter.service', () => ({
  ConverterService: { getSupportedFormats: vi.fn() },
}))

let pinia: Pinia
let wrapper: VueWrapper | undefined

const drop = async (files: File[]) => {
  window.dispatchEvent(makeDragEvent('drop', { files }))
  await wrapper!.vm.$nextTick()
}

describe('TheHome', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    push.mockClear()
    useFormatStore().formats = { video: ['mp4'], audio: [], image: [] }
    wrapper = mount(TheHome, { global: { plugins: [pinia] } })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.body.innerHTML = ''
  })

  it('replaces the file list with dropped files and opens the converter', async () => {
    const store = useFileStore()
    store.addFiles([makeFile('old.mp4')])
    const big = makeFile('big.mp4', MAX_FILE_SIZE + 1)
    const ok = makeFile('ok.mp4', 10)

    await drop([big, ok])

    expect(store.files.map((f) => f.file)).toEqual([ok])
    expect(push).toHaveBeenCalledExactlyOnceWith('/converter')
    expect(useToastStore().toasts).toMatchObject([
      { type: 'error', title: '1 File(s) Rejected', message: 'big.mp4' },
    ])
  })

  it('keeps the current files and stays put when every dropped file is oversized', async () => {
    const store = useFileStore()
    store.addFiles([makeFile('old.mp4')])
    const before = [...store.files]

    await drop([makeFile('big.mp4', MAX_FILE_SIZE + 1)])

    expect(store.files).toEqual(before)
    expect(push).not.toHaveBeenCalled()
    expect(useToastStore().toasts).toMatchObject([
      { type: 'error', title: '1 File(s) Rejected', message: 'big.mp4' },
    ])
  })
})
