import { supabase } from '@/lib/supabase'

export async function getMyActiveSession(userId) {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('night_date', today)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data
}