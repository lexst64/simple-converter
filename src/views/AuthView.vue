<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { AuthService } from '@/services/auth.service'
import { config } from '@/config'
import { useToastStore } from '@/stores/useToastStore'

const googleBtn = ref<HTMLElement | null>(null)
const router = useRouter()
const { login } = useAuth()
const toastStore = useToastStore()

// Define the expected structure from Google's callback
interface CredentialResponse {
  credential: string
  clientId: string
  select_by: string
}

const handleCredentialResponse = async (response: CredentialResponse): Promise<void> => {
  try {
    const res = await AuthService.loginWithGoogle(response.credential)
    await login(res.token)
    router.push('/')
  } catch {
    toastStore.error('Error connecting to backend server.', 'Authentication Error')
  }
}

onMounted(() => {
  // @ts-expect-error - Bypassing TS error for the globally injected google object
  if (window.google) {
    // @ts-expect-error lol
    window.google.accounts.id.initialize({
      client_id: config.googleClientId,
      callback: handleCredentialResponse,
    })

    // @ts-expect-error lol
    window.google.accounts.id.renderButton(googleBtn.value!, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
    })
  } else {
    toastStore.error('Google Identity Services script failed to load.', 'Authentication Error')
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3">
    <h3 class="text-slate-800 dark:text-slate-200">Please, sign in to your Google account to use this app!</h3>
    <div ref="googleBtn"></div>
  </div>
</template>
