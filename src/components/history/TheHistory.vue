<script setup lang="ts">
import { computed } from 'vue'
import HistoryEntity from '@/components/history/HistoryEntity.vue'

export interface HistoryItem {
  id: string
  fileName: string
  fileSize: number
  initialFormat: string
  targetFormat: string
  timestamp: string
}

type HistoryCategory = 'today' | 'yesterday' | 'this week' | 'this month' | 'earlier'

const items: HistoryItem[] = [
  {
    id: crypto.randomUUID(),
    fileName: 'music.mp3',
    fileSize: 1231213,
    initialFormat: 'MP3',
    targetFormat: 'AAC',
    timestamp: '2026-04-29T10:15:00.000Z',
  },
  {
    id: crypto.randomUUID(),
    fileName: 'music2.mp3',
    fileSize: 1231213,
    initialFormat: 'MP3',
    targetFormat: 'AAC',
    timestamp: '2026-04-28T16:30:00.000Z',
  },
  {
    id: crypto.randomUUID(),
    fileName: 'music3.mp3',
    fileSize: 1231213,
    initialFormat: 'MP3',
    targetFormat: 'AAC',
    timestamp: '2026-04-27T09:45:00.000Z',
  },
  {
    id: crypto.randomUUID(),
    fileName: 'music3.mp3',
    fileSize: 1231213,
    initialFormat: 'MP3',
    targetFormat: 'AAC',
    timestamp: '2026-04-27T09:45:00.000Z',
  },
  {
    id: crypto.randomUUID(),
    fileName: 'music4.mp3',
    fileSize: 1231213,
    initialFormat: 'MP3',
    targetFormat: 'AAC',
    timestamp: '2026-04-10T11:20:00.000Z',
  },
  {
    id: crypto.randomUUID(),
    fileName: 'music5.mp3',
    fileSize: 1231213,
    initialFormat: 'MP3',
    targetFormat: 'AAC',
    timestamp: '2026-03-12T08:05:00.000Z',
  },
]

const categories: HistoryCategory[] = ['today', 'yesterday', 'this week', 'this month', 'earlier']

const groupedItems = computed(() => {
  const buckets = new Map<HistoryCategory, HistoryItem[]>(
    categories.map((category) => [category, []]),
  )

  for (const item of items) {
    buckets.get(getHistoryCategory(item.timestamp))?.push(item)
  }

  return categories
    .map((category) => ({
      category,
      items: buckets.get(category) ?? [],
    }))
    .filter((section) => section.items.length > 0)
})

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
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <section
      v-for="section in groupedItems"
      :key="section.category"
      class="flex w-full flex-col items-center gap-2"
    >
      <p class="w-full md:w-200 text-sm font-medium uppercase tracking-wide text-gray-500">
        {{ section.category }}
      </p>
      <HistoryEntity v-for="item in section.items" :key="item.id" :item="item" />
    </section>
  </div>
</template>
