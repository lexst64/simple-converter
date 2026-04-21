<script setup lang="ts">
import { RouterView } from 'vue-router'
import TheHeader from './components/TheHeader.vue'
import TheFooter from './components/TheFooter.vue'
</script>

<template>
  <TheHeader />
  <div class="flex-1 w-full max-w-[1100px] mx-auto px-4 py-8">
    <RouterView />
  </div>
  <TheFooter />
</template>
