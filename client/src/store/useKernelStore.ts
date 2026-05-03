import { create } from 'zustand'
import type { ArchitecturalKernel, RenderRoomResponse } from '@/lib/types'

type SynthesisStage = 'idle' | 'stage1' | 'stage2' | 'stage3' | 'complete' | 'error'

interface KernelStore {
  currentKernel: ArchitecturalKernel | null
  blueprintUrl: string | null
  selectedRoomId: string | null
  projectId: string | null
  synthesisStatus: SynthesisStage
  styleTokens: string[]
  // Per-room render cache — keyed by room id
  renders: Record<string, RenderRoomResponse>
  setKernel: (kernel: ArchitecturalKernel) => void
  setBlueprintUrl: (url: string) => void
  setProjectId: (id: string) => void
  selectRoom: (roomId: string | null) => void
  setStatus: (status: SynthesisStage) => void
  setStyleTokens: (tokens: string[]) => void
  setRender: (roomId: string, render: RenderRoomResponse) => void
  reset: () => void
}

export const useKernelStore = create<KernelStore>((set) => ({
  currentKernel: null,
  blueprintUrl: null,
  selectedRoomId: null,
  projectId: null,
  synthesisStatus: 'idle',
  styleTokens: [],
  renders: {},

  setKernel: (kernel) => set({ currentKernel: kernel }),
  setBlueprintUrl: (url) => set({ blueprintUrl: url }),
  setProjectId: (id) => set({ projectId: id }),
  selectRoom: (roomId) => set({ selectedRoomId: roomId }),
  setStatus: (status) => set({ synthesisStatus: status }),
  setStyleTokens: (tokens) => set({ styleTokens: tokens }),
  setRender: (roomId, render) =>
    set((state) => ({ renders: { ...state.renders, [roomId]: render } })),
  reset: () =>
    set({
      currentKernel: null,
      blueprintUrl: null,
      selectedRoomId: null,
      projectId: null,
      synthesisStatus: 'idle',
      styleTokens: [],
      renders: {},
    }),
}))
