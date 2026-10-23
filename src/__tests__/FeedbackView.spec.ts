import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import FeedbackView from '@/views/FeedbackView.vue'
import { FeedbackService } from '@/services/feedback.service'
import { useToastStore } from '@/stores/useToastStore'

vi.mock('@/services/feedback.service', () => ({
  FeedbackService: { submitFeedback: vi.fn() },
}))

const submitFeedback = vi.mocked(FeedbackService.submitFeedback)

let pinia: Pinia

const mountView = () => mount(FeedbackView, { global: { plugins: [pinia] } })
type Wrapper = ReturnType<typeof mountView>

const submitButton = (w: Wrapper) => w.find('button[type="submit"]')
const toasts = () => useToastStore().toasts

/** Lets the anti-bot "too fast" window (1s) pass. */
const waitLikeAHuman = () => vi.setSystemTime(Date.now() + 2000)

const fillAndSubmit = async (w: Wrapper, message: string, email = '') => {
  await w.find('#email').setValue(email)
  await w.find('#message').setValue(message)
  waitLikeAHuman()
  await w.find('form').trigger('submit')
  await flushPromises()
}

describe('FeedbackView', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-21T12:00:00Z'))
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    submitFeedback.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('validation', () => {
    it('disables submit until a non-blank message is entered', async () => {
      const wrapper = mountView()
      expect(submitButton(wrapper).attributes('disabled')).toBeDefined()

      await wrapper.find('#message').setValue('   ')
      expect(submitButton(wrapper).attributes('disabled')).toBeDefined()

      await wrapper.find('#message').setValue('Great app')
      expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
    })

    it('shows the trimmed character count and highlights it at the limit', async () => {
      const wrapper = mountView()
      await wrapper.find('#message').setValue('  hello  ')
      expect(wrapper.text()).toContain('5 / 500')

      await wrapper.find('#message').setValue('a'.repeat(500))
      expect(wrapper.find('span.font-mono').classes()).toContain('font-bold')
      expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
    })

    it('disables submit and warns when the message is over 500 characters', async () => {
      const wrapper = mountView()
      await wrapper.find('#message').setValue('a'.repeat(501))
      expect(submitButton(wrapper).attributes('disabled')).toBeDefined()

      waitLikeAHuman()
      await wrapper.find('#message').trigger('keydown', { key: 'Enter' })

      expect(submitFeedback).not.toHaveBeenCalled()
      expect(toasts()).toMatchObject([
        {
          type: 'warning',
          title: 'Validation Error',
          message: 'Feedback message cannot exceed 500 characters.',
        },
      ])
    })

    it('warns about an empty message when submitted with Enter', async () => {
      const wrapper = mountView()
      await wrapper.find('#message').setValue('  ')
      await wrapper.find('#message').trigger('keydown', { key: 'Enter' })

      expect(submitFeedback).not.toHaveBeenCalled()
      expect(toasts()).toMatchObject([
        { type: 'warning', message: 'Please enter a feedback message.' },
      ])
    })
  })

  it('submits with Enter but not with Shift+Enter', async () => {
    const wrapper = mountView()
    await wrapper.find('#message').setValue('hi')
    waitLikeAHuman()

    await wrapper.find('#message').trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(submitFeedback).not.toHaveBeenCalled()

    await wrapper.find('#message').trigger('keydown', { key: 'Enter' })
    expect(submitFeedback).toHaveBeenCalledOnce()
  })

  it('sends the trimmed message and email and shows the success state', async () => {
    const wrapper = mountView()
    await fillAndSubmit(wrapper, '  Love it  ', ' me@example.com ')

    expect(submitFeedback).toHaveBeenCalledExactlyOnceWith({
      email: 'me@example.com',
      message: 'Love it',
      botcheck: false,
    })
    expect(wrapper.text()).toContain('Thank you for your feedback!')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('sends no email when the email field is blank', async () => {
    const wrapper = mountView()
    await fillAndSubmit(wrapper, 'Hello', '   ')
    expect(submitFeedback.mock.calls[0]![0].email).toBeUndefined()
  })

  it('shows "Sending..." and disables submit while the request is in flight', async () => {
    let resolve!: (v: { success: boolean }) => void
    submitFeedback.mockReturnValue(new Promise((r) => (resolve = r)))
    const wrapper = mountView()
    await wrapper.find('#message').setValue('Hello')
    waitLikeAHuman()
    await wrapper.find('form').trigger('submit')

    expect(submitButton(wrapper).text()).toBe('Sending...')
    expect(submitButton(wrapper).attributes('disabled')).toBeDefined()

    resolve({ success: true })
    await flushPromises()
    expect(wrapper.text()).toContain('Thank you for your feedback!')
  })

  it('"Send another message" returns to an empty form', async () => {
    const wrapper = mountView()
    await fillAndSubmit(wrapper, 'Hello')

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Send another message')!
      .trigger('click')

    expect(wrapper.find('form').exists()).toBe(true)
    expect((wrapper.find('#message').element as HTMLTextAreaElement).value).toBe('')
  })

  describe('bot protection', () => {
    const fakeSubmit = async (wrapper: Wrapper) => {
      await wrapper.find('form').trigger('submit')
      expect(submitButton(wrapper).text()).toBe('Sending...')
      vi.advanceTimersByTime(1000)
      await flushPromises()
      expect(submitFeedback).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Thank you for your feedback!')
    }

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-10-21T12:00:00Z'))
    })

    it('fakes success without calling the service when the honeypot is filled', async () => {
      const wrapper = mountView()
      await wrapper.find('#message').setValue('spam')
      await wrapper.find('input[name="website"]').setValue('http://spam.example')
      waitLikeAHuman()
      await fakeSubmit(wrapper)
    })

    it('fakes success without calling the service when the botcheck box is ticked', async () => {
      const wrapper = mountView()
      await wrapper.find('#message').setValue('spam')
      await wrapper.find('input[name="botcheck"]').setValue(true)
      waitLikeAHuman()
      await fakeSubmit(wrapper)
    })

    it('fakes success without calling the service when submitted within 1s of loading', async () => {
      const wrapper = mountView()
      await wrapper.find('#message').setValue('too fast')
      await fakeSubmit(wrapper)
    })
  })

  describe('errors', () => {
    it('shows the server message when the response is not successful', async () => {
      submitFeedback.mockResolvedValue({ success: false, message: 'Quota exceeded' })
      const wrapper = mountView()
      await fillAndSubmit(wrapper, 'Hello')

      expect(wrapper.find('form').exists()).toBe(true)
      expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
      expect(toasts()).toMatchObject([
        { type: 'error', title: 'Submission Error', message: 'Quota exceeded' },
      ])
    })

    it('shows a default message when an unsuccessful response has none', async () => {
      submitFeedback.mockResolvedValue({ success: false })
      const wrapper = mountView()
      await fillAndSubmit(wrapper, 'Hello')

      expect(toasts()).toMatchObject([
        { type: 'error', message: 'Failed to submit feedback. Please try again.' },
      ])
    })

    it('shows the error message when the service throws', async () => {
      submitFeedback.mockRejectedValue(new Error('Web3Forms access key is not configured.'))
      const wrapper = mountView()
      await fillAndSubmit(wrapper, 'Hello')

      expect(toasts()).toMatchObject([
        { type: 'error', message: 'Web3Forms access key is not configured.' },
      ])
      expect((wrapper.find('#message').element as HTMLTextAreaElement).value).toBe('Hello')
    })

    it('shows a generic message when something other than an Error is thrown', async () => {
      submitFeedback.mockRejectedValue('boom')
      const wrapper = mountView()
      await fillAndSubmit(wrapper, 'Hello')

      expect(toasts()).toMatchObject([
        {
          type: 'error',
          message: 'An error occurred while sending your feedback. Please try again later.',
        },
      ])
    })

    it('shows the backend message from an axios error response', async () => {
      const response = {
        data: { message: 'Message rejected by backend' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new AxiosHeaders() },
      } as AxiosResponse
      submitFeedback.mockRejectedValue(
        new AxiosError(
          'Request failed with status code 400',
          'ERR_BAD_REQUEST',
          undefined,
          undefined,
          response,
        ),
      )
      const wrapper = mountView()
      await fillAndSubmit(wrapper, 'Hello')

      expect(toasts()).toMatchObject([{ type: 'error', message: 'Message rejected by backend' }])
    })
  })
})
