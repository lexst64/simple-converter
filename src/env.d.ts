/// <reference types="vite/client" />
/// <reference types="google.accounts" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_WEB3FORMS_ACCESS_KEY?: string
  readonly VITE_PRIMEUI_LICENSE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// PrimeVue's ToastService emits on this bus; the store uses it directly so toasts can be
// raised outside components. The package ships it without type declarations.
declare module 'primevue/toasteventbus' {
  const ToastEventBus: {
    emit(type: 'add' | 'remove', message: import('primevue/toast').ToastMessageOptions): void
    emit(type: 'remove-all-groups'): void
  }
  export default ToastEventBus
}
