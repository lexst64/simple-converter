<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import TheHeader from '@/components/TheHeader.vue'
import TheFooter from '@/components/TheFooter.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { useFormatStore } from '@/stores/useFormatStore'

onMounted(() => {
  useFormatStore().fetchFormats()
})
</script>

<template>
  <TheHeader />
  <ToastContainer />
  <main class="flex-1 w-full max-w-[1100px] mx-auto px-4 py-8">
    <RouterView />
  </main>
  <TheFooter />
</template>
