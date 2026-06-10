import { supabase } from '@/lib/supabase'

export async function getMyBets(userId) {
  const { data, error } = await supabase
    .from('bets')
    .select('*, matches(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function placeBet({ userId, matchId, tableNumber, predictedHome, predictedAway }) {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('bets')
    .upsert({
      user_id:        userId,
      match_id:       matchId,
      table_number:   tableNumber,
      night_date:     today,
      predicted_home: predictedHome,
      predicted_away: predictedAway,
    }, { onConflict: 'user_id,match_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMyBetsForToday(userId) {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('bets')
    .select('match_id, predicted_home, predicted_away, is_correct, points_earned')
    .eq('user_id', userId)
    .eq('night_date', today)

  if (error) throw error
  return data
}