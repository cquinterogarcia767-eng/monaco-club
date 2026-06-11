import { useNavigate }  from 'react-router-dom'
import { supabase }     from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useSignOut() {
  const navigate = useNavigate()
  const reset    = useAuthStore(s => s.reset)

  async function signOut() {
    // Limpiar sesión completamente
    await supabase.auth.signOut({ scope: 'global' })
    reset()
    // Limpiar cualquier caché del navegador
    localStorage.clear()
    sessionStorage.clear()
    navigate('/login', { replace: true })
  }

  return signOut
}