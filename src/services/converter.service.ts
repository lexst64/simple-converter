import { api } from '@/main'
import type { ConversionJob, ConversionJobRequest, FileUploadResponse } from '@/types/api'

export class ConverterService {
  static async uploadFile(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    return (await api.post<FileUploadResponse>('/files', formData)).data.id
  }

  static async createConversionJob(uploadedFileId: string, outputFormat: string): Promise<ConversionJob> {
    return (
      await api.post<ConversionJob>('/conversions/job', {
        inputFileId: uploadedFileId,
        outputFormat,
      } satisfies ConversionJobRequest)
    ).data
  }
}
