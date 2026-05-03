import { motion } from 'framer-motion'
import { Cpu } from 'lucide-react'
import { useKernelStore } from '@/store/useKernelStore'

export default function ConsistencyScorePanel() {
  const { selectedRoomId, renders } = useKernelStore()
  const score = (selectedRoomId ? renders[selectedRoomId]?.consistency_integrity_score : undefined) ?? 100

  return (
    <div className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 px-5 py-3 flex items-center gap-4">
      <Cpu size={14} className="text-[#8A9A8B] shrink-0" />
      <div className="flex-1">
        <p className="text-[9px] text-[#32352C] tracking-widest uppercase font-medium mb-1">
          Consistency Intelligence
        </p>
        <p className="text-[10px] text-[#9a9a8f] leading-snug">
          Spatial dimensions and material tokens are mathematically synced between the 2D draft and 3D render.
        </p>
        <div className="mt-2 h-1 rounded-full bg-[#e8e4db] overflow-hidden">
          <motion.div
            className="h-full bg-[#8A9A8B] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
      <span className="text-[10px] text-[#9a9a8f] tracking-widest shrink-0">
        Integrity: {score}%
      </span>
    </div>
  )
}
