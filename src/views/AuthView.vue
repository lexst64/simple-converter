<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { AuthService } from '@/services/auth.service'
import { config } from '@/config'

const googleBtn = ref<HTMLElement | null>(null)
const router = useRouter()
const { login } = useAuth()

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
  } catch (error) {
    console.error('Error connecting to backend server:', error)
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
    console.error('Google Identity Services script failed to load.')
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3">
    <h3>Please, sign in to your Google account to use this app!</h3>
    <div ref="googleBtn"></div>
  </div>
</template>
