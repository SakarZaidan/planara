import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingBag, ExternalLink, ChevronDown, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCatalog } from '@/hooks/useCatalog'
import { apiFetch } from '@/lib/utils'
import type { IkeaItem } from '@/lib/types'

const CATEGORIES = ['All', 'Sofa', 'Bed', 'Dining Table', 'Wardrobe', 'Coffee Table', 'Armchair', 'Office Chair', 'TV & Storage']
const STYLES = ['All', 'Scandinavian', 'Modern', 'Minimalist', 'Natural', 'Classic', 'Industrial', 'Rustic', 'Glamour', 'Luxe', 'Bohemian']

function FurnitureCard({ item, index }: { item: IkeaItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 overflow-hidden hover:border-[#8A9A8B]/40 transition-colors group"
    >
      <div className="h-44 bg-[#e8e4db] overflow-hidden relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const img = e.currentTarget
              img.style.display = 'none'
              const fallback = img.nextElementSibling as HTMLElement | null
              if (fallback) fallback.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="w-full h-full items-center justify-center flex-col gap-2"
          style={{ display: item.image_url ? 'none' : 'flex' }}
        >
          <ShoppingBag size={28} className="text-[#8A9A8B]/30" />
          <span className="text-[9px] text-[#9a9a8f] tracking-widest uppercase">{item.category}</span>
        </div>
        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="text-[10px] font-medium text-[#32352C] tracking-wide">{item.price_kwd.toFixed(3)} KWD</span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase mb-0.5">{item.series}</p>
        <h3 className="font-serif italic text-[#32352C] text-base mb-1 truncate">{item.name}</h3>
        <p className="text-[10px] text-[#9a9a8f] mb-3 truncate">{item.category}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {(item.style_tags ?? []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#8A9A8B]/10 text-[#6b7a6c]"
            >
              {tag}
            </span>
          ))}
        </div>

        <a
          href={item.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full text-[10px] tracking-widest uppercase bg-[#8A9A8B]/10 text-[#6b7a6c] py-1.5 rounded-full hover:bg-[#8A9A8B] hover:text-white transition-colors"
        >
          View on IKEA
          <ExternalLink size={10} />
        </a>
      </div>
    </motion.div>
  )
}

export default function CatalogPage() {
  const { token } = useAuth()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeStyle, setActiveStyle] = useState('All')
  const [offset, setOffset] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try { await apiFetch('/furniture/scrape?seed=true', { method: 'POST' }, token) } catch { /* ignore */ }
    finally { setSyncing(false); window.location.reload() }
  }

  const filters = {
    category: activeCategory === 'All' ? undefined : activeCategory,
    style: activeStyle === 'All' ? undefined : activeStyle,
    search: search || undefined,
    offset,
    limit: 20,
  }

  const { data, isLoading } = useCatalog(filters, token)
  const items = data?.items ?? []
  const totalCount = data?.total_count ?? 0
  const hasMore = offset + 20 < totalCount

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value)
    setOffset(0)
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-serif italic text-[#32352C] text-3xl mb-1">Furniture Catalog</h2>
          <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase">
            IKEA Kuwait Collection · {totalCount} Items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a8f]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
              placeholder="Search furniture..."
              className="pl-8 pr-4 py-2 rounded-xl border border-[#8A9A8B]/20 bg-white/70 text-xs text-[#32352C] outline-none focus:border-[#8A9A8B] placeholder:text-[#b0ada6] transition-colors"
            />
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Re-seed catalog from IKEA Kuwait"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#8A9A8B]/20 bg-white/70 text-[9px] tracking-widest uppercase text-[#9a9a8f] hover:border-[#8A9A8B]/50 disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
            Sync
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-3">
        <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase mb-2">Category</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilterChange(setActiveCategory, cat)}
              className={`text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full transition-colors ${
                activeCategory === cat
                  ? 'bg-[#8A9A8B] text-white'
                  : 'bg-white/70 text-[#9a9a8f] border border-[#8A9A8B]/20 hover:border-[#8A9A8B]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Style filter */}
      <div className="mb-8">
        <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase mb-2">Style</p>
        <div className="flex flex-wrap gap-1.5">
          {STYLES.map((style) => (
            <button
              key={style}
              onClick={() => handleFilterChange(setActiveStyle, style)}
              className={`text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full transition-colors ${
                activeStyle === style
                  ? 'bg-[#B38B6D] text-white'
                  : 'bg-white/70 text-[#9a9a8f] border border-[#8A9A8B]/20 hover:border-[#8A9A8B]/50'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-4 gap-5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-[#e8e4db] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#8A9A8B]/10 flex items-center justify-center">
            <ShoppingBag size={22} className="text-[#8A9A8B]/50" />
          </div>
          <p className="text-sm text-[#9a9a8f]">No furniture found</p>
          <p className="text-xs text-[#b0ada6]">Try different filters or run the catalog sync</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && items.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-5">
            <AnimatePresence>
              {items.map((item, i) => (
                <FurnitureCard key={item.id} item={item} index={i} />
              ))}
            </AnimatePresence>
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setOffset((o) => o + 20)}
                className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-[#9a9a8f] border border-[#8A9A8B]/20 px-6 py-2.5 rounded-full hover:border-[#8A9A8B]/50 hover:text-[#32352C] transition-colors"
              >
                Load More
                <ChevronDown size={11} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
