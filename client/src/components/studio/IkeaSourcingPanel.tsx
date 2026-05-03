import { motion } from 'framer-motion'
import { ShoppingBag, ExternalLink } from 'lucide-react'
import { useKernelStore } from '@/store/useKernelStore'
import { useFurnitureSuggestions } from '@/hooks/useFurnitureSuggestions'
import { useAuth } from '@/hooks/useAuth'

export default function IkeaSourcingPanel() {
  const { styleTokens, currentKernel } = useKernelStore()
  const { token } = useAuth()
  const selectedRoom = currentKernel?.rooms[0]
  const { data: items, isLoading } = useFurnitureSuggestions(
    styleTokens,
    selectedRoom?.type,
    token
  )

  return (
    <div className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag size={13} className="text-[#8A9A8B]" />
        <p className="text-[9px] text-[#32352C] tracking-widest uppercase font-medium">
          IKEA Kuwait Sourcing
        </p>
      </div>

      {isLoading && (
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-20 rounded-xl bg-[#e8e4db] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && items && items.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.slice(0, 5).map((item, i) => (
            <motion.a
              key={item.id}
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="shrink-0 w-44 rounded-xl border border-[#8A9A8B]/15 bg-[#F2EFE8] p-3 hover:border-[#8A9A8B]/40 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[10px] text-[#32352C] font-medium uppercase tracking-wide">{item.series}</p>
                  <p className="text-[10px] text-[#9a9a8f]">{item.category}</p>
                </div>
                <ExternalLink size={10} className="text-[#9a9a8f] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-medium text-[#32352C]">{item.price_kwd} KWD</p>
              {item.match_score !== undefined && (
                <div className="mt-1.5 h-0.5 rounded-full bg-[#e8e4db] overflow-hidden">
                  <div
                    className="h-full bg-[#8A9A8B] rounded-full"
                    style={{ width: `${item.match_score * 100}%` }}
                  />
                </div>
              )}
            </motion.a>
          ))}
        </div>
      )}

      {!isLoading && (!items || items.length === 0) && (
        <p className="text-[10px] text-[#9a9a8f]">Furniture suggestions will appear after synthesis.</p>
      )}
    </div>
  )
}
