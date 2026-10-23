import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import FullScreenDropZone from '@/components/common/FullScreenDropZone.vue'
import { useFormatStore } from '@/stores/useFormatStore'
import { useToastStore } from '@/stores/useToastStore'
import { makeDragEvent, makeFile } from './component-helpers'

vi.mock('@/services/converter.service', () => ({
  ConverterService: { getSupportedFormats: vi.fn() },
}))

let pinia: Pinia
let wrapper: VueWrapper | undefined

const mountZone = (
  options: { props?: Record<string, unknown>; attrs?: Record<string, unknown> } = {},
) => {
  wrapper = mount(FullScreenDropZone, {
    props: options.props,
    attrs: options.attrs,
    slots: { default: '<p>content</p>' },
    global: { plugins: [pinia] },
  })
  return wrapper
}

const fire = async (...args: Parameters<typeof makeDragEvent>) => {
  const event = makeDragEvent(...args)
  window.dispatchEvent(event)
  await wrapper!.vm.$nextTick()
  return event
}

const overlayText = () => document.body.textContent ?? ''
const isOverlayShown = () => overlayText().includes('Drop files anywhere')

describe('FullScreenDropZone', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.body.innerHTML = ''
  })

  it('renders the default slot', () => {
    expect(mountZone().text()).toContain('content')
  })

  it('shows the overlay on a file dragenter and hides it on dragleave', async () => {
    const w = mountZone()
    expect(isOverlayShown()).toBe(false)

    const enter = await fire('dragenter')
    expect(enter.defaultPrevented).toBe(true)
    expect(isOverlayShown()).toBe(true)
    expect(w.emitted('drag-change')).toEqual([[true]])

    await fire('dragleave')
    expect(isOverlayShown()).toBe(false)
    expect(w.emitted('drag-change')).toEqual([[true], [false]])
  })

  it('keeps the overlay until every nested dragenter has a matching dragleave', async () => {
    const w = mountZone()
    await fire('dragenter')
    await fire('dragenter')
    await fire('dragleave')
    expect(isOverlayShown()).toBe(true)
    await fire('dragleave')
    expect(isOverlayShown()).toBe(false)
    expect(w.emitted('drag-change')).toEqual([[true], [false]])
  })

  it('ignores drags that do not carry files', async () => {
    const w = mountZone()
    const enter = await fire('dragenter', { types: ['text/plain'] })
    expect(enter.defaultPrevented).toBe(false)
    expect(isOverlayShown()).toBe(false)
    expect(w.emitted('drag-change')).toBeUndefined()
  })

  it('ignores everything when disabled', async () => {
    const w = mountZone({ props: { disabled: true } })
    await fire('dragenter')
    await fire('drop', { files: [makeFile('a.mp4')] })
    expect(isOverlayShown()).toBe(false)
    expect(w.emitted()).not.toHaveProperty('drag-change')
    expect(w.emitted()).not.toHaveProperty('files-dropped')
  })

  it('shows accepted formats, max size and single-file mode in the overlay', async () => {
    mountZone({
      props: { accept: '.mp4, .mp3', maxSize: 1024, multiple: false, customSubtitle: 'Sub' },
    })
    await fire('dragenter')
    expect(overlayText()).toContain('Formats: .mp4, .mp3')
    expect(overlayText()).toContain('Max size: 1.00 KB')
    expect(overlayText()).toContain('Single file mode')
    expect(overlayText()).toContain('Sub')
  })

  it('emits files-dropped with the dropped files and hides the overlay', async () => {
    const w = mountZone()
    const files = [makeFile('a.mp4'), makeFile('b.txt')]
    await fire('dragenter')
    const drop = await fire('drop', { files })

    expect(drop.defaultPrevented).toBe(true)
    expect(w.emitted('files-dropped')).toEqual([[files]])
    expect(w.emitted('drag-change')).toEqual([[true], [false]])
    expect(isOverlayShown()).toBe(false)
  })

  it('ignores a duplicate drop fired within 150ms', async () => {
    const w = mountZone()
    await fire('drop', { files: [makeFile('a.mp4')] })
    await fire('drop', { files: [makeFile('b.mp4')] })
    expect(w.emitted('files-dropped')).toHaveLength(1)
  })

  it('does not emit files-dropped for an empty drop', async () => {
    const w = mountZone()
    await fire('drop', { files: [] })
    expect(w.emitted('files-dropped')).toBeUndefined()
  })

  it('rejects files that do not match the accept rules and shows a toast', async () => {
    const w = mountZone({ props: { accept: ['.mp4', 'image/*', 'audio/mpeg', 'wav'] } })
    const ok = [
      makeFile('a.MP4'),
      makeFile('pic.bin', 1, 'image/png'),
      makeFile('song', 1, 'audio/mpeg'),
      makeFile('x.wav'),
    ]
    const bad = makeFile('notes.txt', 1, 'text/plain')

    await fire('drop', { files: [...ok, bad] })

    expect(w.emitted('files-dropped')).toEqual([[ok]])
    expect(w.emitted('invalid-files')).toEqual([
      [[{ file: bad, reason: 'File type not allowed (accepted: .mp4, image/*, audio/mpeg, wav)' }]],
    ])
    expect(useToastStore().toasts).toMatchObject([
      { type: 'error', title: '1 File(s) Rejected', message: 'notes.txt' },
    ])
  })

  it('falls back to the supported formats from the format store', async () => {
    useFormatStore().formats = { video: ['mp4'], audio: [], image: [] }
    const w = mountZone()
    const good = makeFile('a.mp4')
    const bad = makeFile('a.png')

    await fire('drop', { files: [good, bad] })

    expect(w.emitted('files-dropped')).toEqual([[[good]]])
    expect(w.emitted('invalid-files')![0]).toMatchObject([[{ file: bad }]])
  })

  it('rejects files larger than maxSize', async () => {
    const w = mountZone({ props: { maxSize: 1024 * 1024 } })
    const big = makeFile('big.mp4', 2 * 1024 * 1024)
    await fire('drop', { files: [big] })

    expect(w.emitted('files-dropped')).toBeUndefined()
    expect(w.emitted('invalid-files')).toEqual([
      [[{ file: big, reason: 'File size exceeds 1.0 MB limit' }]],
    ])
  })

  it('accepts only the first file when multiple is false', async () => {
    const w = mountZone({ props: { multiple: false } })
    const [a, b] = [makeFile('a.mp4'), makeFile('b.mp4')]
    await fire('drop', { files: [a, b] })

    expect(w.emitted('files-dropped')).toEqual([[[a]]])
    expect(w.emitted('invalid-files')).toEqual([
      [[{ file: b, reason: 'Multiple files not allowed' }]],
    ])
  })

  // New bug (not in .claude/ANALYSIS.md): the component only shows its own toast when the
  // parent has no `invalid-files` listener, checked via useAttrs(). But `invalid-files` is
  // declared in defineEmits, and Vue never puts listeners for declared emits into $attrs,
  // so the check is always false and the toast is shown even when the parent handles it.
  it.fails('does not show its own toast when the parent listens to invalid-files', async () => {
    const onInvalidFiles = vi.fn()
    mountZone({ props: { accept: '.mp4' }, attrs: { onInvalidFiles } })
    await fire('drop', { files: [makeFile('a.txt')] })

    expect(onInvalidFiles).toHaveBeenCalledOnce()
    expect(useToastStore().toasts).toEqual([])
  })

  it('stops listening to window events after unmount', async () => {
    const w = mountZone()
    w.unmount()
    window.dispatchEvent(makeDragEvent('dragenter'))
    expect(w.emitted('drag-change')).toBeUndefined()
    wrapper = undefined
  })
})
