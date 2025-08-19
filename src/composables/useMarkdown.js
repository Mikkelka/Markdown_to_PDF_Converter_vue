// Markdown processing composable
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'

// Initialize markdown-it with the same settings as original
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
})

export function useMarkdown() {
  // Function to render markdown to HTML
  function renderMarkdown(markdownText) {
    if (!markdownText || typeof markdownText !== 'string') {
      return ''
    }
    
    try {
      return md.render(markdownText)
    } catch (error) {
      console.error('Error rendering markdown:', error)
      return '<p>Error rendering markdown</p>'
    }
  }

  // Function to create a computed HTML property from reactive markdown text
  function createRenderedHtml(markdownText) {
    return computed(() => renderMarkdown(markdownText.value || ''))
  }

  return {
    renderMarkdown,
    createRenderedHtml,
    md
  }
}