export interface FileUploadResponse {
  id: string
  userId: string
  type: 'upload' | 'output'
  originalName?: string
  mimeType?: string
  size: number
  createdAt: Date
}

export interface ConversionJobRequest {
  inputFileId: string
  outputFormat: string
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Job {
  _id: string
  userId: string
  inputFileId: string
  outputFormat: string
  progress: number
  status: JobStatus
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  errorMessage?: string
  outputFileId?: string
}

export interface ConversionStatusResponse {
  id: string
  status: JobStatus
  errorMessage?: string
  outputFileId?: string
  completedAt?: Date
}
