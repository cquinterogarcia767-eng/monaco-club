import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { getMyActiveSession } from './tableSessionService'

export function useTableSession() {
  const { user } = useAuthStore()

  const query = useQuery({
    queryKey: ['table-session', user?.id],
    queryFn:  () => getMyActiveSession(user.id),
    enabled:  !!user,
    refetchInterval: 1000 * 20,
  })

  return {
    ...query,
    session:   query.data ?? null,
    hasAccess: !!query.data,
  }
}