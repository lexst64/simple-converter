<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import BaseButton from '@/components/common/BaseButton.vue'
import CheckCircleIcon from '@/components/icons/CheckCircleIcon.vue'
import SpinnerIcon from '@/components/icons/SpinnerIcon.vue'
import { FeedbackService } from '@/services/feedback.service'
import { useToastStore } from '@/stores/useToastStore'

const MAX_MESSAGE_LENGTH = 500
const MIN_SUBMISSION_TIME_MS = 1000

const email = ref('')
const message = ref('')
const botcheck = ref(false)
const honeypot = ref('')
const isSubmitting = ref(false)
const isSuccess = ref(false)
const formLoadedAt = ref(Date.now())

const toastStore = useToastStore()

let fakeSubmitTimerId: number | null = null

onMounted(() => {
  formLoadedAt.value = Date.now()
})

onUnmounted(() => {
  if (fakeSubmitTimerId) {
    clearTimeout(fakeSubmitTimerId)
  }
})

const handleSubmit = async () => {
  const trimmedMessage = message.value.trim()
  if (!trimmedMessage) {
    toastStore.warning('Please enter a feedback message.', 'Validation Error')
    return
  }

  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    toastStore.warning(
      `Feedback message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
      'Validation Error',
    )
    return
  }

  // Anti-bot check: Honeypot fields or instantaneous submission
  const isBot =
    botcheck.value ||
    honeypot.value.trim() !== '' ||
    Date.now() - formLoadedAt.value < MIN_SUBMISSION_TIME_MS

  if (isBot) {
    // Simulate a brief loading state for automated bots without sending to server
    isSubmitting.value = true
    fakeSubmitTimerId = setTimeout(() => {
      isSubmitting.value = false
      isSuccess.value = true
      message.value = ''
    }, 1000)
    return
  }

  isSubmitting.value = true

  try {
    const response = await FeedbackService.submitFeedback({
      email: email.value.trim() || undefined,
      message: trimmedMessage,
      botcheck: botcheck.value || !!honeypot.value,
    })

    if (response.success) {
      isSuccess.value = true
      message.value = ''
    } else {
      const errMsg = response.message || 'Failed to submit feedback. Please try again.'
      toastStore.error(errMsg, 'Submission Error')
    }
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'An error occurred while sending your feedback. Please try again later.'
    toastStore.error(errorMessage, 'Submission Error')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  isSuccess.value = false
  message.value = ''
  botcheck.value = false
  honeypot.value = ''
  formLoadedAt.value = Date.now()
}
</script>

<template>
  <div class="max-w-xl mx-auto py-4">
    <div
      class="bg-white dark:bg-slate-800/90 shadow-md rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700/80 transition-colors"
    >
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Send Us Feedback
        </h1>
        <p class="hidden md:block text-sm text-slate-600 dark:text-slate-400 mt-1">
          We'd love to hear your thoughts, suggestions, or bug reports.
        </p>
      </div>

      <div
        v-if="isSuccess"
        class="flex flex-col items-center justify-center p-6 text-center space-y-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50"
      >
        <CheckCircleIcon class="text-emerald-600 dark:text-emerald-400" />
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
            Thank you for your feedback!
          </h2>
          <p class="text-sm text-emerald-700 dark:text-emerald-400">
            Your message has been delivered. We appreciate your time and effort in helping us
            improve.
          </p>
        </div>
        <BaseButton secondary @click="resetForm"> Send another message </BaseButton>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Hidden Honeypot Fields for Bot Protection -->
        <input
          type="checkbox"
          name="botcheck"
          v-model="botcheck"
          class="hidden"
          style="display: none !important"
          tabindex="-1"
          autocomplete="off"
        />
        <input
          type="text"
          name="website"
          v-model="honeypot"
          class="hidden"
          style="display: none !important"
          tabindex="-1"
          autocomplete="off"
        />

        <div>
          <label
            for="email"
            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Email address <span class="text-xs text-slate-500 font-normal">(optional)</span>
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="your.email@example.com"
            class="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
          />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1.5">
            <label
              for="message"
              class="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Feedback message <span class="text-rose-500">*</span>
            </label>
            <span
              class="text-xs font-mono"
              :class="
                message.trim().length >= MAX_MESSAGE_LENGTH
                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              "
            >
              {{ message.trim().length }} / {{ MAX_MESSAGE_LENGTH }}
            </span>
          </div>
          <textarea
            id="message"
            v-model="message"
            rows="5"
            required
            placeholder="Share your thoughts, feature requests, or bugs... (Enter to send, Shift+Enter for new line)"
            class="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors resize-none md:resize-y min-h-30"
            @keydown.enter.exact.prevent="handleSubmit"
          ></textarea>
        </div>

        <div class="flex justify-end pt-2">
          <BaseButton
            type="submit"
            :disabled="
              isSubmitting || !message.trim() || message.trim().length > MAX_MESSAGE_LENGTH
            "
            class="w-full sm:w-auto"
          >
            <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
              <SpinnerIcon class="text-white" />
              Sending...
            </span>
            <span v-else>Submit</span>
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
