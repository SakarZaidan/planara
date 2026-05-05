import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Trash2, FolderOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLibrary, useDeleteProject } from '@/hooks/useLibrary'
import { useKernelStore } from '@/store/useKernelStore'
import { formatRelativeTime } from '@/lib/utils'
import type { LibraryItem } from '@/lib/types'

export default function LibraryPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useLibrary(token)
  const deleteProject = useDeleteProject(token)
  const { setKernel, setBlueprintUrl, setProjectId, setStyleTokens } = useKernelStore()
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const items = (data?.items ?? []).filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.style_category.toLowerCase().includes(search.toLowerCase())
  )

  const handleLoad = (item: LibraryItem) => {
    // Hydrate the kernel store with library item data
    setProjectId(item.id)
    setStyleTokens(item.style_seeds)
    if (item.thumbnail) setBlueprintUrl(item.thumbnail)
    navigate('/studio/synthesize')
  }

  const handleDelete = (id: string) => {
    deleteProject.mutate(id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-serif italic text-[#32352C] text-3xl mb-1">Archive</h2>
          <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase">
            Your Synthesized Spatial Library
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a8f]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search archive..."
              className="pl-8 pr-4 py-2 rounded-xl border border-[#8A9A8B]/20 bg-white/70 text-xs text-[#32352C] outline-none focus:border-[#8A9A8B] placeholder:text-[#b0ada6] transition-colors"
            />
          </div>
          <button className="w-8 h-8 rounded-xl border border-[#8A9A8B]/20 bg-white/70 flex items-center justify-center hover:border-[#8A9A8B]/50 transition-colors">
            <Filter size={13} className="text-[#9a9a8f]" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-60 rounded-2xl bg-[#e8e4db] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#8A9A8B]/10 flex items-center justify-center">
            <FolderOpen size={22} className="text-[#8A9A8B]/50" />
          </div>
          <p className="text-sm text-[#9a9a8f]">No archived projects yet</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-5">
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              layoutId={`project-card-${item.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 overflow-hidden hover:border-[#8A9A8B]/40 transition-colors group"
            >
              {/* Thumbnail */}
              <div className="h-40 bg-[#e8e4db] overflow-hidden relative">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
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
                  className="w-full h-full items-center justify-center"
                  style={{ display: item.thumbnail ? 'none' : 'flex' }}
                >
                  <span className="font-serif italic text-4xl text-[#8A9A8B]/30">
                    {item.title[0]}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-serif italic text-[#32352C] text-base mb-0.5 truncate">
                  {item.title}
                </h3>
                <p className="text-[10px] text-[#9a9a8f] tracking-widest uppercase mb-0.5">
                  {item.style_category}
                </p>
                <p className="text-[10px] text-[#9a9a8f] mb-4">
                  {formatRelativeTime(item.created_at)}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoad(item)}
                    className="flex-1 text-[10px] tracking-widest uppercase bg-[#8A9A8B]/10 text-[#6b7a6c] py-1.5 rounded-full hover:bg-[#8A9A8B] hover:text-white transition-colors"
                  >
                    Load Kernel
                  </button>
                  <button
                    onClick={() => setConfirmDelete(item.id)}
                    className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={11} className="text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#32352C]/30 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#F2EFE8] rounded-2xl border border-[#8A9A8B]/20 p-6 max-w-sm w-full mx-4"
            >
              <h3 className="font-serif italic text-[#32352C] text-xl mb-2">Delete Project?</h3>
              <p className="text-xs text-[#9a9a8f] mb-6">
                This will permanently delete the project and all associated renders.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 rounded-full border border-[#8A9A8B]/20 text-xs text-[#9a9a8f] hover:border-[#8A9A8B]/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2 rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
