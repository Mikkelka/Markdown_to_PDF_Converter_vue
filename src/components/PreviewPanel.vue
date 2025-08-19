<script setup>
import { computed } from 'vue'
import { Download } from 'lucide-vue-next'
import { useEditorStore } from '../stores/editor.js'
import { useAuthStore } from '../stores/auth.js'
import { useMarkdown } from '../composables/useMarkdown.js'
import { usePdfExport } from '../composables/usePdfExport.js'

const editorStore = useEditorStore()
const authStore = useAuthStore()
const { createRenderedHtml } = useMarkdown()
const { generatePDF, isGenerating } = usePdfExport()

// Create reactive HTML from markdown content
const renderedHtml = createRenderedHtml(computed(() => editorStore.content))

// Computed properties
const hasContent = computed(() => {
  return editorStore.content && editorStore.content.trim().length > 0
})

const canDownloadPdf = computed(() => {
  return hasContent.value && !isGenerating.value
})

// Methods
async function downloadPdf() {
  if (!canDownloadPdf.value) return
  
  try {
    await generatePDF(renderedHtml.value, editorStore.title || 'markdown-dokument')
  } catch (error) {
    showError('Der opstod en fejl ved PDF generering. Prøv igen.')
  }
}

function showError(message) {
  // Create temporary notification
  const notification = document.createElement('div')
  notification.textContent = message
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #F85149;
    color: white;
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
  <div class="preview-panel">
    <div class="panel-header">
      <h2>Preview</h2>
      <button
        @click="downloadPdf"
        class="download-btn"
        :disabled="!canDownloadPdf"
        :title="!authStore.isLoggedIn ? 'Log ind for at downloade PDF' : 'Download som PDF'"
      >
        <Download :size="16" v-if="!isGenerating" />
        <span>{{ isGenerating ? 'Genererer PDF...' : 'Download PDF' }}</span>
      </button>
    </div>
    <div class="preview-content" v-html="renderedHtml"></div>
  </div>
</template>

<style scoped>
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0D1117;
}

.panel-header {
  padding: 1rem;
  background: #161B22;
  border-bottom: 1px solid #30363D;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
  color: #E6EDF3;
  letter-spacing: -0.01em;
}

.download-btn {
  background: #238636;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.download-btn:hover:not(:disabled) {
  background: #2EA043;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(35, 134, 54, 0.3);
}

.download-btn:disabled {
  background: #30363D;
  color: #8B949E;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #0D1117;
  color: #E6EDF3;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1.7;
}

/* Scrollbar styling */
.preview-content::-webkit-scrollbar {
  width: 8px;
}

.preview-content::-webkit-scrollbar-track {
  background: #0D1117;
}

.preview-content::-webkit-scrollbar-thumb {
  background: #30363D;
  border-radius: 4px;
}

.preview-content::-webkit-scrollbar-thumb:hover {
  background: #484F58;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .download-btn {
    width: 100%;
  }
  
  .preview-content {
    padding: 1rem;
    font-size: 0.8rem;
  }
}
</style>

<!-- Global styles for preview content -->
<style>
/* Markdown preview styles - these need to be global to affect v-html content */
.preview-content h1,
.preview-content h2,
.preview-content h3,
.preview-content h4,
.preview-content h5,
.preview-content h6 {
  color: #E6EDF3;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  line-height: 1.25;
}

.preview-content h1 {
  font-size: 2rem;
  border-bottom: 1px solid #30363D;
  padding-bottom: 0.5rem;
}

.preview-content h2 {
  font-size: 1.5rem;
  border-bottom: 1px solid #30363D;
  padding-bottom: 0.375rem;
}

.preview-content h3 {
  font-size: 1.25rem;
}

.preview-content h4 {
  font-size: 1rem;
}

.preview-content h5 {
  font-size: 0.875rem;
}

.preview-content h6 {
  font-size: 0.75rem;
}

.preview-content p {
  margin-bottom: 1rem;
  color: #E6EDF3;
}

.preview-content a {
  color: #58A6FF;
  text-decoration: none;
}

.preview-content a:hover {
  text-decoration: underline;
}

.preview-content code {
  background: #21262D;
  color: #F85149;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.8125rem;
}

.preview-content pre {
  background: #161B22;
  border: 1px solid #30363D;
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.preview-content pre code {
  background: transparent;
  color: #E6EDF3;
  padding: 0;
  border-radius: 0;
}

.preview-content blockquote {
  border-left: 3px solid #58A6FF;
  background: #161B22;
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  color: #8B949E;
}

.preview-content ul,
.preview-content ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.preview-content li {
  margin: 0.25rem 0;
}

.preview-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

.preview-content th,
.preview-content td {
  border: 1px solid #30363D;
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.preview-content th {
  background: #161B22;
  font-weight: 600;
}

.preview-content img {
  max-width: 100%;
  height: auto;
}

.preview-content hr {
  border: none;
  height: 1px;
  background: #30363D;
  margin: 2rem 0;
}

.preview-content strong {
  font-weight: 600;
  color: #E6EDF3;
}

.preview-content em {
  font-style: italic;
}
</style>