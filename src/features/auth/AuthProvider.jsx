import { useEffect, useRef } from 'react'
import { supabase }          from '@/lib/supabase'
import { useAuthStore }      from '@/store/authStore'

export default function AuthProvider({ children }) {
  const { setUser, setProfile, setSession, setLoading, reset } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    // Solo inicializar una vez
    if (initialized.current) return
    initialized.current = true

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session:', session?.user?.email)

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          console.log('Profile:', profile)
          if (profile) setProfile(profile)
        }
      } catch (e) {
        console.error('Auth init error:', e)
      } finally {
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        if (event === 'SIGNED_OUT') {
          reset()
          setLoading(false)
          return
        }
        if (event === 'SIGNED_IN' && session?.user) {
          setSession(session)
          setUser(session.user)
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          console.log('Profile on signin:', profile)
          if (profile) setProfile(profile)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return children
}