import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Box, Cpu, Layers } from 'lucide-react'

const PILLARS = [
  {
    icon: Layers,
    title: '2D Blueprinting',
    desc: 'Generated high-fidelity technical drawings mapped from structured spatial reasoning.',
  },
  {
    icon: Box,
    title: '3D Atmosphere',
    desc: 'Photorealistic interior renders tailored to your specific material and lighting tokens.',
  },
  {
    icon: Cpu,
    title: 'Optimization Engine',
    desc: 'AI-driven refinement loops that suggest structural and aesthetic improvements.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F2EFE8] flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-10 py-6">
        <span className="font-serif italic text-[#32352C] text-lg">Planara</span>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => navigate('/auth')}
            className="text-xs text-[#9a9a8f] tracking-widest uppercase hover:text-[#32352C] transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="text-xs bg-[#32352C] text-[#F2EFE8] px-5 py-2.5 rounded-full tracking-widest uppercase hover:bg-[#8A9A8B] transition-colors"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center px-10 py-16">
        <div className="max-w-xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] text-[#9a9a8f] tracking-[0.25em] uppercase mb-6"
          >
            Bespoke Architectural Synthesis
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-6xl leading-tight text-[#32352C] mb-4"
          >
            Spaces<br />
            <em className="text-[#B38B6D]">Imagined</em><br />
            Precisely.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-[#9a9a8f] leading-relaxed mb-8 max-w-sm"
          >
            Transform your most ambitious architectural visions into structured blueprints and photorealistic 3D environments with our multi-stage AI reasoning kernel.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-6"
          >
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 bg-[#32352C] text-[#F2EFE8] px-6 py-3 rounded-full text-xs tracking-widest uppercase hover:bg-[#8A9A8B] transition-colors"
            >
              Synthesize Vision
              <ArrowRight size={14} />
            </button>
            <span className="text-[10px] text-[#9a9a8f] tracking-widest">1,204 USERS</span>
          </motion.div>
        </div>

        {/* Blueprint preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="flex-1 ml-16 hidden lg:flex items-center justify-center"
        >
          <img
            src="/blueprint-landpage.jpg"
            alt="Blueprint Preview"
            className="w-full max-w-lg rounded-3xl border border-[#8A9A8B]/20 object-cover shadow-sm"
          />
        </motion.div>
      </section>

      {/* Pillars */}
      <section className="px-10 py-16 border-t border-[#8A9A8B]/10">
        <div className="grid grid-cols-3 gap-8 max-w-4xl">
          {PILLARS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <div className="w-8 h-8 rounded-lg bg-[#8A9A8B]/15 flex items-center justify-center mb-4">
                <Icon size={14} className="text-[#8A9A8B]" />
              </div>
              <h3 className="font-serif italic text-[#32352C] text-lg mb-2">{title}</h3>
              <p className="text-xs text-[#9a9a8f] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
