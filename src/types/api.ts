export interface FileUploadResponse {
  id: string;
  userId: string;
  type: 'upload' | 'output';
  originalName?: string;
  mimeType?: string;
  size: number;
  createdAt: Date;
}

export interface ConversionJobRequest {
  inputFileId: string
  outputFormat: string
}

export enum ConversionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface ConversionJob {
  _id: string
  userId: string
  inputFileId: string
  outputFormat: string
  status: ConversionStatus
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  errorMessage?: string
  outputFileId?: string
}

export interface ConversionStatusResponse {
  id: string
  status: ConversionStatus
  errorMessage?: string
  outputFileId?: string
  completedAt?: Date
}
