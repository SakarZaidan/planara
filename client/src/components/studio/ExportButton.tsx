import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useExportPdf } from '@/hooks/useExportPdf'

interface Props {
  filename: string
}

export default function ExportButton({ filename }: Props) {
  const { exportSynthesisPdf } = useExportPdf()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await exportSynthesisPdf(filename)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 border border-[#8A9A8B]/20 text-[#9a9a8f] px-4 py-2 rounded-full text-[10px] tracking-widest uppercase hover:border-[#8A9A8B] hover:text-[#32352C] transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
      Export PDF
    </button>
  )
}
