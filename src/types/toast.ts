export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastNotification {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}
