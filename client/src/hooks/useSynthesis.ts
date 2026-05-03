import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/utils'
import { useKernelStore } from '@/store/useKernelStore'
import type { SynthesisInitResponse } from '@/lib/types'

export function useSynthesis(token?: string) {
  const { setKernel, setBlueprintUrl, setProjectId, setStatus, setStyleTokens } = useKernelStore()

  return useMutation({
    mutationFn: async (prompt: string) => {
      setStatus('stage1')
      const res = await apiFetch<SynthesisInitResponse>(
        '/synthesis/initialize',
        { method: 'POST', body: JSON.stringify({ prompt }) },
        token
      )
      return res
    },
    onSuccess: (data) => {
      setKernel(data.spatial_kernel)
      if (data.blueprint_url) setBlueprintUrl(data.blueprint_url)
      setProjectId(data.project_id)
      setStyleTokens(data.style_tokens)
      setStatus('complete')
    },
    onError: () => {
      setStatus('error')
    },
  })
}
