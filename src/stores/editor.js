// Editor store using Pinia
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useDocumentsStore } from './documents.js'

export const useEditorStore = defineStore('editor', () => {
  // State
  const currentDocumentId = ref(null)
  const title = ref('')
  const content = ref('')
  const hasUnsavedChanges = ref(false)
  const autoSaveInterval = ref(null)

  // Getters
  const currentDocument = computed(() => {
    if (!currentDocumentId.value) return null
    
    return {
      id: currentDocumentId.value,
      title: title.value,
      content: content.value
    }
  })

  const hasContent = computed(() => {
    return title.value.trim() || content.value.trim()
  })

  // Actions
  function loadDocument(documentId) {
    const documentsStore = useDocumentsStore()
    const document = documentsStore.getDocument(documentId)
    
    if (document) {
      currentDocumentId.value = documentId
      title.value = document.title || ''
      content.value = document.content || ''
      hasUnsavedChanges.value = false
    }
  }

  function newDocument() {
    currentDocumentId.value = null
    title.value = ''
    content.value = ''
    hasUnsavedChanges.value = false
  }

  async function saveCurrentDocument() {
    if (!hasContent.value) {
      throw new Error('Dokument skal have indhold for at blive gemt')
    }

    const documentsStore = useDocumentsStore()
    
    const document = {
      id: currentDocumentId.value,
      title: title.value.trim() || 'Untitled Document',
      content: content.value
    }

    const documentId = await documentsStore.saveDocument(document)
    
    // Update current document ID if it was a new document
    if (!currentDocumentId.value) {
      currentDocumentId.value = documentId
    }
    
    hasUnsavedChanges.value = false
    return documentId
  }

  async function deleteCurrentDocument() {
    if (!currentDocumentId.value) return
    
    const documentsStore = useDocumentsStore()
    await documentsStore.deleteDocument(currentDocumentId.value)
    
    // Reset editor state
    newDocument()
  }

  function updateTitle(newTitle) {
    title.value = newTitle
    hasUnsavedChanges.value = true
  }

  function updateContent(newContent) {
    content.value = newContent
    hasUnsavedChanges.value = true
  }


  // Auto-save setup
  function startAutoSave() {
    if (autoSaveInterval.value) {
      clearInterval(autoSaveInterval.value)
    }

    autoSaveInterval.value = setInterval(async () => {
      if (hasUnsavedChanges.value && currentDocumentId.value && hasContent.value) {
        try {
          const documentsStore = useDocumentsStore()
          await documentsStore.autoSaveDocument({
            id: currentDocumentId.value,
            title: title.value.trim() || 'Untitled Document',
            content: content.value
          })
          hasUnsavedChanges.value = false
        } catch (error) {
          console.warn('Auto-save failed:', error)
        }
      }
    }, 30000) // Auto-save every 30 seconds
  }

  function stopAutoSave() {
    if (autoSaveInterval.value) {
      clearInterval(autoSaveInterval.value)
      autoSaveInterval.value = null
    }
  }

  // Watch for changes to mark as unsaved
  watch([title, content], () => {
    hasUnsavedChanges.value = true
  })

  return {
    // State
    currentDocumentId,
    title,
    content,
    hasUnsavedChanges,
    
    // Getters
    currentDocument,
    hasContent,
    
    // Actions
    loadDocument,
    newDocument,
    saveCurrentDocument,
    deleteCurrentDocument,
    updateTitle,
    updateContent,
    startAutoSave,
    stopAutoSave
  }
})