import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFileStore, type FileHolder } from '@/stores/useFileStore'

const makeFile = (name: string) => new File(['content'], name, { type: 'text/plain' })

type Store = ReturnType<typeof useFileStore>

interface SetterCase {
  name: string
  field: keyof FileHolder
  value: unknown
  apply: (store: Store, id: string) => void
}

const setterCases: SetterCase[] = [
  {
    name: 'setTargetFormat',
    field: 'targetFormat',
    value: 'mp3',
    apply: (s, id) => s.setTargetFormat(id, 'mp3'),
  },
  {
    name: 'setStatus',
    field: 'status',
    value: 'processing',
    apply: (s, id) => s.setStatus(id, 'processing'),
  },
  {
    name: 'setSelected',
    field: 'selected',
    value: true,
    apply: (s, id) => s.setSelected(id, true),
  },
  {
    name: 'setOutputFileId',
    field: 'outputFileId',
    value: 'out-1',
    apply: (s, id) => s.setOutputFileId(id, 'out-1'),
  },
  {
    name: 'setUploadFileId',
    field: 'uploadFileId',
    value: 'up-1',
    apply: (s, id) => s.setUploadFileId(id, 'up-1'),
  },
  {
    name: 'setProgress',
    field: 'progress',
    value: 42,
    apply: (s, id) => s.setProgress(id, 42),
  },
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

  describe.each(setterCases)('$name', ({ field, value, apply }) => {
    it(`updates ${field} on the matching file only`, () => {
      const store = useFileStore()
      store.addFiles([makeFile('a.txt'), makeFile('b.txt')])
      const first = store.files[0]!
      const secondBefore = { ...store.files[1]! }

      apply(store, first.id)

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

      apply(store, original.id)

      expect(store.files[0]).not.toBe(original)
      expect(original[field]).toBe(originalValue)
    })

    it('is a no-op when the id is unknown', () => {
      const store = useFileStore()
      store.addFiles([makeFile('a.txt')])
      const snapshot = store.files.map((f) => ({ ...f }))
      const originalRef = store.files[0]

      apply(store, 'does-not-exist')

      expect(store.files).toEqual(snapshot)
      expect(store.files[0]).toBe(originalRef)
    })
  })
})
