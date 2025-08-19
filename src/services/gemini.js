import { GoogleGenerativeAI } from '@google/generative-ai'

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

  async improveWriting(text, options = {}) {
    if (!this.isInitialized()) {
      throw new Error('Gemini service not initialized. Please provide an API key.')
    }

    const prompt = `Forbedre følgende tekst ved at:
- Rette grammatiske fejl
- Forbedre klarhed og læsbarhed
- Bevare den originale betydning og tone
- Returnere kun den forbedrede tekst uden forklaringer

Tekst: ${text}`

    const requestConfig = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }

    // Add thinking config based on thinkingBudget
    const budget = options.thinkingBudget
    if (budget !== undefined && budget !== null && budget !== 0) {
      requestConfig.generationConfig = {
        thinkingConfig: {
          thinkingBudget: budget === -1 ? null : budget
        }
      }
    }

    const result = await this.model.generateContent(requestConfig)

    return result.response.text()
  }

  async summarizeContent(text, options = {}) {
    if (!this.isInitialized()) {
      throw new Error('Gemini service not initialized. Please provide an API key.')
    }

    const length = options.length || 'kort'
    const prompt = `Lav et ${length} resumé af følgende tekst på dansk. Bevar de vigtigste pointer:

${text}`

    const requestConfig = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }

    // Add thinking config based on thinkingBudget
    const budget = options.thinkingBudget
    if (budget !== undefined && budget !== null && budget !== 0) {
      requestConfig.generationConfig = {
        thinkingConfig: {
          thinkingBudget: budget === -1 ? null : budget
        }
      }
    }

    const result = await this.model.generateContent(requestConfig)

    return result.response.text()
  }

  async generateOutline(text, options = {}) {
    if (!this.isInitialized()) {
      throw new Error('Gemini service not initialized. Please provide an API key.')
    }

    const prompt = `Lav en struktureret outline baseret på følgende tekst. Brug markdown format med headers (# ## ###) og bullet points:

${text}`

    const requestConfig = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }

    // Add thinking config based on thinkingBudget
    const budget = options.thinkingBudget
    if (budget !== undefined && budget !== null && budget !== 0) {
      requestConfig.generationConfig = {
        thinkingConfig: {
          thinkingBudget: budget === -1 ? null : budget
        }
      }
    }

    const result = await this.model.generateContent(requestConfig)

    return result.response.text()
  }

  async convertToMarkdown(text, options = {}) {
    if (!this.isInitialized()) {
      throw new Error('Gemini service not initialized. Please provide an API key.')
    }

    const prompt = `Konverter følgende tekst til proper markdown format. Tilføj passende headers, formateringer og struktur:

${text}`

    const requestConfig = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }

    // Add thinking config based on thinkingBudget
    const budget = options.thinkingBudget
    if (budget !== undefined && budget !== null && budget !== 0) {
      requestConfig.generationConfig = {
        thinkingConfig: {
          thinkingBudget: budget === -1 ? null : budget
        }
      }
    }

    const result = await this.model.generateContent(requestConfig)

    return result.response.text()
  }

  async getWritingSuggestions(text, options = {}) {
    if (!this.isInitialized()) {
      throw new Error('Gemini service not initialized. Please provide an API key.')
    }

    const prompt = `Giv 3-5 konkrete forslag til forbedring af følgende tekst på dansk. Format som en liste:

${text}`

    const requestConfig = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }

    // Add thinking config based on thinkingBudget
    const budget = options.thinkingBudget
    if (budget !== undefined && budget !== null && budget !== 0) {
      requestConfig.generationConfig = {
        thinkingConfig: {
          thinkingBudget: budget === -1 ? null : budget
        }
      }
    }

    const result = await this.model.generateContent(requestConfig)

    return result.response.text()
  }

  async improveWritingStream(text, options = {}) {
    if (!this.isInitialized()) {
      throw new Error('Gemini service not initialized. Please provide an API key.')
    }

    const prompt = `Forbedre følgende tekst ved at:
- Rette grammatiske fejl
- Forbedre klarhed og læsbarhed
- Bevare den originale betydning og tone
- Returnere kun den forbedrede tekst uden forklaringer

Tekst: ${text}`

    const requestConfig = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }

    // Add thinking config based on thinkingBudget
    const budget = options.thinkingBudget
    if (budget !== undefined && budget !== null && budget !== 0) {
      requestConfig.generationConfig = {
        thinkingConfig: {
          thinkingBudget: budget === -1 ? null : budget
        }
      }
    }

    const result = await this.model.generateContentStream(requestConfig)

    return result
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