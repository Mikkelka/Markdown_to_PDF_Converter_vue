import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import geminiService from '../services/gemini.js'
import { useAuthStore } from './auth.js'

export const useAIStore = defineStore('ai', () => {
  // State
  const isLoading = ref(false)
  const currentOperation = ref(null)
  const error = ref(null)
  const operationHistory = ref([])
  const settings = ref({
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 1000,
    thinkingBudget: -1,
    autoSave: true
  })

  // Getters
  const canPerformOperations = computed(() => {
    const authStore = useAuthStore()
    return authStore.currentUser && authStore.currentUser.geminiApiKey
  })

  const hasValidApiKey = computed(() => {
    const authStore = useAuthStore()
    return authStore.currentUser?.geminiApiKey && authStore.currentUser.geminiApiKey.trim().length > 0
  })

  // Actions
  const initializeService = async () => {
    const authStore = useAuthStore()
    if (!authStore.currentUser?.geminiApiKey) {
      throw new Error('Ingen Gemini API nøgle fundet. Tilføj din API nøgle i profilen.')
    }

    try {
      geminiService.initialize(authStore.currentUser.geminiApiKey, settings.value.model)
    } catch (err) {
      error.value = 'Fejl ved initialisering af Gemini service: ' + err.message
      throw err
    }
  }

  const performOperation = async (operationType, text, options = {}) => {
    if (!canPerformOperations.value) {
      throw new Error('Gemini API nøgle mangler. Tilføj din API nøgle i profilen.')
    }

    isLoading.value = true
    error.value = null
    currentOperation.value = operationType

    const operation = {
      id: Date.now(),
      type: operationType,
      originalText: text,
      timestamp: new Date(),
      status: 'pending'
    }

    try {
      await initializeService()
      
      let result
      const serviceOptions = {
        ...options,
        thinkingBudget: settings.value.thinkingBudget
      }
      
      let stream
      switch (operationType) {
        case 'improve':
          stream = await geminiService.improveWriting(text, serviceOptions)
          break
        case 'summarize':
          stream = await geminiService.summarizeContent(text, serviceOptions)
          break
        case 'outline':
          stream = await geminiService.generateOutline(text, serviceOptions)
          break
        case 'convert':
          stream = await geminiService.convertToMarkdown(text, serviceOptions)
          break
        case 'suggestions':
          stream = await geminiService.getWritingSuggestions(text, serviceOptions)
          break
        default:
          throw new Error('Ukendt operation: ' + operationType)
      }

      // Convert stream to full result
      result = ''
      if (stream && stream.stream) {
        for await (const chunk of stream.stream) {
          result += chunk.text()
        }
      } else if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
        for await (const chunk of stream) {
          result += chunk.text()
        }
      } else {
        const response = await stream.response
        result = response.text()
      }

      operation.result = result
      operation.status = 'completed'
      
      // Add to history (keep last 20 operations)
      operationHistory.value.unshift(operation)
      if (operationHistory.value.length > 20) {
        operationHistory.value = operationHistory.value.slice(0, 20)
      }

      return result
    } catch (err) {
      operation.error = err.message
      operation.status = 'failed'
      operationHistory.value.unshift(operation)
      
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
      currentOperation.value = null
    }
  }

  const performStreamOperation = async (operationType, text, onChunk, options = {}) => {
    if (!canPerformOperations.value) {
      throw new Error('Gemini API nøgle mangler. Tilføj din API nøgle i profilen.')
    }

    isLoading.value = true
    error.value = null
    currentOperation.value = operationType

    try {
      await initializeService()
      
      const serviceOptions = {
        ...options,
        thinkingBudget: settings.value.thinkingBudget
      }
      
      let stream
      switch (operationType) {
        case 'improve':
          stream = await geminiService.improveWriting(text, serviceOptions)
          break
        case 'summarize':
          stream = await geminiService.summarizeContent(text, serviceOptions)
          break
        case 'outline':
          stream = await geminiService.generateOutline(text, serviceOptions)
          break
        case 'convert':
          stream = await geminiService.convertToMarkdown(text, serviceOptions)
          break
        case 'suggestions':
          stream = await geminiService.getWritingSuggestions(text, serviceOptions)
          break
        default:
          throw new Error('Streaming ikke understøttet for: ' + operationType)
      }

      let fullResult = ''
      
      // Handle the stream response correctly
      if (stream && stream.stream) {
        // Use the stream property
        for await (const chunk of stream.stream) {
          const chunkText = chunk.text()
          fullResult += chunkText
          onChunk(chunkText, fullResult)
        }
      } else if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
        // Direct async iterable
        for await (const chunk of stream) {
          const chunkText = chunk.text()
          fullResult += chunkText
          onChunk(chunkText, fullResult)
        }
      } else {
        // Fallback: try to get text directly
        const result = await stream.response
        const text = result.text()
        fullResult = text
        onChunk(text, fullResult)
      }

      // Add to history
      const operation = {
        id: Date.now(),
        type: operationType,
        originalText: text,
        result: fullResult,
        timestamp: new Date(),
        status: 'completed'
      }
      
      operationHistory.value.unshift(operation)
      if (operationHistory.value.length > 20) {
        operationHistory.value = operationHistory.value.slice(0, 20)
      }

      return fullResult
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
      currentOperation.value = null
    }
  }

  const validateApiKey = async (apiKey) => {
    try {
      return await geminiService.validateApiKey(apiKey)
    } catch (err) {
      return { valid: false, error: err.message }
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearHistory = () => {
    operationHistory.value = []
  }

  const clearAllCache = () => {
    operationHistory.value = []
    localStorage.removeItem('ai-settings')
    // Reset to defaults
    settings.value = {
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 1000,
      thinkingBudget: -1,
      autoSave: true
    }
  }

  const undoOperation = (operationId) => {
    const operation = operationHistory.value.find(op => op.id === operationId)
    if (operation && operation.originalText) {
      return operation.originalText
    }
    return null
  }

  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings }
    
    // Save to localStorage
    localStorage.setItem('ai-settings', JSON.stringify(settings.value))
  }

  // Load settings from localStorage on init
  const savedSettings = localStorage.getItem('ai-settings')
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings)
      
      // Migrate old model names
      if (parsed.model === 'gemini-1.5-flash') {
        parsed.model = 'gemini-2.5-flash'
      } else if (parsed.model === 'gemini-1.5-pro') {
        parsed.model = 'gemini-2.5-flash'
      }
      
      // Migrate enableThinking to thinkingBudget
      if (parsed.enableThinking !== undefined) {
        parsed.thinkingBudget = parsed.enableThinking ? -1 : 0
        delete parsed.enableThinking
      }
      
      // Add thinkingBudget if missing
      if (parsed.thinkingBudget === undefined) {
        parsed.thinkingBudget = -1
      }
      
      settings.value = { ...settings.value, ...parsed }
      
      // Save migrated settings back to localStorage
      localStorage.setItem('ai-settings', JSON.stringify(settings.value))
    } catch (err) {
      console.warn('Failed to load AI settings from localStorage:', err)
      // Clear corrupted settings
      localStorage.removeItem('ai-settings')
    }
  }

  return {
    // State
    isLoading,
    currentOperation,
    error,
    operationHistory,
    settings,
    
    // Getters
    canPerformOperations,
    hasValidApiKey,
    
    // Actions
    performOperation,
    performStreamOperation,
    validateApiKey,
    clearError,
    clearHistory,
    clearAllCache,
    undoOperation,
    updateSettings
  }
})