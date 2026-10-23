<script setup lang="ts">
import { watch } from 'vue'
import { RouterView } from 'vue-router'
import TheHeader from '@/components/TheHeader.vue'
import TheFooter from '@/components/TheFooter.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { useFormatStore } from '@/stores/useFormatStore'
import { useAuth } from '@/composables/useAuth'

const { isAuthenticated } = useAuth()
const formatStore = useFormatStore()

// formats need an authenticated request, so wait for sign-in instead of fetching on /auth
watch(
  isAuthenticated,
  (authenticated) => {
    if (authenticated) formatStore.fetchFormats()
  },
  { immediate: true },
)
</script>

<template>
  <TheHeader />
  <ToastContainer />
  <main class="flex-1 w-full max-w-275 mx-auto px-4 py-8">
    <RouterView />
  </main>
  <TheFooter />
</template>
