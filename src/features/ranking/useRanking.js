import { useQuery } from '@tanstack/react-query'
import { getRanking } from './rankingService'

export function useRanking() {
  return useQuery({
    queryKey: ['ranking'],
    queryFn: getRanking,
    refetchInterval: 1000 * 30,
  })
}