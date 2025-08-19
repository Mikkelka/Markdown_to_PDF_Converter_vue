<script setup>
import { computed, watch, ref } from 'vue'
import { useEditorStore } from '../stores/editor.js'
import { useAuthStore } from '../stores/auth.js'
import AIToolbar from './AIToolbar.vue'

const editorStore = useEditorStore()
const authStore = useAuthStore()

// Local state for AI integration
const textareaRef = ref(null)
const selectedText = ref('')

// Computed properties
const title = computed({
  get: () => editorStore.title,
  set: (value) => editorStore.updateTitle(value)
})

const content = computed({
  get: () => editorStore.content,
  set: (value) => editorStore.updateContent(value)
})

const placeholderText = `Skriv dit markdown her...
# Eksempel
Dette er et eksempel på markdown tekst.

## Underoverskrift
- Punkt 1
- Punkt 2
- Punkt 3

**Fed tekst** og *kursiv tekst*

\`\`\`javascript
console.log('Hej verden!');
\`\`\`
`

// Auto-focus on title when creating new document
watch(() => editorStore.currentDocumentId, (newId, oldId) => {
  if (newId === null && oldId !== null) {
    // New document created, focus on title
    setTimeout(() => {
      const titleInput = document.getElementById('documentTitle')
      if (titleInput) {
        titleInput.focus()
      }
    }, 100)
  }
})

// AI Integration Methods
const updateSelectedText = () => {
  if (textareaRef.value) {
    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    selectedText.value = textarea.value.substring(start, end)
  }
}

const handleAIContentUpdate = (newContent) => {
  content.value = newContent
}

const handleAISelectionReplace = (newText) => {
  if (textareaRef.value && selectedText.value) {
    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentContent = content.value
    
    const beforeSelection = currentContent.substring(0, start)
    const afterSelection = currentContent.substring(end)
    
    content.value = beforeSelection + newText + afterSelection
    
    // Update cursor position
    setTimeout(() => {
      const newCursorPos = start + newText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }
}
</script>

<template>
  <div class="editor-panel">
    <div class="panel-header">
      <h2>Markdown Input</h2>
      <input
        id="documentTitle"
        v-model="title"
        type="text"
        placeholder="Dokument titel..."
        class="document-title-input"
        :disabled="!authStore.isLoggedIn"
      >
    </div>
    
    <!-- AI Toolbar (only for logged in users) -->
    <AIToolbar
      :content="content"
      :selected-text="selectedText"
      @content-update="handleAIContentUpdate"
      @selection-replace="handleAISelectionReplace"
    />
    
    
    <textarea
      ref="textareaRef"
      v-model="content"
      :placeholder="placeholderText"
      class="markdown-textarea"
      :disabled="!authStore.isLoggedIn"
      spellcheck="false"
      @select="updateSelectedText"
      @mouseup="updateSelectedText"
      @keyup="updateSelectedText"
    ></textarea>
  </div>
</template>

<style scoped>
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0D1117;
  border-right: 1px solid #30363D;
}

.panel-header {
  padding: 1rem;
  background: #161B22;
  border-bottom: 1px solid #30363D;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.panel-header h2 {
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
  color: #E6EDF3;
  letter-spacing: -0.01em;
  flex-shrink: 0;
}

.document-title-input {
  flex: 1;
  background: #21262D;
  border: 1px solid #30363D;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: #E6EDF3;
  font-size: 0.875rem;
  font-family: inherit;
  transition: all 0.2s ease;
  min-width: 0;
}

.document-title-input:focus {
  outline: none;
  border-color: #1F6FEB;
  box-shadow: 0 0 0 2px rgba(31, 111, 235, 0.3);
}

.document-title-input:disabled {
  background: #161B22;
  color: #8B949E;
  cursor: not-allowed;
}

.document-title-input::placeholder {
  color: #8B949E;
}

.markdown-textarea {
  flex: 1;
  background: #0D1117;
  border: none;
  padding: 1.5rem;
  color: #E6EDF3;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.7;
  resize: none;
  outline: none;
  overflow-y: auto;
  tab-size: 2;
}

.markdown-textarea:disabled {
  background: #0D1117;
  color: #8B949E;
  cursor: not-allowed;
}

.markdown-textarea::placeholder {
  color: #8B949E;
  font-family: inherit;
}

/* Scrollbar styling */
.markdown-textarea::-webkit-scrollbar {
  width: 8px;
}

.markdown-textarea::-webkit-scrollbar-track {
  background: #0D1117;
}

.markdown-textarea::-webkit-scrollbar-thumb {
  background: #30363D;
  border-radius: 4px;
}

.markdown-textarea::-webkit-scrollbar-thumb:hover {
  background: #484F58;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .panel-header h2 {
    text-align: center;
  }
  
  .markdown-textarea {
    padding: 1rem;
    font-size: 0.8rem;
  }
}
</style>