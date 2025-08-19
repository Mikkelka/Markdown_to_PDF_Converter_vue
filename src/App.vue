<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/auth.js'
import { useDocumentsStore } from './stores/documents.js'
import { useEditorStore } from './stores/editor.js'

import DocumentSidebar from './components/DocumentSidebar.vue'
import MarkdownEditor from './components/MarkdownEditor.vue'
import PreviewPanel from './components/PreviewPanel.vue'
import AuthHeader from './components/AuthHeader.vue'

// Initialize stores
const authStore = useAuthStore()
const documentsStore = useDocumentsStore()
const editorStore = useEditorStore()

// Computed properties

// Initialize app
onMounted(async () => {
  // Initialize authentication
  await authStore.initAuth()
  
  // Load documents if user is logged in
  if (authStore.isLoggedIn) {
    await documentsStore.loadDocuments()
  }
  
  // Start auto-save
  editorStore.startAutoSave()
})

onUnmounted(() => {
  // Clean up auto-save
  editorStore.stopAutoSave()
})

// Handle auth state changes
authStore.$subscribe(async (mutation, state) => {
  console.warn('Auth state changed:', state.isLoggedIn, state.isInitialized)
  
  if (state.isLoggedIn && state.isInitialized && state.currentUser) {
    // User logged in with user data available
    console.warn('User logged in, loading documents...')
    await documentsStore.loadDocuments()
    editorStore.newDocument()
  } else if (!state.isLoggedIn && state.isInitialized) {
    // User logged out
    console.warn('User logged out, clearing documents...')
    documentsStore.clearDocuments()
    editorStore.newDocument()
  }
})
</script>

<template>
  <div class="container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <DocumentSidebar />
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Header -->
      <AuthHeader />
      
      <!-- Editor Container -->
      <div class="editor-container">
        <MarkdownEditor />
        <PreviewPanel />
      </div>
    </main>

  </div>
</template>

<style scoped>
.container {
  max-width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: row;
}

.sidebar {
  width: 260px;
  background: #161B22;
  color: #E6EDF3;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #30363D;
  transition: all 0.2s ease;
}


.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0D1117;
  overflow: hidden;
}

.editor-container {
  flex: 1;
  display: flex;
  gap: 1px;
  overflow: hidden;
}

/* Responsive design */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    max-height: 50vh;
  }
  
  
  .editor-container {
    flex-direction: column;
  }
}
</style>
