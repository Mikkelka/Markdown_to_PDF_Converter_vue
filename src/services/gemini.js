import { GoogleGenerativeAI } from '@google/generative-ai'

const PROMPTS = {
  IMPROVE_WRITING: `Forbedre følgende tekst ved at:
- Rette grammatiske fejl
- Forbedre klarhed og læsbarhed
- Bevare den originale betydning og tone
- Returnere kun den forbedrede tekst uden forklaringer

Tekst: `,
  
  SUMMARIZE: (length) => `Lav et ${length} resumé af følgende tekst på dansk. Bevar de vigtigste pointer:

`,

  OUTLINE: `Lav en struktureret outline baseret på følgende tekst. Brug markdown format med headers (# ## ###) og bullet points:

`,

  TO_MARKDOWN: `Konverter følgende tekst til proper markdown format. Tilføj passende headers, formateringer og struktur:

`,

  SUGGESTIONS: `Giv 3-5 konkrete forslag til forbedring af følgende tekst på dansk. Format som en liste:

`
}

class GeminiService {
  constructor() {
    this.genAI = null
    this.model = null
  }

  initialize(apiKey, modelName = 'gemini-2.5-flash') {
    if (!apiKey) {
      throw new Error('Gemini API key is required')
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: modelName })
  }

  isInitialized() {
    return this.genAI !== null && this.model !== null
  }

  _ensureInitialized() {
    if (!this.isInitialized()) {
      throw new Error('Gemini service not initialized. Please provide an API key.')
    }
  }

  _buildRequestConfig(prompt, options = {}) {
    const requestConfig = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }

    const budget = options.thinkingBudget
    if (budget !== undefined && budget !== null && budget !== 0) {
      requestConfig.generationConfig = {
        thinkingConfig: {
          thinkingBudget: budget === -1 ? null : budget
        }
      }
    }

    return requestConfig
  }

  async improveWriting(text, options = {}) {
    this._ensureInitialized()
    const prompt = PROMPTS.IMPROVE_WRITING + text
    const requestConfig = this._buildRequestConfig(prompt, options)
    return await this.model.generateContentStream(requestConfig)
  }

  async summarizeContent(text, options = {}) {
    this._ensureInitialized()
    const length = options.length || 'kort'
    const prompt = PROMPTS.SUMMARIZE(length) + text
    const requestConfig = this._buildRequestConfig(prompt, options)
    return await this.model.generateContentStream(requestConfig)
  }

  async generateOutline(text, options = {}) {
    this._ensureInitialized()
    const prompt = PROMPTS.OUTLINE + text
    const requestConfig = this._buildRequestConfig(prompt, options)
    return await this.model.generateContentStream(requestConfig)
  }

  async convertToMarkdown(text, options = {}) {
    this._ensureInitialized()
    const prompt = PROMPTS.TO_MARKDOWN + text
    const requestConfig = this._buildRequestConfig(prompt, options)
    return await this.model.generateContentStream(requestConfig)
  }

  async getWritingSuggestions(text, options = {}) {
    this._ensureInitialized()
    const prompt = PROMPTS.SUGGESTIONS + text
    const requestConfig = this._buildRequestConfig(prompt, options)
    return await this.model.generateContentStream(requestConfig)
  }

  async validateApiKey(apiKey) {
    try {
      const tempGenAI = new GoogleGenerativeAI(apiKey)
      const tempModel = tempGenAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      
      await tempModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Test' }] }]
      })
      
      return { valid: true, error: null }
    } catch (error) {
      return { 
        valid: false, 
        error: error.message || 'Invalid API key' 
      }
    }
  }
}

export default new GeminiService()