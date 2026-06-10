import { useNavigate } from 'react-router-dom'
import { supabase }    from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useSignOut() {
  const navigate = useNavigate()
  const reset    = useAuthStore(s => s.reset)

  async function signOut() {
    await supabase.auth.signOut()
    reset()
    navigate('/login', { replace: true })
  }

  return signOut
}