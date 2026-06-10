import { useQuery } from '@tanstack/react-query'
import { getMatches, getMatchesToday, getMatchesByDate } from './matchesService'

export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
    refetchInterval: 1000 * 30,
  })
}

export function useMatchesToday() {
  return useQuery({
    queryKey: ['matches-today'],
    queryFn: getMatchesToday,
    refetchInterval: 1000 * 30,
  })
}

export function useMatchesByDate(date) {
  return useQuery({
    queryKey: ['matches-date', date],
    queryFn: () => getMatchesByDate(date),
    enabled: !!date,
    refetchInterval: 1000 * 30,
  })
}