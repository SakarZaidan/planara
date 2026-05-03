import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  activePanel: 'style' | 'ikea' | 'score'
  setSidebarOpen: (open: boolean) => void
  setActivePanel: (panel: 'style' | 'ikea' | 'score') => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activePanel: 'style',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActivePanel: (panel) => set({ activePanel: panel }),
}))
