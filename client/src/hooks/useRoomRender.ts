import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/utils'
import { useKernelStore } from '@/store/useKernelStore'
import type { RenderRoomResponse } from '@/lib/types'

export function useRoomRender(roomId: string | null, projectId: string | null, token?: string) {
  const { setRender, currentKernel } = useKernelStore()

  const renderMutation = useMutation({
    mutationFn: async () => {
      if (!projectId || !roomId) throw new Error('Missing project or room id')

      const room = currentKernel?.rooms.find((r) => r.id === roomId)

      return apiFetch<RenderRoomResponse>(
        '/synthesis/render-room',
        {
          method: 'POST',
          body: JSON.stringify({
            kernel_id: projectId,
            room_id: roomId,
            perspective: 'eye-level',
            // Include the full room + kernel context so the server can render
            // without hitting the DB — the Supabase write often fails silently.
            inline_kernel: currentKernel && room
              ? {
                  style_category: currentKernel.style_category,
                  style_seeds: currentKernel.style_seeds,
                  room: {
                    name: room.name,
                    type: room.type,
                    dimensions: room.dimensions,
                  },
                }
              : undefined,
          }),
        },
        token
      )
    },
    onSuccess: (data) => {
      if (roomId) setRender(roomId, data)
    },
  })

  return { renderMutation }
}
