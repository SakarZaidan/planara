import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/utils'
import type { LibraryItem } from '@/lib/types'

interface LibraryResponse {
  items: LibraryItem[]
  total_count: number
}

export function useLibrary(token?: string) {
  return useQuery({
    queryKey: ['library'],
    queryFn: () => apiFetch<LibraryResponse>('/library', {}, token),
    enabled: !!token,
  })
}

export function useDeleteProject(token?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (kernelId: string) =>
      apiFetch(`/library/${kernelId}`, { method: 'DELETE' }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] })
    },
  })
}
