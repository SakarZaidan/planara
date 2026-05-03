import { motion } from 'framer-motion'
import { useKernelStore } from '@/store/useKernelStore'
import PromptBar from '@/components/studio/PromptBar'
import BlueprintViewer from '@/components/studio/BlueprintViewer'
import PerspectiveViewer from '@/components/studio/PerspectiveViewer'
import ConsistencyScorePanel from '@/components/studio/ConsistencyScorePanel'
import IkeaSourcingPanel from '@/components/studio/IkeaSourcingPanel'

export default function SynthesisStudioPage() {
  const { currentKernel, synthesisStatus } = useKernelStore()
  const hasContent = !!currentKernel

  return (
    <div className="p-8 flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif italic text-[#32352C] text-3xl mb-1">Synthesis Studio</h2>
          <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase">
            Live Spatial Reconstruction Engine
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentKernel && (
            <span className="text-[10px] text-[#9a9a8f] tracking-widest truncate max-w-48">
              {currentKernel.title}
            </span>
          )}
          <div className={`w-2 h-2 rounded-full ${synthesisStatus === 'stage1' || synthesisStatus === 'stage2' ? 'bg-[#B38B6D] animate-pulse' : 'bg-[#8A9A8B]'}`} />
        </div>
      </div>

      {/* Prompt Bar */}
      <PromptBar />

      {/* Main content */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left: Blueprint */}
        <motion.div
          layout
          className="flex-1"
        >
          <BlueprintViewer />
        </motion.div>

        {/* Right: Perspective */}
        <motion.div
          layout
          className="flex-1"
        >
          <PerspectiveViewer />
        </motion.div>
      </div>

      {/* Bottom panels */}
      {hasContent && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <IkeaSourcingPanel />
          <ConsistencyScorePanel />
        </motion.div>
      )}

      {!hasContent && (
        <ConsistencyScorePanel />
      )}
    </div>
  )
}
