import axios from 'axios'
import config from '@/config'

export interface FeedbackPayload {
  email?: string
  message: string
  botcheck?: boolean
}

export interface Web3FormsResponse {
  success: boolean
  message?: string
}

export class FeedbackService {
  static async submitFeedback(payload: FeedbackPayload): Promise<Web3FormsResponse> {
    if (!config.web3formsAccessKey) {
      throw new Error('Web3Forms access key is not configured.')
    }

    const response = await axios.post<Web3FormsResponse>('https://api.web3forms.com/submit', {
      access_key: config.web3formsAccessKey,
      email: payload.email,
      message: payload.message,
      subject: 'New Feedback - Simple Converter',
      from_name: 'Simple Converter Web App',
      botcheck: payload.botcheck,
    })

    return response.data
  }
}
