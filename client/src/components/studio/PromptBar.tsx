import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2 } from 'lucide-react'
import { useKernelStore } from '@/store/useKernelStore'
import { useSynthesis } from '@/hooks/useSynthesis'
import { useAuth } from '@/hooks/useAuth'

const STAGE_LABELS = {
  idle: '',
  stage1: 'Parsing spatial data...',
  stage2: 'Drafting blueprint...',
  stage3: 'Rendering 3D...',
  complete: 'Synthesis complete',
  error: 'Synthesis failed',
}

export default function PromptBar() {
  const [prompt, setPrompt] = useState('')
  const { synthesisStatus } = useKernelStore()
  const { token } = useAuth()
  const synthesis = useSynthesis(token)

  const isLoading = ['stage1', 'stage2'].includes(synthesisStatus)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isLoading) return
    if (prompt.length > 800) return
    synthesis.mutate(prompt.trim())
  }

  return (
    <div className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 p-5">
      <p className="text-[9px] text-[#9a9a8f] tracking-[0.2em] uppercase mb-3">
        Initialize Architectural Prompt
      </p>
      <form onSubmit={handleSubmit} className="flex gap-3 items-center">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your vision (e.g., A Scandinavian minimalist loft...)"
          disabled={isLoading}
          maxLength={800}
          className="flex-1 bg-[#F2EFE8]/60 border border-[#e8e4db] rounded-xl px-4 py-2.5 text-sm text-[#32352C] placeholder:text-[#b0ad a6] outline-none focus:border-[#8A9A8B] transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="flex items-center gap-2 bg-[#32352C] text-[#F2EFE8] px-5 py-2.5 rounded-full text-xs tracking-widest uppercase hover:bg-[#8A9A8B] transition-colors disabled:opacity-50 shrink-0"
        >
          {isLoading ? (
            <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : (
            <Wand2 size={12} />
          )}
          Synthesize
        </button>
      </form>

      <AnimatePresence>
        {synthesisStatus !== 'idle' && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] text-[#8A9A8B] tracking-widest mt-2"
          >
            {STAGE_LABELS[synthesisStatus]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
