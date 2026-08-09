<script setup lang="ts">
import InlineLink from '@/components/common/InlineLink.vue'
import { useAuth } from '@/composables/useAuth'
import router from '@/router'
import { useFileStore } from '@/stores/useFileStore'
import { ref } from 'vue'

const { user, logout } = useAuth()

const handleLogout = () => {
  logout()
  useFileStore().clearFiles()
  router.push('/')
}

const spoilerEmail = (email: string) => {
  const [name, domain] = email.split('@')
  if (!domain || !name) return 'Invalid email format'

  const maskedName = name[0] + '*'.repeat(6)
  return `${maskedName}@${domain}`
}

const hideEmail = ref(true)
const toogleHideEmail = () => {
  hideEmail.value = !hideEmail.value
}
</script>

<template>
  <div class="flex gap-5">
    <img class="w-30 h-30 rounded-full" :src="user?.picture" alt="Profile picture" />
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Hello, <span class="text-indigo-600 dark:text-indigo-400">{{ user?.name }}</span
        >!
      </h1>
      <div class="mt-2 text-slate-700 dark:text-slate-300 flex flex-col gap-1 items-start">
        <p>
          Email: {{ hideEmail ? spoilerEmail(user?.email || '') : user?.email }}
          <InlineLink @click="toogleHideEmail">[{{ hideEmail ? 'show' : 'hide' }}]</InlineLink>
        </p>

        <InlineLink @click="handleLogout">Logout</InlineLink>
      </div>
    </div>
  </div>
</template>
