import { supabase } from '@/lib/supabase'

function getDayRangeColombia(date) {
  const d = new Date(date)
  // Colombia UTC-5: día empieza a las 05:00 UTC y termina a las 04:59:59 UTC del día siguiente
  const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 5, 0, 0, 0))
  const end   = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + 1, 4, 59, 59, 999))
  return { start, end }
}

export async function getMatches() {
  const { data, error } = await supabase
    .from('matches').select('*').order('match_date', { ascending: true })
  if (error) throw error
  return data
}

export async function getMatchesByDate(date) {
  const { start, end } = getDayRangeColombia(date)
  const { data, error } = await supabase
    .from('matches').select('*')
    .gte('match_date', start.toISOString())
    .lte('match_date', end.toISOString())
    .order('match_date', { ascending: true })
  if (error) throw error
  return data
}

export async function getMatchesToday() {
  return getMatchesByDate(new Date())
}

export async function getMatchById(id) {
  const { data, error } = await supabase
    .from('matches').select('*').eq('id', id).single()
  if (error) throw error
  return data
}