<template>
  <div v-if="isLoggedIn" class="ai-toolbar">
    <div class="ai-toolbar-content">
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

        <!-- Undo -->
        <div v-if="hasOriginalContent" class="ai-undo">
          <button 
            @click="undoToOriginal"
            :disabled="isLoading"
            class="ai-undo-btn"
            title="Fortryd til original tekst"
          >
            <RotateCcw :size="16" />
            <span>Fortryd til original</span>
          </button>
        </div>
      </div>
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
const useSelection = ref(false)
const originalContent = ref('')
const originalSelection = ref('')

// Computed
const isLoggedIn = computed(() => authStore.isLoggedIn)
const isLoading = computed(() => aiStore.isLoading)
const error = computed(() => aiStore.error)
const currentOperation = computed(() => aiStore.currentOperation)
const hasValidApiKey = computed(() => aiStore.hasValidApiKey)
const canUseAI = computed(() => aiStore.canPerformOperations)

const hasOriginalContent = computed(() => {
  if (useSelection.value) {
    return originalSelection.value !== '' && originalSelection.value !== props.selectedText
  } else {
    return originalContent.value !== '' && originalContent.value !== props.content
  }
})

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

  // Store original content before AI operation (only if not already stored)
  if (useSelection.value && hasSelection.value) {
    if (!originalSelection.value) {
      originalSelection.value = props.selectedText
    }
  } else {
    if (!originalContent.value) {
      originalContent.value = props.content
    }
  }

  try {
    await performStreamingAction(actionType, textToProcess)
  } catch (err) {
    console.error('AI operation failed:', err)
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

const undoToOriginal = () => {
  if (useSelection.value && originalSelection.value) {
    emit('selection-replace', originalSelection.value)
    // Bevar originalSelection indtil næste AI operation
  } else if (originalContent.value) {
    emit('content-update', originalContent.value)
    // Bevar originalContent indtil næste AI operation
  }
}

// Auto-adjust useSelection based on selection
const updateSelectionOption = () => {
  const oldUseSelection = useSelection.value
  if (!hasSelection.value) {
    useSelection.value = false
  }
  
  // Reset original values if switching between selection modes
  if (oldUseSelection !== useSelection.value) {
    resetOriginalValues()
  }
}

// Reset original values when content changes significantly
const resetOriginalValues = () => {
  originalContent.value = ''
  originalSelection.value = ''
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

// Expose reset function for parent component
defineExpose({
  resetOriginalValues
})
</script>

<style scoped>
.ai-toolbar {
  background: #161B22;
  border: 1px solid #30363D;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
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
  border: 1px solid #30363D;
  background: #21262D;
  color: #E6EDF3;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.ai-btn:hover:not(:disabled) {
  background: #30363D;
  border-color: #6366f1;
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
  border-top: 1px solid #30363D;
}

.ai-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #8B949E;
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

.ai-undo {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #30363D;
}

.ai-undo-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #30363D;
  background: #21262D;
  color: #E6EDF3;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  width: 100%;
  justify-content: center;
}

.ai-undo-btn:hover:not(:disabled) {
  background: #30363D;
  border-color: #f97316;
  color: #f97316;
}

.ai-undo-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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