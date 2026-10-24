import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFileStore } from '@/stores/useFileStore'

const makeFile = (name: string) => new File(['content'], name, { type: 'text/plain' })

type Patch = Parameters<ReturnType<typeof useFileStore>['updateFile']>[1]

interface PatchCase {
  field: keyof Patch
  value: Patch[keyof Patch]
}

const patchCases: PatchCase[] = [
  { field: 'targetFormat', value: 'mp3' },
  { field: 'status', value: 'processing' },
  { field: 'selected', value: true },
  { field: 'outputFileId', value: 'out-1' },
  { field: 'uploadFileId', value: 'up-1' },
  { field: 'progress', value: 42 },
]

describe('useFileStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts empty', () => {
    expect(useFileStore().files).toEqual([])
  })

  it('addFiles wraps files in holders with defaults and unique ids', () => {
    const store = useFileStore()
    const a = makeFile('a.txt')
    const b = makeFile('b.txt')

    store.addFiles([a, b])

    expect(store.files).toHaveLength(2)
    expect(store.files[0]).toMatchObject({
      file: a,
      status: 'pending',
      selected: false,
      progress: 0,
    })
    expect(store.files[0]!.targetFormat).toBeUndefined()
    expect(store.files[1]!.file).toBe(b)
    expect(store.files[0]!.id).toEqual(expect.any(String))
    expect(store.files[0]!.id).not.toBe(store.files[1]!.id)
  })

  it('addFiles appends to existing files', () => {
    const store = useFileStore()
    store.addFiles([makeFile('a.txt')])
    store.addFiles([makeFile('b.txt'), makeFile('c.txt')])

    expect(store.files.map((f) => f.file.name)).toEqual(['a.txt', 'b.txt', 'c.txt'])
  })

  it('addFiles with an empty array is a no-op', () => {
    const store = useFileStore()
    store.addFiles([])
    expect(store.files).toEqual([])
  })

  it('removeFiles removes only the given ids', () => {
    const store = useFileStore()
    store.addFiles([makeFile('a.txt'), makeFile('b.txt'), makeFile('c.txt')])
    const [a, , c] = store.files

    store.removeFiles([a!.id, c!.id, 'unknown'])

    expect(store.files.map((f) => f.file.name)).toEqual(['b.txt'])
  })

  it('clearFiles empties the list', () => {
    const store = useFileStore()
    store.addFiles([makeFile('a.txt'), makeFile('b.txt')])

    store.clearFiles()

    expect(store.files).toEqual([])
  })

  describe('updateFile', () => {
    describe.each(patchCases)('patching $field', ({ field, value }) => {
      it(`updates ${field} on the matching file only`, () => {
        const store = useFileStore()
        store.addFiles([makeFile('a.txt'), makeFile('b.txt')])
        const first = store.files[0]!
        const secondBefore = { ...store.files[1]! }

        store.updateFile(first.id, { [field]: value })

        expect(store.files[0]![field]).toBe(value)
        expect(store.files[0]!.id).toBe(first.id)
        expect(store.files[0]!.file).toBe(first.file)
        expect(store.files[1]).toEqual(secondBefore)
      })

      it('replaces the holder object instead of mutating it', () => {
        const store = useFileStore()
        store.addFiles([makeFile('a.txt')])
        const original = store.files[0]!
        const originalValue = original[field]

        store.updateFile(original.id, { [field]: value })

        expect(store.files[0]).not.toBe(original)
        expect(original[field]).toBe(originalValue)
      })

      it('is a no-op when the id is unknown', () => {
        const store = useFileStore()
        store.addFiles([makeFile('a.txt')])
        const snapshot = store.files.map((f) => ({ ...f }))
        const originalRef = store.files[0]

        store.updateFile('does-not-exist', { [field]: value })

        expect(store.files).toEqual(snapshot)
        expect(store.files[0]).toBe(originalRef)
      })
    })

    it('applies several fields at once and leaves the rest intact', () => {
      const store = useFileStore()
      store.addFiles([makeFile('a.txt')])
      const original = { ...store.files[0]! }

      store.updateFile(original.id, { status: 'failed', selected: true, progress: 10 })

      expect(store.files[0]).toEqual({
        ...original,
        status: 'failed',
        selected: true,
        progress: 10,
      })
    })
  })
})
