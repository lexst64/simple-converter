import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import FileUploader from '@/components/FileUploader.vue'
import { useFileStore } from '@/stores/useFileStore'
import { useToastStore } from '@/stores/useToastStore'
import { MAX_FILE_SIZE } from '@/utils'
import { makeFile } from './component-helpers'

const push = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

let pinia: Pinia

const mountUploader = () => mount(FileUploader, { global: { plugins: [pinia] } })

const pick = async (wrapper: ReturnType<typeof mountUploader>, files: File[]) => {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
  return input.element as HTMLInputElement
}

describe('FileUploader', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    push.mockClear()
  })

  it('shows the size limit derived from MAX_FILE_SIZE', () => {
    expect(mountUploader().text()).toContain('(up to 1.0 GB per file)')
  })

  it('replaces the file list with the picked files and opens the converter', async () => {
    const store = useFileStore()
    store.addFiles([makeFile('old.mp4')])
    const files = [makeFile('a.mp4', 10), makeFile('b.mp4', MAX_FILE_SIZE)]

    await pick(mountUploader(), files)

    expect(store.files.map((f) => f.file)).toEqual(files)
    expect(push).toHaveBeenCalledExactlyOnceWith('/converter')
    expect(useToastStore().toasts).toEqual([])
  })

  it('skips oversized files, adds the rest and reports the rejected ones', async () => {
    const store = useFileStore()
    const ok = makeFile('ok.mp4', 10)

    const input = await pick(mountUploader(), [makeFile('huge.mp4', MAX_FILE_SIZE + 1), ok])

    expect(store.files.map((f) => f.file)).toEqual([ok])
    expect(push).toHaveBeenCalledExactlyOnceWith('/converter')
    expect(useToastStore().toasts).toMatchObject([
      { type: 'error', title: '1 File(s) Rejected', message: 'huge.mp4' },
    ])
    expect(input.value).toBe('')
  })

  it('keeps the current files and stays put when every picked file is oversized', async () => {
    const store = useFileStore()
    store.addFiles([makeFile('old.mp4')])
    const before = [...store.files]

    const input = await pick(mountUploader(), [
      makeFile('huge.mp4', MAX_FILE_SIZE + 1),
      makeFile('huger.mp4', MAX_FILE_SIZE * 2),
    ])

    expect(store.files).toEqual(before)
    expect(push).not.toHaveBeenCalled()
    expect(useToastStore().toasts).toMatchObject([
      { type: 'error', title: '2 File(s) Rejected', message: 'huge.mp4, huger.mp4' },
    ])
    expect(input.value).toBe('')
  })

  it('does nothing when the picker is cancelled', async () => {
    const store = useFileStore()
    store.addFiles([makeFile('old.mp4')])

    await pick(mountUploader(), [])

    expect(store.files).toHaveLength(1)
    expect(push).not.toHaveBeenCalled()
    expect(useToastStore().toasts).toEqual([])
  })
})
