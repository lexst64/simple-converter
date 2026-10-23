import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import config from '@/config'
import { FeedbackService } from '@/services/feedback.service'
import pkg from '../../package.json'

vi.mock('axios', () => ({
  default: { post: vi.fn() },
}))

vi.mock('@/config', () => ({
  default: { web3formsAccessKey: 'test-key' },
}))

const post = vi.mocked(axios.post)

describe('FeedbackService.submitFeedback', () => {
  beforeEach(() => {
    post.mockReset()
    config.web3formsAccessKey = 'test-key'
  })

  it('posts the payload to Web3Forms and returns the response data', async () => {
    post.mockResolvedValue({ data: { success: true, message: 'ok' } })

    const result = await FeedbackService.submitFeedback({
      email: 'user@example.com',
      message: 'Great app',
      botcheck: false,
    })

    expect(result).toEqual({ success: true, message: 'ok' })
    expect(post).toHaveBeenCalledOnce()
    expect(post).toHaveBeenCalledWith('https://api.web3forms.com/submit', {
      access_key: 'test-key',
      email: 'user@example.com',
      message: 'Great app',
      subject: 'New Feedback - Simple Converter',
      from_name: 'Simple Converter Web App',
      version: pkg.version,
      botcheck: false,
    })
  })

  it('throws without calling the API when the access key is missing', async () => {
    config.web3formsAccessKey = ''

    await expect(FeedbackService.submitFeedback({ message: 'hi' })).rejects.toThrow(
      'Web3Forms access key is not configured.',
    )
    expect(post).not.toHaveBeenCalled()
  })

  it('propagates request errors', async () => {
    post.mockRejectedValue(new Error('network'))

    await expect(FeedbackService.submitFeedback({ message: 'hi' })).rejects.toThrow('network')
  })
})
