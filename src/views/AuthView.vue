<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { AuthService } from '@/services/auth.service'
import { config } from '@/config'
import { useToastStore } from '@/stores/useToastStore'

const googleBtn = ref<HTMLElement | null>(null)
const router = useRouter()
const { login } = useAuth()
const toastStore = useToastStore()

let timeoutId: ReturnType<typeof setTimeout> | null = null

const handleCredentialResponse = async (
  response: google.accounts.id.CredentialResponse,
): Promise<void> => {
  try {
    const res = await AuthService.loginWithGoogle(response.credential)
    await login(res.token)
    router.push('/')
  } catch {
    toastStore.error('Error connecting to backend server.', 'Authentication Error')
  }
}

const renderGoogleButton = () => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  if (window.google?.accounts?.id && googleBtn.value) {
    window.google.accounts.id.initialize({
      client_id: config.googleClientId,
      callback: handleCredentialResponse,
    })

    window.google.accounts.id.renderButton(googleBtn.value, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
    })
  } else {
    toastStore.error('Google Identity Services script failed to load.', 'Authentication Error')
  }
}

const handleSdkLoaded = () => {
  cleanupListeners()
  renderGoogleButton()
}

const handleSdkFailed = () => {
  cleanupListeners()
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  toastStore.error('Google Identity Services script failed to load.', 'Authentication Error')
}

const cleanupListeners = () => {
  window.removeEventListener('google-sdk-loaded', handleSdkLoaded)
  window.removeEventListener('google-sdk-error', handleSdkFailed)
}

onMounted(() => {
  if (window.google?.accounts?.id) {
    renderGoogleButton()
  } else {
    window.addEventListener('google-sdk-loaded', handleSdkLoaded)
    window.addEventListener('google-sdk-error', handleSdkFailed)

    timeoutId = setTimeout(() => {
      if (window.google?.accounts?.id) {
        renderGoogleButton()
      } else {
        handleSdkFailed()
      }
    }, 5000)
  }
})

onUnmounted(() => {
  cleanupListeners()
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3">
    <h3 class="text-slate-800 dark:text-slate-200">
      Please, sign in to your Google account to use this app!
    </h3>
    <div ref="googleBtn" style="color-scheme: light"></div>
  </div>
</template>
