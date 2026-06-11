import { supabase }     from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useSignOut() {
  const reset = useAuthStore(s => s.reset)

  async function signOut() {
    await supabase.auth.signOut({ scope: 'global' })
    reset()
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/login'
  }

  return signOut
}