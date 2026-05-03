import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Cpu, LayoutDashboard, Layers, TrendingUp, Plus, Sparkles } from 'lucide-react'
import { apiFetch, formatRelativeTime } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { StudioOverview, SynthesisStatus } from '@/lib/types'

const STATUS_COLORS: Record<SynthesisStatus, string> = {
  queued: 'text-[#B38B6D]',
  synthesizing: 'text-[#8A9A8B]',
  completed: 'text-[#6b7a6c]',
  failed: 'text-red-400',
}

const STATUS_LABELS: Record<SynthesisStatus, string> = {
  queued: 'Kernel Latent',
  synthesizing: 'Analyzing...',
  completed: 'Render Complete',
  failed: 'Failed',
}

export default function StudioOverviewPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['studio/overview'],
    queryFn: () => apiFetch<StudioOverview>('/studio/overview', {}, token),
    enabled: !!token,
    refetchInterval: 30_000,
  })

  const STATS = [
    { label: 'KERNELS CREATED', value: data?.kernels_created ?? 0, icon: LayoutDashboard },
    { label: '2D BLUEPRINTS', value: data?.blueprints_generated ?? 0, icon: Layers },
    { label: '3D RENDERS', value: data?.renders_synthesized ?? 0, icon: Cpu },
    { label: 'SYNTHESIS RATE', value: data?.synthesis_rate ?? '—', icon: TrendingUp },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-serif italic text-[#32352C] text-3xl mb-1">Studio Overview</h2>
          <p className="text-[10px] text-[#9a9a8f] tracking-widest uppercase">
            Status of your Architectural Intelligence Network
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/studio/synthesize')}
          className="flex items-center gap-2 bg-[#8A9A8B] text-white px-5 py-2.5 rounded-full text-xs tracking-widest uppercase hover:bg-[#6b7a6c] transition-colors"
        >
          <Plus size={13} />
          Initialize New Synthesis
        </motion.button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 p-5"
          >
            <Icon size={16} className="text-[#8A9A8B] mb-3" />
            <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase mb-2">{label}</p>
            <p className="font-serif text-2xl text-[#32352C]">{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Syntheses */}
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#8A9A8B]">×</span>
            <h3 className="text-[10px] text-[#32352C] tracking-widest uppercase font-medium">
              Recent Syntheses
            </h3>
          </div>
          <div className="space-y-3">
            {(data?.recent_syntheses ?? []).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-[#8A9A8B]/40 transition-colors"
                onClick={() => navigate('/studio/synthesize')}
              >
                <div className="w-9 h-9 rounded-xl bg-[#8A9A8B]/15 flex items-center justify-center shrink-0">
                  <span className="font-serif italic text-[#8A9A8B] text-sm">
                    {s.title[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#32352C] font-medium truncate">{s.title}</p>
                  <p className="text-[10px] text-[#9a9a8f] uppercase tracking-widest">
                    {s.style_category} • {formatRelativeTime(s.created_at)}
                  </p>
                </div>
                <span className={`text-[10px] tracking-widest uppercase ${STATUS_COLORS[s.status]}`}>
                  {STATUS_LABELS[s.status]}
                </span>
              </motion.div>
            ))}
            {!data?.recent_syntheses?.length && (
              <div className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 px-5 py-8 text-center">
                <p className="text-xs text-[#9a9a8f]">No syntheses yet</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Kernel Tip */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[10px] text-[#32352C] tracking-widest uppercase font-medium">
              Architectural Intelligence
            </h3>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 p-5 h-40 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <p className="font-serif italic text-[#32352C] text-lg">Kernel Tip_04</p>
              <Sparkles size={18} className="text-[#8A9A8B]/40" />
            </div>
            <div className="border-t border-[#8A9A8B]/15 pt-3">
              <p className="text-[10px] text-[#9a9a8f] leading-relaxed">
                Open floor plans with defined zones improve spatial efficiency by up to 30% in renders.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
