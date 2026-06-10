import { supabase } from '@/lib/supabase'

export async function getRanking() {
  const { data, error } = await supabase
    .from('full_ranking')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}