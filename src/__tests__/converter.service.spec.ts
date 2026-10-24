import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios, { type AxiosProgressEvent, type AxiosRequestConfig } from 'axios'
import { api } from '@/api/client'
import { ConverterService } from '@/services/converter.service'
import { makeFile } from './component-helpers'

vi.mock('axios', () => ({
  default: { put: vi.fn() },
}))

vi.mock('@/api/client', () => ({ api: { post: vi.fn() } }))

const put = vi.mocked(axios.put)
const post = vi.mocked(api.post)

describe('ConverterService.uploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    post.mockResolvedValue({ data: { id: 'up-1', url: 'https://bucket.test/put' } })
    put.mockResolvedValue({})
  })

  it('requests a presigned URL, puts the file to it and returns the upload id', async () => {
    const file = makeFile('a.mp4', 1000, 'video/mp4')

    await expect(ConverterService.uploadFile(file)).resolves.toBe('up-1')

    expect(post).toHaveBeenCalledExactlyOnceWith(
      '/files/upload-request',
      { fileName: 'a.mp4', contentType: 'video/mp4', size: 1000 },
      { signal: undefined },
    )
    expect(put).toHaveBeenCalledExactlyOnceWith(
      'https://bucket.test/put',
      file,
      expect.objectContaining({ headers: { 'Content-Type': 'video/mp4' } }),
    )
  })

  it('reports upload progress as a percentage', async () => {
    const onProgress = vi.fn()
    const file = makeFile('a.mp4', 1000)
    await ConverterService.uploadFile(file, { onProgress })

    const { onUploadProgress } = put.mock.calls[0]![2] as AxiosRequestConfig
    onUploadProgress!({ loaded: 250, total: 1000 } as AxiosProgressEvent)
    // falls back to the file size when the total is unknown
    onUploadProgress!({ loaded: 999 } as AxiosProgressEvent)

    expect(onProgress.mock.calls).toEqual([[25], [100]])
  })

  it('passes the abort signal to both requests', async () => {
    const { signal } = new AbortController()
    await ConverterService.uploadFile(makeFile('a.mp4'), { signal })

    expect(post.mock.calls[0]![2]).toEqual({ signal })
    expect(put.mock.calls[0]![2]).toMatchObject({ signal })
  })
})
