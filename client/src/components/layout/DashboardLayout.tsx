import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F2EFE8]">
        <div className="w-6 h-6 rounded-full border-2 border-[#8A9A8B] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />

  return (
    <div className="flex h-screen bg-[#F2EFE8] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
