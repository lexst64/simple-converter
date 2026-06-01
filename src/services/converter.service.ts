import { api } from '@/main'
import type { ConversionJob, ConversionJobRequest, FileUploadResponse } from '@/types/api'

export class ConverterService {
  static async uploadFile(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    return (await api.post<FileUploadResponse>('/files', formData)).data.id
  }

  static async createConversionJob(
    uploadedFileId: string,
    outputFormat: string,
  ): Promise<ConversionJob> {
    return (
      await api.post<ConversionJob>('/conversions/job', {
        inputFileId: uploadedFileId,
        outputFormat,
      } satisfies ConversionJobRequest)
    ).data
  }

  static async downloadFile(fileId: string, desiredFilename: string): Promise<void> {
    const response = await api.get(`/files/${fileId}`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', desiredFilename)
    document.body.appendChild(link)

    link.click()

    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  static async getJobDetails(jobId: string): Promise<ConversionJob> {
    return (await api.get<ConversionJob>(`/conversions/job/${jobId}`)).data
  }
}
