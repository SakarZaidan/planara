import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Tab = 'login' | 'register'

export default function AuthPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      navigate('/studio/overview')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2EFE8] flex flex-col items-center justify-center px-4">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-xs text-[#9a9a8f] tracking-widest uppercase hover:text-[#32352C] transition-colors"
      >
        <ArrowLeft size={12} />
        Return to Studio
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-serif italic text-[#32352C] text-3xl mb-1">Planara</h1>
        <p className="text-[10px] text-[#9a9a8f] tracking-[0.25em] uppercase">Secure Architecture Portal</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-2xl border border-[#8A9A8B]/20 p-8 shadow-sm"
      >
        {/* Tabs */}
        <div className="flex gap-6 mb-7 border-b border-[#e8e4db]">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-xs tracking-widest uppercase font-medium transition-colors ${
                tab === t
                  ? 'text-[#32352C] border-b-2 border-[#32352C] -mb-px'
                  : 'text-[#9a9a8f]'
              }`}
            >
              {t === 'login' ? 'Log In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[10px] text-[#9a9a8f] tracking-widest uppercase mb-1.5">
              Studio Email
            </label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a8f]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@planara.studio"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#e8e4db] bg-[#F2EFE8]/50 text-sm text-[#32352C] placeholder:text-[#c0bdb6] outline-none focus:border-[#8A9A8B] transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-[#9a9a8f] tracking-widest uppercase">
                Access Key
              </label>
              {tab === 'login' && (
                <button type="button" className="text-[10px] text-[#B38B6D] tracking-widest uppercase hover:opacity-70 transition-opacity">
                  Forgot Key?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a8f]" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#e8e4db] bg-[#F2EFE8]/50 text-sm text-[#32352C] placeholder:text-[#c0bdb6] outline-none focus:border-[#8A9A8B] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a8f] hover:text-[#32352C] transition-colors"
              >
                {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8A9A8B] text-white py-3 rounded-full text-xs tracking-widest uppercase font-medium hover:bg-[#6b7a6c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <>Enter Studio ›</>
            )}
          </button>
        </form>
      </motion.div>

      <p className="mt-6 text-[10px] text-[#9a9a8f] tracking-widest">
        Identity verified via Secure Channel v2.44
      </p>
    </div>
  )
}
