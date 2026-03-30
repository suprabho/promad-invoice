import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const SCALE = 2 // retina quality

async function captureElement(elementId) {
  const el = document.getElementById(elementId)
  if (!el) throw new Error('Invoice canvas element not found')

  const canvas = await html2canvas(el, {
    scale: SCALE,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  return canvas
}

export async function downloadAsJpeg(elementId, filename) {
  const canvas = await captureElement(elementId)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${filename}.jpg`
  link.click()
}

export async function downloadAsPdf(elementId, filename) {
  const canvas = await captureElement(elementId)
  const imgData = canvas.toDataURL('image/jpeg', 0.95)

  // A4 dimensions in mm
  const pdfWidth = 210
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width

  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  })

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
  pdf.save(`${filename}.pdf`)
}
