import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyBets, getMyBetsForToday, placeBet } from './betsService'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export function useMyBets() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['bets', user?.id],
    queryFn:  () => getMyBets(user.id),
    enabled:  !!user,
  })
}

export function useMyBetsToday() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['bets-today', user?.id],
    queryFn:  () => getMyBetsForToday(user.id),
    enabled:  !!user,
  })
}

export function usePlaceBet() {
  const qc = useQueryClient()
  const { user, profile } = useAuthStore()

  return useMutation({
    mutationFn: (vars) => placeBet({ userId: user.id, ...vars }),
    onSuccess: () => {
      toast.success('¡Apuesta registrada!')
      qc.invalidateQueries({ queryKey: ['bets-today'] })
      qc.invalidateQueries({ queryKey: ['bets'] })
    },
    onError: (err) => {
      toast.error(err.message ?? 'Error al registrar la apuesta')
    }
  })
}