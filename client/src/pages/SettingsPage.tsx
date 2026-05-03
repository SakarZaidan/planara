import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Shield, CreditCard, Bell, Key, Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import type { UserProfile } from '@/lib/types'

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API & Kernel', icon: Key },
]

export default function SettingsPage() {
  const { token, session } = useAuth()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  // Profile tab state
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch<UserProfile>('/studio/profile', {}, token),
    enabled: !!token,
  })

  const [form, setForm] = useState({
    display_name: profile?.display_name ?? '',
    bio: profile?.bio_design_philosophy ?? '',
    deep_neural: profile?.settings.deep_neural_rendering ?? true,
    auto_insight: profile?.settings.auto_insight_generation ?? false,
  })

  const updateSettings = useMutation({
    mutationFn: () =>
      apiFetch(
        '/studio/settings',
        {
          method: 'PATCH',
          body: JSON.stringify({
            display_name: form.display_name,
            design_philosophy: form.bio,
            preferences: {
              deep_neural_rendering: form.deep_neural,
              auto_insight_generation: form.auto_insight,
            },
          }),
        },
        token
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  // Security tab state
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' })
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwStatus, setPwStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [pwError, setPwError] = useState<string | null>(null)

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Passwords don't match")
      return
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Minimum 6 characters required')
      return
    }
    setPwStatus('loading')
    setPwError(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword })
      if (error) throw error
      setPwStatus('success')
      setPwForm({ newPassword: '', confirmPassword: '' })
      setTimeout(() => setPwStatus('idle'), 3000)
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password')
      setPwStatus('error')
      setTimeout(() => setPwStatus('idle'), 3000)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="font-serif italic text-[#32352C] text-3xl mb-1">Studio Settings</h2>
        <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase">
          Configure your Architectural Synthesis Environment
        </p>
      </div>

      <div className="flex gap-6">
        {/* Settings nav */}
        <div className="w-40 shrink-0">
          {SETTINGS_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs tracking-wide transition-all mb-1 ${
                activeTab === id
                  ? 'bg-[#8A9A8B] text-white'
                  : 'text-[#9a9a8f] hover:text-[#32352C] hover:bg-[#8A9A8B]/10'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">

          {/* ── Profile ── */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 p-6">
                <h3 className="text-[10px] text-[#32352C] tracking-widest uppercase font-medium mb-5">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] text-[#9a9a8f] tracking-widest uppercase mb-1.5">
                      Display Name
                    </label>
                    <input
                      value={form.display_name}
                      onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                      placeholder="Le Corbusier"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-[#F2EFE8]/50 text-sm text-[#32352C] outline-none focus:border-[#8A9A8B] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#9a9a8f] tracking-widest uppercase mb-1.5">
                      Architect ID
                    </label>
                    <input
                      value={profile?.architect_id ?? ''}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-[#e8e4db]/50 text-sm text-[#9a9a8f] cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#9a9a8f] tracking-widest uppercase mb-1.5">
                    Bio / Design Philosophy
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={4}
                    placeholder="I believe architecture is the learned game..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-[#F2EFE8]/50 text-sm text-[#32352C] outline-none focus:border-[#8A9A8B] transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 p-6">
                <h3 className="text-[10px] text-[#32352C] tracking-widest uppercase font-medium mb-5">
                  Synthesis Preferences
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      key: 'deep_neural' as const,
                      label: 'Deep Neural Rendering',
                      desc: 'Enable higher fidelity 3D synthesis (increases latency)',
                    },
                    {
                      key: 'auto_insight' as const,
                      label: 'Automatic Insight Generation',
                      desc: 'Trigger AI optimization loops immediately after plan synthesis',
                    },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#32352C] font-medium">{label}</p>
                        <p className="text-[10px] text-[#9a9a8f]">{desc}</p>
                      </div>
                      <button
                        onClick={() => setForm({ ...form, [key]: !form[key] })}
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          form[key] ? 'bg-[#8A9A8B]' : 'bg-[#e8e4db]'
                        }`}
                      >
                        <motion.div
                          animate={{ x: form[key] ? 20 : 2 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button className="px-5 py-2 rounded-full border border-[#8A9A8B]/20 text-xs text-[#9a9a8f] hover:border-[#8A9A8B]/50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => updateSettings.mutate()}
                  disabled={updateSettings.isPending}
                  className="px-6 py-2 rounded-full bg-[#32352C] text-[#F2EFE8] text-xs tracking-widest uppercase hover:bg-[#8A9A8B] transition-colors disabled:opacity-60"
                >
                  {saved ? 'Saved ✓' : updateSettings.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Security ── */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Change password */}
              <div className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 p-6">
                <h3 className="text-[10px] text-[#32352C] tracking-widest uppercase font-medium mb-5">
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-[#9a9a8f] tracking-widest uppercase mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a8f]" />
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        placeholder="Min. 6 characters"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#e8e4db] bg-[#F2EFE8]/50 text-sm text-[#32352C] outline-none focus:border-[#8A9A8B] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a8f] hover:text-[#32352C] transition-colors"
                      >
                        {showNewPw ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#9a9a8f] tracking-widest uppercase mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a8f]" />
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        value={pwForm.confirmPassword}
                        onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                        placeholder="Repeat new password"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#e8e4db] bg-[#F2EFE8]/50 text-sm text-[#32352C] outline-none focus:border-[#8A9A8B] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a8f] hover:text-[#32352C] transition-colors"
                      >
                        {showConfirmPw ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  {pwError && (
                    <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{pwError}</p>
                  )}

                  <button
                    onClick={handlePasswordChange}
                    disabled={pwStatus === 'loading' || !pwForm.newPassword}
                    className="px-6 py-2 rounded-full bg-[#32352C] text-[#F2EFE8] text-xs tracking-widest uppercase hover:bg-[#8A9A8B] transition-colors disabled:opacity-60"
                  >
                    {pwStatus === 'loading'
                      ? 'Updating...'
                      : pwStatus === 'success'
                      ? 'Updated ✓'
                      : 'Update Password'}
                  </button>
                </div>
              </div>

              {/* Account info */}
              <div className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 p-6">
                <h3 className="text-[10px] text-[#32352C] tracking-widest uppercase font-medium mb-5">
                  Account
                </h3>
                <div>
                  <label className="block text-[10px] text-[#9a9a8f] tracking-widest uppercase mb-1.5">
                    Email Address
                  </label>
                  <input
                    value={session?.user?.email ?? ''}
                    readOnly
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e8e4db] bg-[#e8e4db]/50 text-sm text-[#9a9a8f] cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#9a9a8f] mt-1.5">
                    Contact support to change your email address.
                  </p>
                </div>
              </div>

              {/* Danger zone */}
              <div className="bg-white/70 rounded-2xl border border-red-200/50 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <AlertTriangle size={13} className="text-red-400" />
                  <h3 className="text-[10px] text-red-400 tracking-widest uppercase font-medium">
                    Danger Zone
                  </h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#32352C] font-medium">Delete Account</p>
                    <p className="text-[10px] text-[#9a9a8f]">
                      Permanently removes your account and all synthesis data
                    </p>
                  </div>
                  <button className="px-4 py-2 rounded-full border border-red-300 text-xs text-red-400 hover:bg-red-50 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Other tabs (coming soon) ── */}
          {activeTab !== 'profile' && activeTab !== 'security' && (
            <div className="bg-white/70 rounded-2xl border border-[#8A9A8B]/15 p-6 flex items-center justify-center h-40">
              <p className="text-xs text-[#9a9a8f]">Coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
