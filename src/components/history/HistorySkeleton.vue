<script setup lang="ts">
import Skeleton from 'primevue/skeleton'

interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 3,
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 w-full" aria-busy="true" aria-label="Loading history items">
    <section class="flex w-full flex-col items-center gap-2">
      <!-- Category Header Skeleton -->
      <div class="w-full flex items-center justify-between py-4 px-4.5 border-b border-surface">
        <Skeleton width="70px" height="0.875rem" />
        <Skeleton width="20px" height="0.875rem" />
      </div>

      <!-- History Entity Item Skeletons -->
      <div
        class="flex flex-col w-full mt-2 border rounded-border overflow-hidden border-surface bg-surface-0 dark:bg-surface-800"
      >
        <div
          v-for="n in count"
          :key="n"
          class="w-full py-2 px-3 flex flex-col gap-3 md:flex-row md:justify-between md:items-center border-b border-surface"
        >
          <!-- Left info side -->
          <div class="min-w-0 flex-1 flex flex-col gap-2">
            <Skeleton width="55%" height="1.125rem" />
            <Skeleton width="35%" height="0.875rem" />
          </div>

          <!-- Divider for mobile -->
          <div class="md:hidden w-full h-px bg-surface-200 dark:bg-surface-700"></div>

          <!-- Right badges & buttons side -->
          <div class="flex items-center gap-3 justify-end">
            <div class="flex shrink-0 items-center gap-2 text-sm">
              <Skeleton width="45px" height="1.5rem" border-radius="9999px" class="hidden md:block" />
              <Skeleton width="16px" height="0.875rem" />
              <Skeleton width="45px" height="1.5rem" border-radius="9999px" />
            </div>
            <Skeleton shape="circle" size="2rem" />
            <Skeleton shape="circle" size="2rem" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
