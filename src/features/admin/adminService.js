import { supabase } from '@/lib/supabase'

export async function getTables() {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('table_number')
  if (error) throw error
  return data
}

export async function getActiveSessionsTonight() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*, profiles(full_name, avatar_url)')
    .eq('night_date', today)
    .eq('is_active', true)
  if (error) throw error
  return data
}

export async function activateTable({ tableNumber, userEmail, activatedBy }) {
  // 1. Buscar el user_id por email
  const { data: userId, error: userError } = await supabase
    .rpc('get_user_id_by_email', { p_email: userEmail })

  if (userError) throw userError
  if (!userId)   throw new Error('No se encontró ningún usuario con ese email')

  const today = new Date().toISOString().split('T')[0]

  // 2. Activar la mesa
  const { error: tableError } = await supabase
    .from('tables')
    .update({
      is_active:    true,
      activated_at: new Date().toISOString(),
      activated_by: activatedBy,
      night_date:   today,
    })
    .eq('table_number', tableNumber)

  if (tableError) throw tableError

  // 3. Crear sesión para el usuario
  const { error: sessionError } = await supabase
    .from('table_sessions')
    .upsert({
      user_id:      userId,
      table_number: tableNumber,
      night_date:   today,
      is_active:    true,
      activated_by: activatedBy,
    }, { onConflict: 'user_id,night_date' })

  if (sessionError) throw sessionError
  return userId
}

export async function deactivateTable(tableNumber) {
  const today = new Date().toISOString().split('T')[0]

  const { error: tableError } = await supabase
    .from('tables')
    .update({ is_active: false })
    .eq('table_number', tableNumber)

  if (tableError) throw tableError

  // Desactivar también la sesión de esa mesa
  const { error: sessionError } = await supabase
    .from('table_sessions')
    .update({ is_active: false })
    .eq('table_number', tableNumber)
    .eq('night_date', today)

  if (sessionError) throw sessionError
}

export async function finishMatch({ matchId, homeScore, awayScore }) {
  const { error } = await supabase
    .from('matches')
    .update({
      status:       'finished',
      home_score:   homeScore,
      away_score:   awayScore,
      betting_open: false,
    })
    .eq('id', matchId)

  if (error) throw error

  const { error: fnError } = await supabase
    .rpc('calculate_night_winners', { p_match_id: matchId })

  if (fnError) throw fnError
}

export async function setMatchLive(matchId) {
  const { error } = await supabase
    .from('matches')
    .update({ status: 'live', betting_open: false })
    .eq('id', matchId)

  if (error) throw error
}

export async function updateLiveScore({ matchId, homeScore, awayScore }) {
  const { error } = await supabase
    .rpc('update_live_score', {
      p_match_id:   matchId,
      p_home_score: homeScore,
      p_away_score: awayScore,
    })
  if (error) throw error
}

export async function createMatch({ homeTeam, awayTeam, homeFlag, awayFlag, groupName, matchDate }) {
  const { error } = await supabase
    .from('matches')
    .insert({
      home_team:   homeTeam,
      away_team:   awayTeam,
      home_flag:   homeFlag,
      away_flag:   awayFlag,
      group_name:  groupName,
      match_date:  matchDate,
      status:      'upcoming',
      betting_open: true,
    })
  if (error) throw error
}