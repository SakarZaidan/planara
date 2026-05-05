import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Wand2, BookOpen, Settings, ChevronLeft, ShoppingBag, PenTool } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/studio/overview', label: 'OVERVIEW', icon: LayoutDashboard },
  { to: '/studio/synthesize', label: 'STUDIO', icon: Wand2 },
  { to: '/studio/canvas', label: 'CANVAS', icon: PenTool },
  { to: '/studio/catalog', label: 'CATALOG', icon: ShoppingBag },
  { to: '/studio/library', label: 'LIBRARY', icon: BookOpen },
  { to: '/studio/settings', label: 'SETTINGS', icon: Settings },
]

export default function Sidebar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-44 shrink-0 flex flex-col py-6 px-4 border-r border-[#8A9A8B]/15"
      style={{ background: '#F2EFE8' }}
    >
      <div className="mb-8">
        <h1 className="font-serif italic text-[#32352C] text-lg leading-tight">Planara</h1>
        <p className="text-[10px] text-[#9a9a8f] tracking-widest uppercase mt-0.5">Interface v4.2.0</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs tracking-widest font-medium uppercase transition-all',
                isActive
                  ? 'bg-[#8A9A8B] text-white'
                  : 'text-[#9a9a8f] hover:text-[#32352C] hover:bg-[#8A9A8B]/10'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={13} className={isActive ? 'text-white' : ''} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#8A9A8B]/15 pt-4">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-[#9a9a8f] hover:text-[#32352C] tracking-widest uppercase transition-colors px-3 py-2"
        >
          <ChevronLeft size={12} />
          SIGN OUT
        </button>
      </div>
    </motion.aside>
  )
}
