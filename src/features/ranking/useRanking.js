import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect }                from 'react'
import { supabase }                 from '@/lib/supabase'
import { getRanking }               from './rankingService'

export function useRanking() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['ranking'],
    queryFn:  getRanking,
    refetchInterval: 1000 * 30,
  })

  useEffect(() => {
    const channel = supabase
      .channel('ranking-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => { qc.invalidateQueries({ queryKey: ['ranking'] }) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [qc])

  return query
}