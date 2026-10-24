<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
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
      axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : err instanceof Error
          ? err.message
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
    <Card class="p-2 md:p-4">
      <template #title>
        <div class="text-center">
          <h1 class="text-2xl font-bold tracking-tight">Send Us Feedback</h1>
          <p class="hidden md:block text-sm font-normal text-muted-color mt-1">
            We'd love to hear your thoughts, suggestions, or bug reports.
          </p>
        </div>
      </template>
      <template #content>
        <Message v-if="isSuccess" severity="success" class="mt-4">
          <div class="flex flex-col items-center justify-center p-4 text-center gap-4">
            <i class="pi pi-check-circle text-4xl!" aria-hidden="true" />
            <div class="space-y-1">
              <h2 class="text-lg font-semibold">Thank you for your feedback!</h2>
              <p class="text-sm font-normal">
                Your message has been delivered. We appreciate your time and effort in helping us
                improve.
              </p>
            </div>
            <Button label="Send another message" severity="success" outlined @click="resetForm" />
          </div>
        </Message>

        <form v-else @submit.prevent="handleSubmit" class="space-y-5 mt-4">
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

          <div class="flex flex-col gap-1.5">
            <label for="email" class="text-sm font-medium">
              Email address <span class="text-xs text-muted-color font-normal">(optional)</span>
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="email@example.com"
              fluid
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center">
              <label for="message" class="text-sm font-medium">
                Feedback message <span class="text-red-500">*</span>
              </label>
              <span
                class="text-xs font-mono"
                :class="
                  message.trim().length >= MAX_MESSAGE_LENGTH
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-muted-color'
                "
              >
                {{ message.trim().length }} / {{ MAX_MESSAGE_LENGTH }}
              </span>
            </div>
            <Textarea
              id="message"
              v-model="message"
              rows="5"
              required
              fluid
              placeholder="Share your thoughts, feature requests, or bugs... (Enter to send, Shift+Enter for new line)"
              class="resize-none md:resize-y min-h-30"
              @keydown.enter.exact.prevent="handleSubmit"
            />
          </div>

          <div class="flex justify-end pt-2">
            <Button
              type="submit"
              :label="isSubmitting ? 'Sending...' : 'Submit'"
              :loading="isSubmitting"
              :disabled="
                isSubmitting || !message.trim() || message.trim().length > MAX_MESSAGE_LENGTH
              "
              class="w-full sm:w-auto"
            />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>
