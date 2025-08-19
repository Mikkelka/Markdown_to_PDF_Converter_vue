// Documents store using Pinia
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { documentService, localStorageService } from '../services/firestore.js'
import { useAuthStore } from './auth.js'

export const useDocumentsStore = defineStore('documents', () => {
  // State
  const documents = ref({})
  const loading = ref(false)
  const lastSync = ref(null)

  // Getters
  const documentsList = computed(() => {
    return Object.values(documents.value).sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0)
      const dateB = new Date(b.updatedAt || 0)
      return dateB - dateA
    })
  })

  const documentsCount = computed(() => Object.keys(documents.value).length)

  // Actions
  async function loadDocuments() {
    const authStore = useAuthStore()
    
    if (!authStore.isLoggedIn || !authStore.currentUser) {
      console.log('User not logged in or user data not available, clearing documents')
      documents.value = {}
      return
    }

    loading.value = true
    
    try {
      console.log('Loading documents for user:', authStore.currentUser.id)
      
      // Try Firestore first
      try {
        const firestoreDocs = await documentService.getUserDocuments(authStore.currentUser.id)
        documents.value = firestoreDocs
        lastSync.value = new Date()
        console.log(`✅ Loaded ${Object.keys(firestoreDocs).length} documents from Firestore`)
      } catch (firestoreError) {
        console.warn('⚠️  Firestore failed, falling back to localStorage:', firestoreError)
        
        // Fallback to localStorage
        const localDocs = localStorageService.getUserDocuments(authStore.currentUser.id)
        documents.value = localDocs
        console.log(`📁 Loaded ${Object.keys(localDocs).length} documents from localStorage`)
      }
      
    } catch (error) {
      console.error('❌ Failed to load documents:', error)
      // Don't throw, just clear documents and continue
      documents.value = {}
    } finally {
      loading.value = false
    }
  }

  async function saveDocument(document) {
    const authStore = useAuthStore()
    
    if (!authStore.isLoggedIn) {
      throw new Error('Du skal være logget ind for at gemme dokumenter')
    }

    const title = document.title?.trim() || 'Untitled Document'
    const content = document.content || ''
    const now = new Date()
    
    try {
      let documentToSave

      if (document.id && documents.value[document.id]) {
        // Update existing document
        documentToSave = {
          ...documents.value[document.id],
          title,
          content,
          updatedAt: now
        }
      } else {
        // Create new document
        documentToSave = {
          title,
          content,
          createdAt: now,
          updatedAt: now
        }
      }

      // Try Firestore first
      try {
        const documentId = await documentService.saveDocument(documentToSave, authStore.currentUser.id)
        
        if (!documentToSave.id) {
          documentToSave.id = documentId
        }
        
        // Update local cache
        documents.value[documentId] = documentToSave
        console.log('Document saved to Firestore')
        
        return documentId
      } catch (firestoreError) {
        console.warn('Firestore save failed, falling back to localStorage:', firestoreError)
        
        // Fallback to localStorage
        const documentId = localStorageService.saveDocument(documentToSave, authStore.currentUser.id)
        
        if (!documentToSave.id) {
          documentToSave.id = documentId
        }
        
        // Update local cache
        documents.value[documentId] = documentToSave
        console.log('Document saved to localStorage')
        
        return documentId
      }
      
    } catch (error) {
      console.error('Failed to save document:', error)
      throw error
    }
  }

  async function deleteDocument(documentId) {
    const authStore = useAuthStore()
    
    if (!authStore.isLoggedIn) {
      throw new Error('Du skal være logget ind for at slette dokumenter')
    }

    try {
      // Try Firestore first
      try {
        await documentService.deleteDocument(documentId)
        console.log('Document deleted from Firestore')
      } catch (firestoreError) {
        console.warn('Firestore delete failed, falling back to localStorage:', firestoreError)
        
        // Fallback to localStorage
        localStorageService.deleteDocument(documentId, authStore.currentUser.id)
        console.log('Document deleted from localStorage')
      }
      
      // Remove from local cache
      delete documents.value[documentId]
      
    } catch (error) {
      console.error('Failed to delete document:', error)
      throw error
    }
  }

  function getDocument(documentId) {
    return documents.value[documentId] || null
  }

  function clearDocuments() {
    documents.value = {}
  }

  // Auto-save function
  async function autoSaveDocument(document) {
    const authStore = useAuthStore()
    
    if (!authStore.isLoggedIn || !document.id || !document.content?.trim()) {
      return
    }

    try {
      await saveDocument(document)
      console.log('Auto-save successful')
    } catch (error) {
      console.warn('Auto-save failed:', error)
    }
  }

  // Format date for display
  function formatDate(dateValue) {
    let date
    if (dateValue && typeof dateValue.toDate === 'function') {
      // Firebase Timestamp
      date = dateValue.toDate()
    } else if (dateValue) {
      // Regular Date or date string
      date = new Date(dateValue)
    } else {
      date = new Date()
    }
    
    return date.toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    // State
    documents,
    loading,
    lastSync,
    
    // Getters
    documentsList,
    documentsCount,
    
    // Actions
    loadDocuments,
    saveDocument,
    deleteDocument,
    getDocument,
    clearDocuments,
    autoSaveDocument,
    formatDate
  }
})