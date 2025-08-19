<script setup>
import { computed } from 'vue'
import { RefreshCw, Save, Plus, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.js'
import { useDocumentsStore } from '../stores/documents.js'
import { useEditorStore } from '../stores/editor.js'

const authStore = useAuthStore()
const documentsStore = useDocumentsStore()
const editorStore = useEditorStore()

// Computed properties
const documentsList = computed(() => documentsStore.documentsList)
const isLoggedIn = computed(() => authStore.isLoggedIn)

// Methods
async function refreshDocuments() {
  if (!isLoggedIn.value) {
    showError('Du skal være logget ind for at genindlæse dokumenter')
    return
  }
  
  try {
    await documentsStore.loadDocuments()
    showSuccess('Dokumenter genindlæst!')
  } catch (error) {
    showError('Kunne ikke genindlæse dokumenter')
  }
}

async function saveCurrentDocument() {
  if (!isLoggedIn.value) {
    showError('Du skal være logget ind for at gemme dokumenter')
    return
  }
  
  try {
    await editorStore.saveCurrentDocument()
    showSuccess('Dokument gemt!')
  } catch (error) {
    showError(error.message || 'Kunne ikke gemme dokument')
  }
}

function loadDocument(documentId) {
  editorStore.loadDocument(documentId)
}

async function deleteDocument(documentId) {
  if (confirm('Er du sikker på at du vil slette dette dokument?')) {
    try {
      await documentsStore.deleteDocument(documentId)
      showSuccess('Dokument slettet!')
    } catch (error) {
      showError('Kunne ikke slette dokument')
    }
  }
}

function newDocument() {
  editorStore.newDocument()
}

// Notification helpers
function showSuccess(message) {
  showNotification(message, 'success')
}

function showError(message) {
  showNotification(message, 'error')
}

function showNotification(message, type = 'success') {
  // Create temporary notification
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
  
  // Animate in
  setTimeout(() => notification.style.opacity = '1', 100)
  
  // Animate out and remove
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

<template>
  <div class="sidebar-header">
    <h2>Your Documents</h2>
    <div class="sidebar-actions">
      <button 
        @click="refreshDocuments" 
        class="save-btn" 
        title="Genindlæs dokumenter"
        :disabled="!isLoggedIn || documentsStore.loading"
      >
        <RefreshCw :class="{ 'animate-spin': documentsStore.loading }" :size="16" />
      </button>
      <button 
        @click="saveCurrentDocument" 
        class="save-btn" 
        title="Gem nuværende dokument"
        :disabled="!isLoggedIn"
      >
        <Save :size="16" />
      </button>
    </div>
  </div>
  
  <div class="documents-list">
    <div 
      v-if="documentsList.length === 0" 
      class="empty-state"
    >
      <template v-if="!isLoggedIn">
        Log ind for at se dine dokumenter
      </template>
      <template v-else>
        Ingen dokumenter endnu.<br>
        Opret dit første dokument!
      </template>
    </div>
    
    <div 
      v-for="document in documentsList" 
      :key="document.id"
      class="document-item"
      :class="{ active: document.id === editorStore.currentDocumentId }"
      @click="loadDocument(document.id)"
    >
      <div class="document-item-content">
        <div class="document-title">{{ document.title || 'Untitled Document' }}</div>
        <div class="document-date">{{ documentsStore.formatDate(document.updatedAt) }}</div>
      </div>
      <div class="document-actions">
        <button 
          class="delete-btn" 
          @click.stop="deleteDocument(document.id)"
          title="Slet dokument"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
  </div>
  
  <button 
    @click="newDocument" 
    class="new-doc-btn"
    :disabled="!isLoggedIn"
  >
    <Plus :size="16" />
    Nyt Dokument
  </button>
</template>

<style scoped>
.sidebar-header {
  padding: 1.25rem 1rem;
  background: #161B22;
  border-bottom: 1px solid #30363D;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
  color: #E6EDF3;
  letter-spacing: -0.01em;
}

.sidebar-actions {
  display: flex;
  gap: 0.5rem;
}

.save-btn {
  background: transparent;
  color: #8B949E;
  border: none;
  padding: 0.375rem 0.625rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  font-weight: 400;
}

.save-btn:hover:not(:disabled) {
  background: #21262D;
  color: #E6EDF3;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.documents-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.empty-state {
  padding: 1rem;
  text-align: center;
  opacity: 0.7;
  font-size: 0.9rem;
  color: #8B949E;
}

.document-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.125rem 0.75rem;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
}

.document-item:hover {
  background: #21262D;
  border-color: #30363D;
}

.document-item.active {
  background: rgba(31, 111, 235, 0.15);
  border-color: #1F6FEB;
  color: #E6EDF3;
}

.document-item-content {
  flex: 1;
  min-width: 0;
}

.document-title {
  font-weight: 500;
  color: #E6EDF3;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-date {
  font-size: 0.75rem;
  color: #8B949E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
  margin-left: 0.5rem;
}

.document-item:hover .document-actions {
  opacity: 1;
}

.delete-btn {
  background: transparent;
  border: none;
  color: #8B949E;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(248, 81, 73, 0.1);
  color: #F85149;
}

.new-doc-btn {
  background: #238636;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  margin: 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  width: calc(100% - 2rem);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.new-doc-btn:hover:not(:disabled) {
  background: #2EA043;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(35, 134, 54, 0.3);
}

.new-doc-btn:disabled {
  background: #30363D;
  color: #8B949E;
  cursor: not-allowed;
}

/* Scrollbar styling */
.documents-list::-webkit-scrollbar {
  width: 6px;
}

.documents-list::-webkit-scrollbar-track {
  background: transparent;
}

.documents-list::-webkit-scrollbar-thumb {
  background: #30363D;
  border-radius: 3px;
}

.documents-list::-webkit-scrollbar-thumb:hover {
  background: #484F58;
}
</style>