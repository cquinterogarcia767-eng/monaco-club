import { useEffect, useRef } from 'react'
import { supabase }          from '@/lib/supabase'
import { useAuthStore }      from '@/store/authStore'

export default function AuthProvider({ children }) {
  const { setUser, setProfile, setSession, setLoading, reset } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Timeout de seguridad — máximo 3 segundos cargando
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          if (data) setProfile(data)
        }
      } catch (e) {
        // silently fail
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          reset()
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
            if (data) setProfile(data)
          }
          clearTimeout(timeout)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  return children
}