<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { useFormatStore } from '@/stores/useFormatStore'

const props = withDefaults(
  defineProps<{
    formats: string[]
    isLoading?: boolean
    isError?: boolean
  }>(),
  {
    isLoading: false,
    isError: false,
  },
)

const targetFormat = defineModel('targetFormat')
const formatStore = useFormatStore()

const options = computed(() =>
  props.formats.map((format) => ({ label: format.toUpperCase(), value: format })),
)

function handleRetry() {
  formatStore.fetchFormats()
}
</script>

<template>
  <Select
    v-if="isLoading"
    disabled
    loading
    size="small"
    placeholder="Loading..."
    class="min-w-28"
  />

  <div v-else-if="isError" class="inline-flex items-center gap-1.5">
    <Select disabled invalid size="small" placeholder="Error loading formats" />
    <Button
      type="button"
      icon="pi pi-refresh"
      severity="danger"
      text
      rounded
      size="small"
      title="Retry fetching formats"
      aria-label="Retry fetching formats"
      @click="handleRetry"
    />
  </div>

  <Select
    v-else
    v-model="targetFormat"
    :options="options"
    option-label="label"
    option-value="value"
    placeholder="Format"
    size="small"
    filter
    auto-filter-focus
    class="min-w-28"
  />
</template>
