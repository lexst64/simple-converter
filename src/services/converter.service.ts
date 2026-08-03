import { api } from '@/main'
import type { Job, ConversionJobRequest, FileUploadResponse, UserFile } from '@/types/api'
import axios from 'axios'

export class ConverterService {
  static async uploadFile(file: File): Promise<string> {
    const res = await api.post<{ id: string; url: string }>('/files/upload-request', {
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    })

    const { id, url } = res.data

    await axios.put(url, file, { headers: { 'Content-Type': file.type } })

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

  static async downloadFile(fileId: string, desiredFilename: string): Promise<void> {
    const { data } = await api.get<{ url: string }>(`/files/${fileId}`)

    const s3Response = await axios.get(data.url, { responseType: 'blob' })
    const blob = new Blob([s3Response.data])

    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', desiredFilename)
    document.body.appendChild(link)

    link.click()

    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
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
