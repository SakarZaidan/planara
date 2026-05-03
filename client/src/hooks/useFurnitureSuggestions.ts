import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/utils'
import type { IkeaItem } from '@/lib/types'

export function useFurnitureSuggestions(tokens: string[], category?: string, token?: string) {
  return useQuery({
    queryKey: ['furniture', tokens, category],
    queryFn: () => {
      const params = new URLSearchParams({ tokens: tokens.join(',') })
      if (category) params.set('category', category)
      return apiFetch<IkeaItem[]>(`/furniture/suggestions?${params}`, {}, token)
    },
    enabled: tokens.length > 0 && !!token,
    staleTime: 5 * 60 * 1000,
  })
}
