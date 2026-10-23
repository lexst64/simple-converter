import { vi } from 'vitest'
import type { FileHolder } from '@/stores/useFileStore'

export const makeFile = (name: string, size?: number, type = '') => {
  const file = new File(['x'], name, { type })
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
  return file
}

export const makeHolder = (overrides: Partial<FileHolder> = {}): FileHolder => ({
  id: 'file-1',
  file: makeFile('video.mp4', 2048),
  status: 'pending',
  selected: false,
  progress: 0,
  ...overrides,
})

/** Builds a drag event with a fake `dataTransfer`; jsdom has no DragEvent/DataTransfer. */
export const makeDragEvent = (
  type: 'dragenter' | 'dragover' | 'dragleave' | 'drop',
  { files = [] as File[], types = ['Files'] } = {},
) => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: { types, files, dropEffect: 'none' },
  })
  return event
}

/** Minimal stand-in for the browser WebSocket used by FileConverter. */
export class FakeWebSocket {
  static instances: FakeWebSocket[] = []

  url: string
  protocols?: string | string[]
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null
  close = vi.fn()

  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
    FakeWebSocket.instances.push(this)
  }

  /** Simulates a status message from the server. */
  send(data: { status: string; progress: number }) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }

  /** Simulates the connection failing. */
  fail() {
    this.onerror?.(new Event('error'))
  }

  /** Simulates the server closing the connection. */
  serverClose(code = 1000) {
    this.onclose?.({ code })
  }
}
