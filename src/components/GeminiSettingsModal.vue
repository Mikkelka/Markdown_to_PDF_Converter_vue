<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>
          <Sparkles :size="20" />
          Gemini AI Indstillinger
        </h2>
        <button @click="closeModal" class="modal-close-btn">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-body">
        <!-- API Key Section -->
        <div class="settings-section">
          <h3>
            <Key :size="18" />
            API Nøgle
          </h3>
          
          <div class="form-group">
            <label for="geminiApiKey">Gemini API Nøgle</label>
            <div class="api-key-input-group">
              <input 
                id="geminiApiKey"
                v-model="geminiApiKey"
                type="password" 
                placeholder="AIzaSy..."
                @input="apiKeyValidation.status = null"
                class="api-key-input"
              >
              <button 
                @click="validateApiKey"
                :disabled="isValidatingKey || !geminiApiKey.trim()"
                class="validate-btn"
              >
                <CheckCircle v-if="!isValidatingKey" :size="16" />
                <div v-else class="spinner-small"></div>
                {{ isValidatingKey ? 'Validerer...' : 'Test' }}
              </button>
            </div>
            
            <!-- API Key Validation Status -->
            <div v-if="apiKeyValidation.status" class="validation-status" :class="apiKeyValidation.status">
              <span class="validation-icon">
                <CheckCircle v-if="apiKeyValidation.status === 'success'" :size="16" />
                <AlertCircle v-else-if="apiKeyValidation.status === 'error'" :size="16" />
                <Clock v-else :size="16" />
              </span>
              {{ apiKeyValidation.message }}
            </div>
            
            <div class="form-help">
              <Info :size="14" />
              <span>
                Din API nøgle gemmes lokalt og bruges kun til AI funktioner. 
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Få en gratis API nøgle her</a>
              </span>
            </div>
          </div>
        </div>

        <!-- Model Settings -->
        <div class="settings-section">
          <h3>
            <Brain :size="18" />
            Model Indstillinger
          </h3>
          
          <div class="form-group">
            <label for="geminiModel">AI Model</label>
            <select id="geminiModel" v-model="geminiModel" class="model-select">
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Højeste Kvalitet)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Balanceret)</option>
              <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Hurtig & Billig)</option>
            </select>
            <div class="model-info">
              <div v-if="geminiModel === 'gemini-2.5-pro'" class="model-description">
                <Award :size="14" />
                <span><strong>Pro:</strong> Højeste kvalitet, altid med thinking. Kan ikke deaktivere thinking.</span>
              </div>
              <div v-else-if="geminiModel === 'gemini-2.5-flash'" class="model-description">
                <Zap :size="14" />
                <span><strong>Flash:</strong> Balanceret model med valgfri thinking funktionalitet</span>
              </div>
              <div v-else class="model-description">
                <Target :size="14" />
                <span><strong>Flash Lite:</strong> Hurtigste og billigste, thinking kan aktiveres</span>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="creativityLevel">
              Kreativitetsniveau: {{ creativityLevel }}
              <span class="creativity-indicator">{{ getCreativityLabel(creativityLevel) }}</span>
            </label>
            <input 
              id="creativityLevel"
              v-model.number="creativityLevel"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="range-input"
            >
            <div class="range-labels">
              <span><Target :size="12" /> Præcis (0.0)</span>
              <span><Palette :size="12" /> Kreativ (1.0)</span>
            </div>
            <div class="form-help">
              <Info :size="14" />
              <span>Lavere værdier giver mere konservative og konsistente svar</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="thinkingMode">
              <Brain :size="16" class="inline-icon" />
              Thinking Konfiguration
            </label>
            <select id="thinkingMode" v-model="thinkingMode" class="thinking-select" :disabled="geminiModel === 'gemini-2.5-pro'">
              <option v-if="geminiModel !== 'gemini-2.5-pro'" value="disabled">Deaktiveret (thinkingBudget = 0)</option>
              <option value="dynamic">Dynamisk - Model beslutter (thinkingBudget = -1)</option>
              <option value="custom">Brugerdefineret budget</option>
            </select>
            
            <!-- Custom thinking budget input -->
            <div v-if="thinkingMode === 'custom'" class="custom-budget-input">
              <label for="customThinkingBudget">Thinking Budget: {{ customThinkingBudget }}</label>
              <input 
                id="customThinkingBudget"
                v-model.number="customThinkingBudget"
                type="range"
                :min="getThinkingRange().min"
                :max="getThinkingRange().max"
                :step="getThinkingRange().step"
                class="range-input"
              >
              <div class="range-labels">
                <span>{{ getThinkingRange().min }} (Min)</span>
                <span>{{ getThinkingRange().max }} (Max)</span>
              </div>
            </div>
            
            <div class="form-help">
              <Info :size="14" />
              <span>{{ getThinkingDescription() }}</span>
            </div>
          </div>

          <div class="form-group">
            <label for="maxTokens">Maksimalt antal tokens</label>
            <div class="token-input-group">
              <input 
                id="maxTokens"
                v-model.number="maxTokens"
                type="number"
                min="100"
                max="8000"
                step="100"
                class="token-input"
              >
              <span class="token-estimate">≈ {{ getWordEstimate(maxTokens) }} ord</span>
            </div>
            <div class="form-help">
              <Info :size="14" />
              <span>Højere værdier tillader længere AI svar, men øger omkostninger</span>
            </div>
          </div>
        </div>

      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="cancel-btn">
          Annuller
        </button>
        <button @click="saveSettings" class="save-btn" :disabled="isSaving">
          <Save v-if="!isSaving" :size="16" />
          <div v-else class="spinner-small"></div>
          {{ isSaving ? 'Gemmer...' : 'Gem indstillinger' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { 
  Sparkles, X, Key, Brain, 
  CheckCircle, AlertCircle, Clock, Info, Award, Target, 
  Palette
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.js'
import { useAIStore } from '../stores/ai.js'

// Props and emits
defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// Stores
const authStore = useAuthStore()
const aiStore = useAIStore()

// Local state
const geminiApiKey = ref('')
const apiKeyValidation = ref({ status: null, message: '' })
const isValidatingKey = ref(false)
const isSaving = ref(false)

// Settings
const geminiModel = ref('gemini-2.5-flash')
const creativityLevel = ref(0.7)
const maxTokens = ref(1000)
const thinkingMode = ref('dynamic')
const customThinkingBudget = ref(1000)

// Computed
const currentUser = computed(() => authStore.currentUser)

// Watchers
watch(currentUser, (user) => {
  if (user) {
    geminiApiKey.value = user.geminiApiKey || ''
  }
}, { immediate: true })

watch(() => aiStore.settings, (settings) => {
  if (settings) {
    geminiModel.value = settings.model || 'gemini-2.5-flash'
    creativityLevel.value = settings.temperature || 0.7
    maxTokens.value = settings.maxTokens || 1000
    
    // Set thinking mode based on thinkingBudget
    const budget = settings.thinkingBudget
    if (budget === 0) {
      thinkingMode.value = 'disabled'
    } else if (budget === -1 || budget === undefined || budget === null) {
      thinkingMode.value = 'dynamic'
    } else {
      thinkingMode.value = 'custom'
      customThinkingBudget.value = budget
    }
  }
}, { immediate: true, deep: true })

// Watch model changes to set appropriate defaults
watch(geminiModel, (newModel) => {
  // Set thinking mode to dynamic for Pro (can't be disabled)
  if (newModel === 'gemini-2.5-pro' && thinkingMode.value === 'disabled') {
    thinkingMode.value = 'dynamic'
  }
  
  // Adjust custom budget to be within range
  if (thinkingMode.value === 'custom') {
    const range = getThinkingRange()
    if (customThinkingBudget.value < range.min) {
      customThinkingBudget.value = range.min
    } else if (customThinkingBudget.value > range.max) {
      customThinkingBudget.value = range.max
    }
  }
})

// Methods
const closeModal = () => {
  emit('close')
}

const validateApiKey = async () => {
  if (!geminiApiKey.value.trim()) {
    apiKeyValidation.value = { status: 'error', message: 'Indtast en API nøgle' }
    return
  }

  isValidatingKey.value = true
  apiKeyValidation.value = { status: 'validating', message: 'Validerer API nøgle...' }

  try {
    const result = await aiStore.validateApiKey(geminiApiKey.value.trim())
    
    if (result.valid) {
      apiKeyValidation.value = { status: 'success', message: 'API nøgle er gyldig og klar til brug!' }
    } else {
      apiKeyValidation.value = { status: 'error', message: result.error || 'Ugyldig API nøgle' }
    }
  } catch (error) {
    apiKeyValidation.value = { status: 'error', message: 'Fejl ved validering: ' + error.message }
  } finally {
    isValidatingKey.value = false
  }
}

const saveSettings = async () => {
  isSaving.value = true
  
  try {
    // Update user profile with API key
    await authStore.updateProfile({
      geminiApiKey: geminiApiKey.value.trim()
    })
    
    // Update AI settings
    aiStore.updateSettings({
      model: geminiModel.value,
      temperature: creativityLevel.value,
      maxTokens: maxTokens.value,
      thinkingBudget: getThinkingBudgetValue()
    })
    
    showSuccess('Gemini AI indstillinger gemt!')
    closeModal()
  } catch (error) {
    showError(error.message || 'Kunne ikke gemme indstillinger')
  } finally {
    isSaving.value = false
  }
}


// Helper functions
const getCreativityLabel = (value) => {
  if (value <= 0.3) return '🎯 Præcis'
  if (value <= 0.7) return '⚖️ Balanceret'
  return '🎨 Kreativ'
}

const getThinkingRange = () => {
  switch (geminiModel.value) {
    case 'gemini-2.5-pro':
      return { min: 128, max: 32768, step: 128 }
    case 'gemini-2.5-flash':
      return { min: 0, max: 24576, step: 256 }
    case 'gemini-2.5-flash-lite':
      return { min: 512, max: 24576, step: 256 }
    default:
      return { min: 0, max: 24576, step: 256 }
  }
}

const getThinkingDescription = () => {
  const model = geminiModel.value
  const mode = thinkingMode.value
  
  if (model === 'gemini-2.5-pro') {
    return 'Pro model har altid thinking aktiveret. Modellen beslutter automatisk hvor meget den skal tænke.'
  }
  
  switch (mode) {
    case 'disabled':
      return 'Thinking er deaktiveret. Hurtigere svar men lavere kvalitet.'
    case 'dynamic':
      return `Modellen beslutter automatisk hvornår og hvor meget den skal tænke. Standard indstilling for ${model}.`
    case 'custom':
      return `Brugerdefineret thinking budget: ${customThinkingBudget.value}. Højere værdi = mere thinking = bedre kvalitet men længere tid.`
    default:
      return ''
  }
}

const getThinkingBudgetValue = () => {
  switch (thinkingMode.value) {
    case 'disabled':
      return 0
    case 'dynamic':
      return -1
    case 'custom':
      return customThinkingBudget.value
    default:
      return -1
  }
}

const getWordEstimate = (tokens) => {
  return Math.round(tokens * 0.75)
}

// Notification helpers
const showSuccess = (message) => {
  showNotification(message, 'success')
}

const showError = (message) => {
  showNotification(message, 'error')
}

const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div')
  notification.textContent = message
  
  const colors = {
    success: { bg: '#238636', text: 'white' },
    error: { bg: '#F85149', text: 'white' }
  }
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type].bg};
    color: ${colors[type].text};
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    z-index: 2001;
    opacity: 0;
    transition: opacity 0.3s ease;
    max-width: 300px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  `
  
  document.body.appendChild(notification)
  
  setTimeout(() => notification.style.opacity = '1', 100)
  
  setTimeout(() => {
    notification.style.opacity = '0'
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: #0D1117;
  border: 1px solid #30363D;
  border-radius: 12px;
  width: 90vw;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: #161B22;
  border-bottom: 1px solid #30363D;
  border-radius: 12px 12px 0 0;
}

.modal-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #E6EDF3;
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #8B949E;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #21262D;
  color: #E6EDF3;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #21262D;
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.settings-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #E6EDF3;
  margin: 0 0 1.5rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #E6EDF3;
  margin-bottom: 0.75rem;
}

.api-key-input-group {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.api-key-input {
  flex: 1;
  background: #161B22;
  border: 1px solid #30363D;
  border-radius: 8px;
  padding: 0.875rem;
  color: #E6EDF3;
  font-size: 0.875rem;
  font-family: 'SF Mono', monospace;
  transition: all 0.2s ease;
}

.api-key-input:focus {
  outline: none;
  border-color: #1F6FEB;
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.3);
}

.validate-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #1F6FEB;
  color: white;
  border: none;
  padding: 0.875rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.validate-btn:hover:not(:disabled) {
  background: #1658D1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(31, 111, 235, 0.4);
}

.validate-btn:disabled {
  background: #484F58;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.875rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.validation-status.success {
  background: rgba(35, 134, 54, 0.15);
  color: #2EA043;
  border: 1px solid rgba(35, 134, 54, 0.3);
}

.validation-status.error {
  background: rgba(248, 81, 73, 0.15);
  color: #F85149;
  border: 1px solid rgba(248, 81, 73, 0.3);
}

.validation-status.validating {
  background: rgba(31, 111, 235, 0.15);
  color: #1F6FEB;
  border: 1px solid rgba(31, 111, 235, 0.3);
}

.model-select {
  width: 100%;
  background: #161B22;
  border: 1px solid #30363D;
  border-radius: 8px;
  padding: 0.875rem;
  color: #E6EDF3;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.model-select:focus {
  outline: none;
  border-color: #1F6FEB;
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.3);
}

.model-info {
  margin-top: 0.75rem;
}

.model-description {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #161B22;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #8B949E;
}

.range-input {
  width: 100%;
  margin: 0.75rem 0;
  height: 6px;
  background: #30363D;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #1F6FEB;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(31, 111, 235, 0.4);
}

.range-input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #1F6FEB;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(31, 111, 235, 0.4);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #8B949E;
  margin-top: 0.5rem;
}

.range-labels span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.creativity-indicator {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  background: #21262D;
  border-radius: 4px;
  margin-left: 0.5rem;
}

.token-input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.token-input {
  flex: 1;
  background: #161B22;
  border: 1px solid #30363D;
  border-radius: 8px;
  padding: 0.875rem;
  color: #E6EDF3;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.token-input:focus {
  outline: none;
  border-color: #1F6FEB;
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.3);
}

.token-estimate {
  font-size: 0.8rem;
  color: #8B949E;
  background: #21262D;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  white-space: nowrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #E6EDF3;
  padding: 0.75rem;
  background: #161B22;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.checkbox-label:hover {
  background: #21262D;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #30363D;
  border-radius: 4px;
  background: #0D1117;
  transition: all 0.2s ease;
  position: relative;
}

.checkbox-input:checked + .checkbox-custom {
  background: #1F6FEB;
  border-color: #1F6FEB;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.5;
}

.form-help {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #8B949E;
  margin-top: 0.75rem;
  line-height: 1.4;
}

.form-help a {
  color: #1F6FEB;
  text-decoration: none;
}

.form-help a:hover {
  text-decoration: underline;
}


/* Thinking configuration styles */
.inline-icon {
  margin-right: 0.5rem;
  vertical-align: middle;
}

.thinking-select {
  width: 100%;
  background: #161B22;
  border: 1px solid #30363D;
  border-radius: 8px;
  padding: 0.875rem;
  color: #E6EDF3;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  margin-bottom: 0.75rem;
}

.thinking-select:focus {
  outline: none;
  border-color: #1F6FEB;
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.3);
}

.thinking-select:disabled {
  background: #0D1117;
  color: #8B949E;
  cursor: not-allowed;
}

.custom-budget-input {
  margin-top: 1rem;
  padding: 1rem;
  background: #161B22;
  border: 1px solid #21262D;
  border-radius: 8px;
}

.custom-budget-input label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #E6EDF3;
  margin-bottom: 0.75rem;
  display: block;
}


.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  background: #161B22;
  border-top: 1px solid #30363D;
  border-radius: 0 0 12px 12px;
}

.cancel-btn {
  background: #21262D;
  color: #E6EDF3;
  border: 1px solid #30363D;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #30363D;
  border-color: #484F58;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #238636;
  color: white;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background: #2EA043;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(35, 134, 54, 0.4);
}

.save-btn:disabled {
  background: #484F58;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Scrollbar styling */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #0D1117;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #30363D;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #484F58;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .modal {
    width: 95vw;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .api-key-input-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .token-input-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .cancel-btn,
  .save-btn {
    justify-content: center;
    width: 100%;
  }
}
</style>