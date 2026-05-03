import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Box, RefreshCw } from 'lucide-react'
import { useKernelStore } from '@/store/useKernelStore'
import { useRoomRender } from '@/hooks/useRoomRender'
import { useAuth } from '@/hooks/useAuth'

export default function PerspectiveViewer() {
  const { selectedRoomId, projectId, currentKernel, renders } = useKernelStore()
  const { token } = useAuth()
  const { renderMutation } = useRoomRender(selectedRoomId, projectId, token)

  const selectedRoom = currentKernel?.rooms.find((r) => r.id === selectedRoomId)
  const cachedRender = selectedRoomId ? renders[selectedRoomId] : undefined

  const isRendering = renderMutation.isPending
  const renderError = renderMutation.error as { error?: { code?: string; message?: string } } | null
  const isUnavailable = renderError?.error?.code === 'RENDER_UNAVAILABLE'

  // Fire once per room selection when no cached render exists yet.
  const lastTriggeredRef = useRef<string | null>(null)
  useEffect(() => {
    if (!selectedRoomId || !projectId) return
    if (lastTriggeredRef.current === selectedRoomId) return
    if (cachedRender) return
    if (renderMutation.isPending) return
    lastTriggeredRef.current = selectedRoomId
    renderMutation.mutate()
  }, [selectedRoomId, projectId, cachedRender, renderMutation])

  return (
    <div className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 p-5 flex flex-col h-full">

      {/* Empty state — no room selected */}
      {!selectedRoomId && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[320px]">
          <div className="w-10 h-10 rounded-full bg-[#8A9A8B]/10 flex items-center justify-center">
            <Box size={18} className="text-[#8A9A8B]/40" />
          </div>
          <p className="text-xs text-[#9a9a8f] text-center max-w-[200px] leading-relaxed">
            Select a room below the blueprint to generate a photorealistic 3D render.
          </p>
        </div>
      )}

      {/* Room selected */}
      {selectedRoomId && selectedRoom && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <p className="text-sm text-[#32352C] font-medium">{selectedRoom.name}</p>
              <p className="text-[10px] text-[#9a9a8f] tracking-widest uppercase">
                {selectedRoom.dimensions.width}m × {selectedRoom.dimensions.length}m · {selectedRoom.type.replace('_', ' ')}
              </p>
            </div>
            {!isRendering && cachedRender && (
              <button
                onClick={() => renderMutation.mutate()}
                className="flex items-center gap-1.5 text-[#8A9A8B] px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase hover:bg-[#8A9A8B]/10 border border-[#8A9A8B]/30 transition-colors"
              >
                <RefreshCw size={10} />
                Re-render
              </button>
            )}
          </div>

          {/* Render canvas */}
          <div className="flex-1 relative rounded-xl overflow-hidden bg-[#F2EFE8] min-h-[260px]">
            <AnimatePresence mode="wait">

              {/* Loading */}
              {isRendering && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-[#8A9A8B]/40 border-t-[#8A9A8B] animate-spin" />
                  <p className="text-[10px] text-[#9a9a8f] tracking-widest uppercase">
                    Deep 3D Synthesis...
                  </p>
                </motion.div>
              )}

              {/* Render ready */}
              {!isRendering && cachedRender && (
                <motion.img
                  key={cachedRender.render_url}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  src={cachedRender.render_url}
                  alt={`3D render — ${selectedRoom.name}`}
                  className="w-full h-full object-cover"
                />
              )}

              {/* API key / org verification error */}
              {!isRendering && !cachedRender && isUnavailable && (
                <motion.div
                  key="unavailable"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center"
                >
                  <p className="text-[10px] text-[#B38B6D] tracking-widest uppercase">
                    Render unavailable
                  </p>
                  <p className="text-[10px] text-[#9a9a8f] leading-relaxed max-w-[260px]">
                    Gemini image generation failed. Check your API key or try again.
                  </p>
                  <button
                    onClick={() => renderMutation.mutate()}
                    className="mt-2 text-[10px] tracking-widest uppercase text-[#8A9A8B] hover:underline"
                  >
                    Retry
                  </button>
                </motion.div>
              )}

              {/* Generic error */}
              {!isRendering && !cachedRender && !isUnavailable && renderError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center"
                >
                  <p className="text-[10px] text-[#B38B6D] tracking-widest uppercase">
                    Render failed
                  </p>
                  <p className="text-[10px] text-[#9a9a8f] leading-relaxed max-w-[260px]">
                    {renderError.error?.message ?? 'An error occurred during 3D synthesis.'}
                  </p>
                  <button
                    onClick={() => renderMutation.mutate()}
                    className="mt-2 text-[10px] tracking-widest uppercase text-[#8A9A8B] hover:underline"
                  >
                    Retry
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Insights */}
          {cachedRender?.architectural_observations && cachedRender.architectural_observations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-1.5 flex-shrink-0"
            >
              {cachedRender.architectural_observations.slice(0, 2).map((insight, i) => (
                <p key={i} className="text-[10px] text-[#9a9a8f] leading-relaxed border-l-2 border-[#8A9A8B]/30 pl-2">
                  {insight}
                </p>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
