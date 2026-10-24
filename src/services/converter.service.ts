import { api } from '@/api/client'
import type { Job, ConversionJobRequest, UserFile, SupportedFormats } from '@/types/api'
import axios from 'axios'

export interface UploadOptions {
  /** Called with the upload percentage (0-100) as the file is sent. */
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

export class ConverterService {
  static async getSupportedFormats(): Promise<SupportedFormats> {
    return (await api.get<SupportedFormats>('/formats')).data
  }

  static async uploadFile(file: File, { onProgress, signal }: UploadOptions = {}): Promise<string> {
    const res = await api.post<{ id: string; url: string }>(
      '/files/upload-request',
      {
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      },
      { signal },
    )

    const { id, url } = res.data

    await axios.put(url, file, {
      headers: { 'Content-Type': file.type },
      signal,
      onUploadProgress: onProgress
        ? (event) => {
            const total = event.total || file.size
            onProgress(total ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0)
          }
        : undefined,
    })

    return id
  }

  static async createConversionJob(uploadedFileId: string, outputFormat: string): Promise<Job> {
    return (
      await api.post<Job>('/conversions/job', {
        inputFileId: uploadedFileId,
        outputFormat,
      } satisfies ConversionJobRequest)
    ).data
  }

  static async downloadFile(fileId: string): Promise<void> {
    const { data } = await api.get<{ url: string }>(`/files/${fileId}`)

    const link = document.createElement('a')
    link.href = data.url
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)

    link.click()

    link.remove()
  }

  static async getJob(jobId: string): Promise<Job> {
    return (await api.get<Job>(`/conversions/job/${jobId}`)).data
  }

  static async getJobs(): Promise<Job[]> {
    const res = await api.get(`/conversions/job`, { params: { limit: 50, offset: 0 } })
    return res.data.jobs as Job[]
  }

  static async getFileDetails(fileId: string): Promise<UserFile> {
    return (await api.get(`/files/${fileId}/details`)).data
  }

  static async deleteJob(jobId: string): Promise<void> {
    return (await api.delete(`/conversions/job/${jobId}`)).data
  }
}
