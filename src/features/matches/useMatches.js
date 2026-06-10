import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect }                from 'react'
import { supabase }                 from '@/lib/supabase'
import { getMatches, getMatchesByDate } from './matchesService'

export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn:  getMatches,
    refetchInterval: 1000 * 30,
  })
}

export function useMatchesByDate(date) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['matches-date', date],
    queryFn:  () => getMatchesByDate(date),
    enabled:  !!date,
    refetchInterval: 1000 * 15,
  })

  useEffect(() => {
    const channel = supabase
      .channel('matches-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          qc.invalidateQueries({ queryKey: ['matches-date'] })
          qc.invalidateQueries({ queryKey: ['matches'] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [qc])

  return query
}

export function useMatchesToday() {
  return useMatchesByDate(new Date())
}