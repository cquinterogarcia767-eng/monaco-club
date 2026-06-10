import { supabase } from '@/lib/supabase'

export async function getRanking() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, total_points, total_correct, total_bets')
    .order('total_points', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}