export function formatBytes(bytes: number, decimals = 2): string {
  if (!Number.isFinite(bytes)) {
    return '0 B'
  }

  const absoluteBytes = Math.abs(Math.trunc(bytes))
  if (absoluteBytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const unitIndex = Math.min(Math.floor(Math.log(absoluteBytes) / Math.log(1024)), units.length - 1)
  const value = absoluteBytes / 1024 ** unitIndex
  const digits = Math.max(0, decimals)

  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

export function getExtFromFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.')
  const ext = dotIndex > 0 ? fileName.slice(dotIndex + 1) : ''
  return ext
}

export const MAX_FILE_SIZE = 1024 ** 3

export interface RejectedFile {
  file: File
  reason: string
}

export function fileSizeLimitReason(maxSize: number) {
  return `File size exceeds ${formatBytes(maxSize, 1)} limit`
}

// a falsy maxSize disables the check, matching the drop zone's maxSize prop
export function splitBySize(
  files: File[],
  maxSize = MAX_FILE_SIZE,
): { valid: File[]; rejected: RejectedFile[] } {
  const valid: File[] = []
  const rejected: RejectedFile[] = []
  for (const file of files) {
    if (maxSize && file.size > maxSize) {
      rejected.push({ file, reason: fileSizeLimitReason(maxSize) })
    } else {
      valid.push(file)
    }
  }
  return { valid, rejected }
}
