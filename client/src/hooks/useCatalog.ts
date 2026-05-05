import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/utils'
import type { CatalogResponse } from '@/lib/types'

export interface CatalogFilters {
  category?: string
  style?: string
  search?: string
  offset: number
  limit?: number
}

export function useCatalog(filters: CatalogFilters, token?: string) {
  return useQuery({
    queryKey: ['catalog', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.category) params.set('category', filters.category)
      if (filters.style) params.set('style', filters.style)
      if (filters.search) params.set('search', filters.search)
      params.set('offset', String(filters.offset))
      params.set('limit', String(filters.limit ?? 20))
      return apiFetch<CatalogResponse>(`/furniture/catalog?${params}`, {}, token)
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })
}
