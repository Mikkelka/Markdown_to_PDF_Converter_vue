<template>
  <div v-if="isLoggedIn" class="ai-toolbar">
    <div class="ai-toolbar-header">
      <div class="ai-toolbar-title">
        <Sparkles class="ai-icon" :size="16" />
        <span>AI Assistent</span>
      </div>
      <button 
        @click="collapsed = !collapsed"
        class="ai-collapse-btn"
        :class="{ 'collapsed': collapsed }"
      >
        <ChevronDown :size="16" />
      </button>
    </div>

    <transition name="ai-toolbar-content">
      <div v-if="!collapsed" class="ai-toolbar-content">
        <!-- Action Buttons -->
        <div class="ai-actions">
          <button 
            @click="performAction('improve')"
            :disabled="isLoading || !canUseAI"
            class="ai-btn ai-btn-primary"
          >
            <Sparkles :size="16" />
            <span>Forbedre tekst</span>
          </button>

          <button 
            @click="performAction('summarize')"
            :disabled="isLoading || !canUseAI"
            class="ai-btn"
          >
            <FileText :size="16" />
            <span>Sammenfat</span>
          </button>

          <button 
            @click="performAction('outline')"
            :disabled="isLoading || !canUseAI"
            class="ai-btn"
          >
            <List :size="16" />
            <span>Lav outline</span>
          </button>

          <button 
            @click="performAction('convert')"
            :disabled="isLoading || !canUseAI"
            class="ai-btn"
          >
            <Hash :size="16" />
            <span>Til Markdown</span>
          </button>

          <button 
            @click="performAction('suggestions')"
            :disabled="isLoading || !canUseAI"
            class="ai-btn"
          >
            <Lightbulb :size="16" />
            <span>Forslag</span>
          </button>
        </div>

        <!-- Options -->
        <div class="ai-options">
          <label class="ai-option">
            <input 
              type="checkbox" 
              v-model="useSelection"
              :disabled="!hasSelection"
            />
            <span>Kun markeret tekst ({{ selectionLength }} tegn)</span>
          </label>

          <label class="ai-option">
            <input 
              type="checkbox" 
              v-model="useStreaming"
            />
            <span>Streaming svar</span>
          </label>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="ai-error">
          <AlertCircle :size="16" />
          <span>{{ error }}</span>
          <button @click="clearError" class="ai-error-close">
            <X :size="14" />
          </button>
        </div>

        <!-- API Key Warning -->
        <div v-if="!hasValidApiKey" class="ai-warning">
          <AlertTriangle :size="16" />
          <span>Tilføj din Gemini API nøgle i profilen for at bruge AI funktioner</span>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="ai-loading">
          <div class="ai-spinner"></div>
          <span>{{ currentOperation ? getOperationText(currentOperation) : 'Arbejder...' }}</span>
          <button @click="cancelOperation" class="ai-cancel-btn">
            <X :size="14" />
          </button>
        </div>

        <!-- Operation History -->
        <div v-if="operationHistory.length > 0" class="ai-history">
          <h4>Seneste AI operationer</h4>
          <div class="history-list">
            <div 
              v-for="operation in operationHistory.slice(0, 3)" 
              :key="operation.id"
              class="history-item"
              :class="{ 'failed': operation.status === 'failed' }"
            >
              <div class="history-info">
                <span class="history-type">{{ getOperationDisplayName(operation.type) }}</span>
                <span class="history-time">{{ formatTime(operation.timestamp) }}</span>
              </div>
              <div class="history-actions">
                <button 
                  @click="undoOperation(operation)"
                  :disabled="isLoading"
                  class="history-btn"
                  title="Fortryd denne operation"
                >
                  <RotateCcw :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Sparkles, 
  FileText, 
  List, 
  Hash, 
  Lightbulb, 
  ChevronDown, 
  AlertCircle, 
  AlertTriangle, 
  X,
  RotateCcw
} from 'lucide-vue-next'
import { useAIStore } from '../stores/ai.js'
import { useAuthStore } from '../stores/auth.js'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  selectedText: {
    type: String,
    default: ''
  },
  onContentUpdate: {
    type: Function,
    default: () => {}
  },
  onSelectionReplace: {
    type: Function,
    default: () => {}
  }
})

const emit = defineEmits(['content-update', 'selection-replace'])

// Stores
const aiStore = useAIStore()
const authStore = useAuthStore()

// Local state
const collapsed = ref(false)
const useSelection = ref(false)
const useStreaming = ref(true)

// Computed
const isLoggedIn = computed(() => authStore.isLoggedIn)
const isLoading = computed(() => aiStore.isLoading)
const error = computed(() => aiStore.error)
const currentOperation = computed(() => aiStore.currentOperation)
const hasValidApiKey = computed(() => aiStore.hasValidApiKey)
const canUseAI = computed(() => aiStore.canPerformOperations)
const operationHistory = computed(() => aiStore.operationHistory)

const hasSelection = computed(() => props.selectedText && props.selectedText.trim().length > 0)
const selectionLength = computed(() => props.selectedText ? props.selectedText.length : 0)

const getTextToProcess = computed(() => {
  if (useSelection.value && hasSelection.value) {
    return props.selectedText
  }
  return props.content
})

// Methods
const performAction = async (actionType) => {
  if (!canUseAI.value) return

  const textToProcess = getTextToProcess.value
  if (!textToProcess.trim()) {
    aiStore.error = 'Ingen tekst at behandle'
    return
  }

  try {
    if (useStreaming.value && actionType === 'improve') {
      await performStreamingAction(actionType, textToProcess)
    } else {
      await performRegularAction(actionType, textToProcess)
    }
  } catch (err) {
    console.error('AI operation failed:', err)
  }
}

const performRegularAction = async (actionType, text) => {
  const result = await aiStore.performOperation(actionType, text)
  
  if (useSelection.value && hasSelection.value) {
    emit('selection-replace', result)
  } else {
    emit('content-update', result)
  }
}

const performStreamingAction = async (actionType, text) => {
  let streamResult = ''
  
  const onChunk = (chunk, fullResult) => {
    streamResult = fullResult
    if (useSelection.value && hasSelection.value) {
      emit('selection-replace', streamResult)
    } else {
      emit('content-update', streamResult)
    }
  }

  await aiStore.performStreamOperation(actionType, text, onChunk)
}

const cancelOperation = () => {
  // In a real implementation, you'd cancel the ongoing request
  aiStore.isLoading = false
  aiStore.currentOperation = null
}

const clearError = () => {
  aiStore.clearError()
}

const getOperationText = (operation) => {
  const operations = {
    improve: 'Forbedrer tekst...',
    summarize: 'Sammenfatter...',
    outline: 'Laver outline...',
    convert: 'Konverterer til Markdown...',
    suggestions: 'Genererer forslag...'
  }
  return operations[operation] || 'Behandler...'
}

const getOperationDisplayName = (operation) => {
  const operations = {
    improve: 'Forbedret tekst',
    summarize: 'Sammenfatning',
    outline: 'Outline',
    convert: 'Markdown konvertering',
    suggestions: 'Forslag'
  }
  return operations[operation] || operation
}

const formatTime = (timestamp) => {
  const now = new Date()
  const diff = now - new Date(timestamp)
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Nu'
  if (minutes < 60) return `${minutes}m siden`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}t siden`
  
  return new Date(timestamp).toLocaleDateString('da-DK')
}

const undoOperation = (operation) => {
  if (operation.originalText !== undefined) {
    if (useSelection.value && hasSelection.value) {
      emit('selection-replace', operation.originalText)
    } else {
      emit('content-update', operation.originalText)
    }
  }
}

// Auto-adjust useSelection based on selection
const updateSelectionOption = () => {
  if (!hasSelection.value) {
    useSelection.value = false
  }
}

// Watch for selection changes
const checkSelection = () => {
  updateSelectionOption()
}

onMounted(() => {
  updateSelectionOption()
  // Check selection periodically
  const selectionInterval = setInterval(checkSelection, 500)
  
  onUnmounted(() => {
    clearInterval(selectionInterval)
  })
})
</script>

<style scoped>
.ai-toolbar {
  background: var(--bg-color, #f8f9fa);
  border: 1px solid var(--border-color, #e9ecef);
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 0.2s ease;
}

.ai-toolbar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--header-bg, #fff);
  border-bottom: 1px solid var(--border-color, #e9ecef);
  cursor: pointer;
}

.ai-toolbar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.ai-icon {
  color: #6366f1;
}

.ai-collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.ai-collapse-btn:hover {
  background: var(--hover-bg, #f1f3f4);
}

.ai-collapse-btn.collapsed {
  transform: rotate(-90deg);
}

.ai-toolbar-content-enter-active,
.ai-toolbar-content-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.ai-toolbar-content-enter-from,
.ai-toolbar-content-leave-to {
  max-height: 0;
  opacity: 0;
}

.ai-toolbar-content-enter-to,
.ai-toolbar-content-leave-from {
  max-height: 500px;
  opacity: 1;
}

.ai-toolbar-content {
  padding: 1rem;
}

.ai-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.ai-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color, #e9ecef);
  background: var(--btn-bg, #fff);
  color: var(--text-color, #333);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.ai-btn:hover:not(:disabled) {
  background: var(--btn-hover-bg, #f8f9fa);
  border-color: var(--btn-hover-border, #6366f1);
}

.ai-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-btn-primary {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.ai-btn-primary:hover:not(:disabled) {
  background: #5855eb;
}

.ai-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #e9ecef);
}

.ai-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-color, #666);
  cursor: pointer;
}

.ai-option input[type="checkbox"] {
  margin: 0;
}

.ai-error,
.ai-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.ai-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.ai-warning {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fed7aa;
}

.ai-error-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  margin-left: auto;
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-size: 0.875rem;
}

.ai-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e0f2fe;
  border-top: 2px solid #0369a1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.ai-cancel-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  margin-left: auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.ai-history {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #e9ecef);
}

.ai-history h4 {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color, #666);
  margin: 0 0 0.75rem 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--history-bg, #f8f9fa);
  border: 1px solid var(--border-color, #e9ecef);
  border-radius: 4px;
  font-size: 0.8rem;
}

.history-item.failed {
  background: #fef2f2;
  border-color: #fecaca;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.history-type {
  font-weight: 500;
  color: var(--text-color, #333);
}

.history-time {
  color: var(--text-color, #666);
  font-size: 0.75rem;
}

.history-actions {
  display: flex;
  gap: 0.25rem;
}

.history-btn {
  background: none;
  border: 1px solid var(--border-color, #e9ecef);
  border-radius: 4px;
  padding: 0.25rem;
  cursor: pointer;
  color: var(--text-color, #666);
  transition: all 0.2s ease;
}

.history-btn:hover:not(:disabled) {
  background: var(--btn-hover-bg, #f1f3f4);
  border-color: var(--btn-hover-border, #6366f1);
  color: var(--btn-hover-color, #6366f1);
}

.history-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .ai-toolbar {
    --bg-color: #1f2937;
    --header-bg: #374151;
    --border-color: #4b5563;
    --text-color: #f9fafb;
    --btn-bg: #374151;
    --btn-hover-bg: #4b5563;
    --btn-hover-border: #818cf8;
    --hover-bg: #4b5563;
    --history-bg: #374151;
    --btn-hover-color: #818cf8;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .ai-actions {
    flex-direction: column;
  }
  
  .ai-btn {
    justify-content: center;
    width: 100%;
  }
}
</style>