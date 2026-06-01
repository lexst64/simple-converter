<script setup lang="ts">
import InlineLink from '@/components/common/InlineLink.vue'
import { useAuth } from '@/composables/useAuth'
import router from '@/router'
import { useFileStore } from '@/stores/useFileStore'

const { user, logout } = useAuth()

const handleLogout = () => {
  logout()
  useFileStore().clearFiles()
  router.push('/')
}
</script>

<template>
  <h1 class="text-4xl font-bold tracking-tight text-slate-900">Hello, <span class="text-indigo-500">{{ user?.name }}</span>!</h1>
  <InlineLink @click="handleLogout">Logout</InlineLink>
</template>
