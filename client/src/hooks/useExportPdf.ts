import jsPDF from 'jspdf'
import { useKernelStore } from '@/store/useKernelStore'

export function useExportPdf() {
  const { currentKernel, blueprintUrl } = useKernelStore()

  const exportSynthesisPdf = async (filename: string) => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = 297
    const pageH = 210
    const margin = 12

    // Title
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(20)
    pdf.text(currentKernel?.title ?? 'Planara Blueprint', margin, margin + 8)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(154, 154, 143)
    pdf.text((currentKernel?.style_category ?? '').toUpperCase(), margin, margin + 14)
    pdf.setTextColor(50, 53, 44)

    let y = margin + 22

    // Blueprint image
    if (blueprintUrl) {
      try {
        const resp = await fetch(blueprintUrl)
        const blob = await resp.blob()
        const b64 = await blobToBase64(blob)
        const imgW = pageW / 2 - margin * 1.5
        const imgH = imgW * (2 / 3)
        pdf.addImage(b64, 'PNG', margin, y, imgW, imgH)
      } catch {
        pdf.setFontSize(9)
        pdf.setTextColor(154, 154, 143)
        pdf.text('Blueprint image unavailable', margin, y + 6)
        pdf.setTextColor(50, 53, 44)
      }
    }

    // Room list
    if (currentKernel?.rooms?.length) {
      const colX = pageW / 2 + margin / 2
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('Rooms', colX, y + 8)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      currentKernel.rooms.forEach((room, i) => {
        const ry = y + 16 + i * 8
        if (ry < pageH - margin) {
          pdf.text(`${room.name}`, colX, ry)
          pdf.setTextColor(154, 154, 143)
          pdf.text(`${room.dimensions.width}m × ${room.dimensions.length}m`, colX + 50, ry)
          pdf.setTextColor(50, 53, 44)
        }
      })
    }

    // Style tokens
    if (currentKernel?.style_seeds?.length) {
      pdf.setFontSize(7)
      pdf.setTextColor(154, 154, 143)
      pdf.text('Style: ' + currentKernel.style_seeds.join(' · '), margin, pageH - margin)
      pdf.setTextColor(50, 53, 44)
    }

    pdf.save(filename)
  }

  return { exportSynthesisPdf }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
