<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import HistoryEntity from '@/components/history/HistoryEntity.vue'
import { ConverterService } from '@/services/converter.service'
import { JobStatus, type UserFile } from '@/types/api'

export interface HistoryItem {
  id: string
  fileName: string
  fileSize: number
  initialFormat: string
  targetFormat: string
  timestamp: string
  outputFileId: string
}

type HistoryCategory = 'today' | 'yesterday' | 'this week' | 'this month' | 'earlier'

const isLoading = ref(true)
const items = ref<HistoryItem[]>([])

const categories: HistoryCategory[] = ['today', 'yesterday', 'this week', 'this month', 'earlier']

const groupedItems = computed(() => {
  const buckets = new Map<HistoryCategory, HistoryItem[]>(
    categories.map((category) => [category, []]),
  )

  for (const item of items.value) {
    buckets.get(getHistoryCategory(item.timestamp))?.push(item)
  }

  return categories
    .map((category) => ({
      category,
      items: buckets.get(category) ?? [],
    }))
    .filter((section) => section.items.length > 0)
})

const openCategory = ref<HistoryCategory | null>(null)

function toggleCategory(category: HistoryCategory) {
  openCategory.value = category
}

watch(
  groupedItems,
  (sections) => {
    if (openCategory.value === null && sections.length > 0) {
      const first = sections[0]
      if (first) {
        openCategory.value = first.category
      }
    }
  },
  { immediate: true },
)

function getHistoryCategory(timestamp: string): HistoryCategory {
  const itemDate = new Date(timestamp)
  const now = new Date()

  if (isSameDay(itemDate, now)) {
    return 'today'
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (isSameDay(itemDate, yesterday)) {
    return 'yesterday'
  }

  const startOfWeek = getStartOfWeek(now)
  if (itemDate >= startOfWeek) {
    return 'this week'
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  if (itemDate >= startOfMonth) {
    return 'this month'
  }

  return 'earlier'
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day

  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)

  return start
}

onMounted(async () => {
  try {
    const jobs = (await ConverterService.getJobs()).filter((j) => j.status === JobStatus.COMPLETED)
    const outputFileDetails: (UserFile | undefined)[] = await Promise.all(
      jobs.map(async (j) => {
        if (!j.outputFileId) {
          return undefined
        }
        try {
          return await ConverterService.getFileDetails(j.outputFileId)
        } catch {
          return undefined
        }
      }),
    )
    items.value = jobs.map((j, i) => {
      return {
        id: j._id,
        fileName: outputFileDetails[i]?.originalFileName || '',
        fileSize: outputFileDetails[i]?.size || 0,
        initialFormat: j.inputFormat,
        targetFormat: j.outputFormat,
        timestamp: j.completedAt?.toString() || '',
        outputFileId: j.outputFileId || '',
      }
    })
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div v-if="isLoading" class="flex justify-center mt-12">Loading...</div>
  <div v-else-if="items.length === 0" class="flex justify-center mt-12">
    No previous convertions found
  </div>
  <div v-else class="flex flex-col items-center gap-4 w-full">
    <section
      v-for="section in groupedItems"
      :key="section.category"
      class="flex w-full flex-col items-center gap-2"
    >
      <button
        type="button"
        class="w-full flex items-center justify-between py-2 px-3 bg-[#f6fafe] rounded-md cursor-pointer"
        @click="toggleCategory(section.category)"
        :aria-expanded="openCategory === section.category"
      >
        <p class="text-sm font-medium uppercase tracking-wide text-gray-500">
          {{ section.category }}
        </p>
        <span class="text-sm text-gray-400">{{ section.items.length }}</span>
      </button>

      <div
        v-show="openCategory === section.category"
        class="flex flex-col items-center w-full mt-2 gap-2"
      >
        <HistoryEntity
          v-for="item in section.items"
          :key="item.id"
          :item="item"
          class="flex flex-col w-full"
        />
      </div>
    </section>
  </div>
</template>
