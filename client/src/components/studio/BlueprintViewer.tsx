import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'
import { useKernelStore } from '@/store/useKernelStore'
import { cn } from '@/lib/utils'

export default function BlueprintViewer() {
  const { blueprintUrl, currentKernel, selectedRoomId, selectRoom, synthesisStatus, renders } = useKernelStore()

  const isLoading = synthesisStatus === 'stage1' || synthesisStatus === 'stage2'

  return (
    <div className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 p-5 flex flex-col h-full gap-4">

      {/* Panel header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Compass size={13} className="text-[#8A9A8B]" />
          <span className="text-[9px] text-[#32352C] tracking-widest uppercase font-medium">
            Vector Blueprint
          </span>
        </div>
        <span className="text-[9px] text-[#9a9a8f] tracking-widest">INSTANCE_01</span>
      </div>

      {/* Image area — clean, no overlays */}
      <div className="flex-1 relative rounded-xl overflow-hidden bg-[#F2EFE8] border border-[#8A9A8B]/10 min-h-[220px]">

        {/* Synthesizing spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#8A9A8B]/40 border-t-[#8A9A8B] animate-spin" />
            <p className="text-[10px] text-[#9a9a8f] tracking-widest uppercase">Synthesizing...</p>
          </div>
        )}

        {/* Blueprint image — no room labels overlaid */}
        {!isLoading && blueprintUrl && (
          <img
            src={blueprintUrl}
            alt="Architectural Blueprint"
            className="w-full h-full object-contain"
          />
        )}

        {/* Kernel exists but image gen failed (API quota) — show text summary */}
        {!isLoading && !blueprintUrl && currentKernel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <p className="text-[9px] text-[#B38B6D] tracking-widest uppercase mb-1">
              Spatial kernel ready · No blueprint image
            </p>
            <p className="text-[10px] text-[#9a9a8f] text-center max-w-[220px] leading-relaxed">
              Blueprint image generation failed. Check your Gemini API key in appsettings.
              Select a room below to start 3D synthesis.
            </p>
          </div>
        )}

        {/* Idle empty state */}
        {!isLoading && !blueprintUrl && !currentKernel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#8A9A8B]/10 flex items-center justify-center">
              <Compass size={18} className="text-[#8A9A8B]/40" />
            </div>
            <p className="text-[10px] text-[#9a9a8f] tracking-widest uppercase">Ready for Injection</p>
          </div>
        )}
      </div>

      {/* Room chips — below the image, single scrollable row */}
      {currentKernel && currentKernel.rooms.length > 0 && (
        <div className="flex-shrink-0">
          <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase mb-2">
            Select a room to render
          </p>
          <div className="flex flex-wrap gap-2">
            {currentKernel.rooms.map((room) => {
              const hasRender = !!renders[room.id]
              const isSelected = room.id === selectedRoomId
              return (
                <motion.button
                  key={room.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => selectRoom(isSelected ? null : room.id)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-[10px] tracking-wide border transition-all text-left relative',
                    isSelected
                      ? 'bg-[#8A9A8B] text-white border-[#8A9A8B] shadow-sm'
                      : 'bg-white/80 text-[#32352C] border-[#8A9A8B]/20 hover:border-[#8A9A8B]/50'
                  )}
                >
                  <p className="font-medium leading-tight">{room.name}</p>
                  <p className={cn('text-[9px] mt-0.5', isSelected ? 'text-white/70' : 'opacity-50')}>
                    {room.dimensions.width}×{room.dimensions.length}m
                  </p>
                  {/* Dot indicator when render is cached */}
                  {hasRender && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#8A9A8B]" />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* Style tokens */}
      {currentKernel?.style_seeds && currentKernel.style_seeds.length > 0 && (
        <div className="flex-shrink-0 pt-3 border-t border-[#8A9A8B]/10">
          <p className="text-[9px] text-[#32352C] tracking-widest uppercase font-medium mb-2">
            Style Tokens
          </p>
          <div className="flex flex-wrap gap-1.5">
            {currentKernel.style_seeds.map((seed) => (
              <motion.span
                key={seed}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#8A9A8B]/10 text-[#6b7a6c] border border-[#8A9A8B]/20"
              >
                {seed}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
