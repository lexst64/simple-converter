<script setup lang="ts">
import InitialFileUploader from '@/components/InitialFileUploader.vue'
</script>

<template>
  <div class="flex flex-col items-center gap-[50px] md:mt-10">
    <h1 class="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-200">Image, Audio & Video Converter</h1>
    <InitialFileUploader class="w-90" />
  </div>
</template>
