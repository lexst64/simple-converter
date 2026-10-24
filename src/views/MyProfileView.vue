<script setup lang="ts">
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import { useAuth } from '@/composables/useAuth'
import { ref } from 'vue'

const { user, logout } = useAuth()

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
    <Avatar
      :image="user?.picture"
      shape="circle"
      class="w-30! h-30! shrink-0"
      aria-label="Profile picture"
    />
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-color">
        Hello, <span class="text-primary">{{ user?.name }}</span
        >!
      </h1>
      <div class="mt-2 text-muted-color flex flex-col gap-1 items-start">
        <p>
          Email: {{ hideEmail ? spoilerEmail(user?.email || '') : user?.email }}
          <Button
            variant="link"
            size="small"
            class="p-0!"
            :label="`[${hideEmail ? 'show' : 'hide'}]`"
            @click="toogleHideEmail"
          />
        </p>

        <Button
          label="Logout"
          icon="pi pi-sign-out"
          severity="secondary"
          outlined
          size="small"
          class="mt-2"
          @click="logout"
        />
      </div>
    </div>
  </div>
</template>
