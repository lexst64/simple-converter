import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ConverterService } from '@/services/converter.service'
import { useToastStore } from '@/stores/useToastStore'
import type { SupportedFormats } from '@/types/api'

export const useFormatStore = defineStore(
  'formatStore',
  () => {
    const formats = ref<SupportedFormats>({
      video: [],
      image: [],
      audio: [],
    })
    const isLoading = ref<boolean>(false)
    const isError = ref<boolean>(false)
    const hasLoadedOnce = ref<boolean>(false)

    const toastStore = useToastStore()

    const allSupportedFormats = computed<string[]>(() => {
      const audio = formats.value.audio || []
      const video = formats.value.video || []
      const image = formats.value.image || []
      return [...audio, ...video, ...image]
    })

    async function fetchFormats() {
      isLoading.value = true
      isError.value = false

      try {
        const fetchedFormats = await ConverterService.getSupportedFormats()
        formats.value = fetchedFormats
        hasLoadedOnce.value = true
      } catch {
        isError.value = true
        toastStore.error('Failed to load supported formats.', 'Error')
      } finally {
        isLoading.value = false
      }
    }

    return {
      formats,
      isLoading,
      isError,
      hasLoadedOnce,
      allSupportedFormats,
      fetchFormats,
    }
  },
  {
    persist: {
      storage: sessionStorage,
      pick: ['formats', 'hasLoadedOnce'],
    },
  },
)
