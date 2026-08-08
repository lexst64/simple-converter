<script setup lang="ts">
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'

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
      <div class="w-full flex items-center justify-between py-2.5 px-3 bg-[#f6fafe] rounded-md border border-blue-50">
        <BaseSkeleton width="70px" height="0.875rem" />
        <BaseSkeleton width="20px" height="0.875rem" />
      </div>

      <!-- History Entity Item Skeletons -->
      <div class="flex flex-col items-center w-full mt-2 gap-2">
        <div
          v-for="n in count"
          :key="n"
          class="flex flex-col w-full md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-[#f6fafe] px-4 py-3 md:w-200 md:gap-4 md:px-5"
        >
          <!-- Left info side -->
          <div class="min-w-0 flex-1 flex flex-col gap-2">
            <BaseSkeleton width="55%" height="1.125rem" />
            <BaseSkeleton width="35%" height="0.875rem" />
          </div>

          <!-- Divider for mobile -->
          <div class="md:hidden w-full h-px bg-gray-200"></div>

          <!-- Right badges & buttons side -->
          <div class="flex items-center gap-2 justify-end">
            <div class="flex shrink-0 items-center gap-2 text-sm">
              <BaseSkeleton width="45px" height="1.5rem" borderRadius="9999px" class="hidden md:block" />
              <BaseSkeleton width="16px" height="0.875rem" />
              <BaseSkeleton width="45px" height="1.5rem" borderRadius="9999px" />
            </div>
            <BaseSkeleton width="36px" height="36px" borderRadius="9999px" />
            <BaseSkeleton width="36px" height="36px" borderRadius="9999px" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
