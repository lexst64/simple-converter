export interface FileUploadResponse {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ConversionJobRequest {
  inputFileId: string;
  outputFormat: string;
}

export enum ConversionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface ConversionJob {
  id: string;
  userId: string;
  inputFileId: string;
  outputFormat: string;
  status: ConversionStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  outputFileId?: string;
}

export interface ConversionStatusResponse {
  id: string;
  status: ConversionStatus;
  errorMessage?: string;
  outputFileId?: string;
  completedAt?: Date;
}
