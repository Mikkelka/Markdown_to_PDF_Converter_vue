// PDF export composable
import { ref } from 'vue'
import html2pdf from 'html2pdf.js'

export function usePdfExport() {
  const isGenerating = ref(false)

  async function generatePDF(htmlContent, filename = 'markdown-dokument') {
    if (!htmlContent || htmlContent.trim() === '') {
      throw new Error('Intet indhold at eksportere')
    }

    isGenerating.value = true

    try {
      // Create a copy of the content for PDF processing
      const element = document.createElement('div')
      element.innerHTML = htmlContent

      // Apply PDF-specific styling for print-friendly version
      element.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      element.style.fontSize = '14px'
      element.style.lineHeight = '1.7'
      element.style.color = '#1A1A1A'
      element.style.padding = '15px'
      element.style.margin = '0'
      element.style.backgroundColor = 'white'
      element.style.width = '100%'
      element.style.maxWidth = '100%'
      element.style.minHeight = '297mm'
      element.style.boxSizing = 'border-box'
      element.style.overflow = 'hidden'

      // Override all dark mode colors to print-friendly colors
      const allElements = element.querySelectorAll('*')
      allElements.forEach(el => {
        el.style.backgroundColor = 'transparent'
        el.style.color = 'inherit'
        el.style.borderColor = '#E5E5E5'
        el.style.boxSizing = 'border-box'
        el.style.maxWidth = '100%'
      })

      // Specific styling for different elements
      const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
      headings.forEach(h => {
        h.style.color = '#1A1A1A'
        h.style.borderBottomColor = '#E5E5E5'
      })

      const paragraphs = element.querySelectorAll('p')
      paragraphs.forEach(p => {
        p.style.color = '#374151'
        p.style.marginBottom = '12px'
      })

      const codeElements = element.querySelectorAll('code')
      codeElements.forEach(code => {
        code.style.backgroundColor = '#F3F4F6'
        code.style.color = '#DC2626'
        code.style.border = '1px solid #E5E7EB'
        code.style.padding = '2px 6px'
        code.style.borderRadius = '3px'
      })

      const preElements = element.querySelectorAll('pre')
      preElements.forEach(pre => {
        pre.style.backgroundColor = '#F8F9FA'
        pre.style.color = '#1A1A1A'
        pre.style.border = '1px solid #E5E7EB'
        pre.style.padding = '10px'
        pre.style.borderRadius = '6px'
        pre.style.maxWidth = '100%'
        pre.style.overflow = 'hidden'
        pre.style.whiteSpace = 'pre-wrap'
        pre.style.wordWrap = 'break-word'
      })

      const preCodeElements = element.querySelectorAll('pre code')
      preCodeElements.forEach(code => {
        code.style.backgroundColor = 'transparent'
        code.style.color = 'inherit'
        code.style.border = 'none'
      })

      const blockquotes = element.querySelectorAll('blockquote')
      blockquotes.forEach(bq => {
        bq.style.backgroundColor = '#F8F9FA'
        bq.style.color = '#4B5563'
        bq.style.borderLeftColor = '#3B82F6'
        bq.style.borderLeft = '3px solid #3B82F6'
      })

      const links = element.querySelectorAll('a')
      links.forEach(a => {
        a.style.color = '#2563EB'
      })

      const tables = element.querySelectorAll('table')
      tables.forEach(table => {
        table.style.backgroundColor = 'white'
      })

      const tableCells = element.querySelectorAll('th, td')
      tableCells.forEach(cell => {
        cell.style.borderColor = '#E5E7EB'
        cell.style.color = '#1A1A1A'
      })

      const tableHeaders = element.querySelectorAll('th')
      tableHeaders.forEach(th => {
        th.style.backgroundColor = '#F9FAFB'
        th.style.color = '#1A1A1A'
      })

      // PDF configuration
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `${filename}-${timestamp}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      }

      // Generate PDF
      await html2pdf().set(opt).from(element).save()
      
    } catch (error) {
      console.error('PDF generation error:', error)
      throw error
    } finally {
      isGenerating.value = false
    }
  }

  return {
    generatePDF,
    isGenerating
  }
}