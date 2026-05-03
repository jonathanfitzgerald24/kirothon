import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

export type GeminiModel = 'gemini-1.5-pro' | 'gemini-1.5-flash'

class GeminiClient {
  private client: GoogleGenerativeAI

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY environment variable is not set')
    this.client = new GoogleGenerativeAI(apiKey)
  }

  getModel(model: GeminiModel): GenerativeModel {
    return this.client.getGenerativeModel({ model })
  }

  async generateContent(model: GeminiModel, prompt: string): Promise<string> {
    const generativeModel = this.getModel(model)
    const result = await generativeModel.generateContent(prompt)
    const response = result.response
    return response.text()
  }
}

// Singleton instance
export const geminiClient = new GeminiClient()
