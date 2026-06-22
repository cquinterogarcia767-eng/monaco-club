import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore }    from '@/store/authStore'
import { supabase }        from '@/lib/supabase'
import { getMatches }      from '@/features/matches/matchesService'
import LoadingScreen       from '@/components/ui/LoadingScreen'
import toast               from 'react-hot-toast'
import { useSignOut }      from '@/hooks/useSignOut'
import {
  Trophy, Radio, Play, Users, UserPlus, Trash2,
  Gift, Crown, Plus, Zap, ChevronRight,
  LayoutGrid, BarChart3, Lock, Unlock,
  DoorOpen, Star, X, CheckCircle, LogOut
} from 'lucide-react'

const getToday = () => new Date().toISOString().split('T')[0]

async function setMatchLive(matchId) {
  const { error } = await supabase
    .from('matches')
    .update({ status: 'live', betting_open: true, live_started_at: new Date().toISOString() })
    .eq('id', matchId)
  if (error) throw error
}
async function finishMatch({ matchId, homeScore, awayScore }) {
  const { error } = await supabase.from('matches')
    .update({ status: 'finished', home_score: homeScore, away_score: awayScore, betting_open: false })
    .eq('id', matchId)
  if (error) throw error
  const { error: e2 } = await supabase.rpc('calculate_night_winners', { p_match_id: matchId })
  if (e2) throw e2
}
async function updateLiveScore({ matchId, homeScore, awayScore }) {
  const { error } = await supabase.from('matches')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('id', matchId)
  if (error) throw error
}
async function createMatch(data) {
  const { error } = await supabase.from('matches')
    .insert({ ...data, status: 'upcoming', betting_open: true })
  if (error) throw error
}
async function toggleBetting({ matchId, open }) {
  const { error } = await supabase.from('matches')
    .update({ betting_open: open }).eq('id', matchId)
  if (error) throw error
}
async function getTables() {
  const { data, error } = await supabase.from('tables').select('*').order('table_number')
  if (error) throw error
  return data
}
async function getActiveSessions() {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*, profiles(id, full_name, avatar_url, total_points, total_correct)')
    .eq('night_date', getToday()).eq('is_active', true).order('table_number')
  if (error) throw error
  return data
}
async function createTable(tableNumber) {
  const { error } = await supabase.from('tables').insert({ table_number: tableNumber })
  if (error) throw error
}
async function deleteTable(id) {
  const { error } = await supabase.from('tables').delete().eq('id', id)
  if (error) throw error
}
async function closeTable({ tableNumber, closedBy }) {
  const { error } = await supabase.rpc('close_table', { p_table_number: tableNumber, p_closed_by: closedBy })
  if (error) throw error
}
async function getNightWinners() {
  const { data, error } = await supabase.from('bets')
    .select('*, profiles(id, full_name, avatar_url), matches(home_team, away_team, home_flag, away_flag)')
    .eq('night_date', getToday()).eq('is_correct', true)
    .order('points_earned', { ascending: false })
  if (error) throw error
  return data
}
async function getPrizeConfig() {
  const { data, error } = await supabase.from('prize_config')
    .select('*').eq('night_date', getToday()).eq('is_active', true)
  if (error) throw error
  return data ?? []
}
async function addPrizeConfig({ prizeType, description, quantity }) {
  const { error } = await supabase.from('prize_config').insert({
    night_date: getToday(), prize_type: prizeType, prize_description: description, quantity,
  })
  if (error) throw error
}
async function removePrizeConfig(id) {
  const { error } = await supabase.from('prize_config').update({ is_active: false }).eq('id', id)
  if (error) throw error
}
async function assignPrize({ userId, matchId, prizeType, description, tableNumber }) {
  const { error } = await supabase.from('night_prizes').insert({
    night_date: getToday(), match_id: matchId, user_id: userId,
    table_number: tableNumber, prize_type: prizeType, prize_description: description,
  })
  if (error) throw error
}
async function getWaiters() {
  const { data, error } = await supabase.from('profiles')
    .select('id, full_name, avatar_url, role').eq('role', 'waiter')
  if (error) throw error
  return data
}
async function removeWaiter(userId) {
  const { error } = await supabase.from('profiles').update({ role: 'user' }).eq('id', userId)
  if (error) throw error
}
async function getTournamentStats() {
  const { data: players } = await supabase.from('profiles')
    .select('id, full_name, avatar_url, total_points, total_correct, total_bets')
    .eq('role', 'user').order('total_points', { ascending: false })
  const { data: bets } = await supabase.from('bets').select('id, is_correct')
  const { data: prizes } = await supabase.from('night_prizes').select('id')
  const { data: finished } = await supabase.from('matches').select('id').eq('status', 'finished')
  return {
    players: players ?? [], totalBets: bets?.length ?? 0,
    correctBets: bets?.filter(b => b.is_correct)?.length ?? 0,
    matchesFinished: finished?.length ?? 0, prizesAwarded: prizes?.length ?? 0,
  }
}
async function getAllUsers() {
  const { data, error } = await supabase.from('profiles')
    .select('id, full_name, avatar_url, total_points, total_correct, total_bets, role')
    .order('total_points', { ascending: false })
  if (error) throw error
  return data ?? []
}

export default function AdminPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'dashboard'
  function setTab(t) { setSearchParams({ tab: t }) }

  const signOut = useSignOut()
  const [scores, setScores] = useState({})
  const [liveScores, setLiveScores] = useState({})
  const [waiterEmail, setWaiterEmail] = useState('')
  const [newTableNum, setNewTableNum] = useState('')
  const [assigningPrize, setAssigningPrize] = useState(null)
  const [prizeType, setPrizeType] = useState('discount_5')
  const [prizeDesc, setPrizeDesc] = useState('')
  const [closingTable, setClosingTable] = useState(null)
  const [matchView, setMatchView] = useState('today')
  const [newPrize, setNewPrize] = useState({ type: 'discount_5', desc: '', qty: 1 })
  const [newMatch, setNewMatch] = useState({
    home_team: '', away_team: '', home_flag: '', away_flag: '', group_name: '', match_date: ''
  })
  const [adminEmail, setAdminEmail] = useState('')

  const todayStr = useMemo(() => {
    const d = new Date()
    d.setHours(d.getHours() - 5)
    return d.toISOString().split('T')[0]
  }, [])

  const { data: matches = [], isLoading: lm } = useQuery({ queryKey: ['matches'], queryFn: getMatches, refetchInterval: 30000 })
  const { data: tables = [] } = useQuery({ queryKey: ['tables'], queryFn: getTables, refetchInterval: 15000 })
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: getActiveSessions, refetchInterval: 15000 })
  const { data: waiters = [] } = useQuery({ queryKey: ['waiters'], queryFn: getWaiters, refetchInterval: 30000 })
  const { data: winners = [] } = useQuery({ queryKey: ['winners'], queryFn: getNightWinners, refetchInterval: 30000 })
  const { data: prizeConfig = [] } = useQuery({ queryKey: ['prize-config'], queryFn: getPrizeConfig })
  const { data: stats } = useQuery({ queryKey: ['tournament-stats'], queryFn: getTournamentStats, refetchInterval: 60000 })
  const { data: allUsers = [] } = useQuery({ queryKey: ['all-users'], queryFn: getAllUsers, refetchInterval: 60000 })
  const { data: allBets = [] } = useQuery({
    queryKey: ['all-bets'],
    queryFn: async () => {
    const { data: allBets = [] } = useQuery({
  queryKey: ['all-bets'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('bets')
      .select('*, profiles(full_name, avatar_url), matches(home_team, away_team, home_flag, away_flag, home_score, away_score, status)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data ?? []
  },
  refetchInterval: 15000
})

  const liveMut = useMutation({
    mutationFn: setMatchLive,
    onSuccess: () => { toast.success('Partido en vivo'); qc.invalidateQueries({ queryKey: ['matches'] }) },
    onError: (e) => toast.error('Error: ' + e.message)
  })
  const finishMut = useMutation({
    mutationFn: finishMatch,
    onSuccess: () => { toast.success('¡Resultado guardado!'); qc.invalidateQueries({ queryKey: ['matches'] }); qc.invalidateQueries({ queryKey: ['winners'] }) },
    onError: (e) => toast.error('Error: ' + e.message)
  })
  const liveScoreMut = useMutation({
    mutationFn: updateLiveScore,
    onSuccess: () => { toast.success('Marcador actualizado'); qc.invalidateQueries({ queryKey: ['matches'] }) },
    onError: (e) => toast.error('Error: ' + e.message)
  })
  const createMatchMut = useMutation({
    mutationFn: createMatch,
    onSuccess: () => { toast.success('Partido creado'); qc.invalidateQueries({ queryKey: ['matches'] }) },
    onError: (e) => toast.error('Error: ' + e.message)
  })
  const toggleBetMut = useMutation({
    mutationFn: toggleBetting,
    onSuccess: () => { toast.success('Apuestas actualizadas'); qc.invalidateQueries({ queryKey: ['matches'] }) },
    onError: (e) => toast.error('Error: ' + e.message)
  })
  const createTableMut = useMutation({
    mutationFn: createTable,
    onSuccess: () => { toast.success('Mesa creada'); qc.invalidateQueries({ queryKey: ['tables'] }) },
    onError: (e) => toast.error('Error: ' + e.message)
  })
  const deleteTableMut = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => { toast.success('Mesa eliminada'); qc.invalidateQueries({ queryKey: ['tables'] }) },
    onError: (e) => toast.error('Error: ' + e.message)
  })
  const addPrizeMut = useMutation({
    mutationFn: addPrizeConfig,
    onSuccess: () => { toast.success('Premio configurado'); qc.invalidateQueries({ queryKey: ['prize-config'] }) },
    onError: (e) => toast.error('Error: ' + e.message)
  })
  const removePrizeMut = useMutation({
    mutationFn: removePrizeConfig,
    onSuccess: () => { toast.success('Premio eliminado'); qc.invalidateQueries({ queryKey: ['prize-config'] }) },
    onError: (e) => toast.error('Error: ' + e.message)
  })
  const removeWaiterMut = useMutation({
    mutationFn: removeWaiter,
    onSuccess: () => { toast.success('Mesero eliminado'); qc.invalidateQueries({ queryKey: ['waiters'] }) },
    onError: (e) => toast.error('Error: ' + e.message)
  })
  const closeTableMut = useMutation({
    mutationFn: closeTable,
    onSuccess: () => { toast.success('Mesa cerrada'); qc.invalidateQueries({ queryKey: ['tables'] }); qc.invalidateQueries({ queryKey: ['sessions'] }); setClosingTable(null) },
    onError: (e) => toast.error('Error: ' + e.message)
  })
  const assignPrizeMut = useMutation({
    mutationFn: assignPrize,
    onSuccess: () => { toast.success('Premio asignado'); setAssigningPrize(null); setPrizeDesc(''); qc.invalidateQueries({ queryKey: ['prizes'] }) },
    onError: (e) => toast.error('Error: ' + e.message)
  })

  function handleFinish(matchId) {
    const s = scores[matchId] ?? liveScores[matchId]
    const match = matches.find(m => m.id === matchId)
    const home = s?.home !== undefined && s?.home !== '' ? Number(s.home) : match?.home_score ?? 0
    const away = s?.away !== undefined && s?.away !== '' ? Number(s.away) : match?.away_score ?? 0
    finishMut.mutate({ matchId, homeScore: home, awayScore: away })
  }

  function handleLiveScore(matchId) {
    const s = liveScores[matchId]
    if (!s || s.home === '' || s.away === '' || s.home === undefined || s.away === undefined)
      return toast.error('Ingresa el marcador')
    liveScoreMut.mutate({ matchId, homeScore: Number(s.home), awayScore: Number(s.away) })
  }

  function handleCreateMatch() {
    const { home_team, away_team, home_flag, away_flag, group_name, match_date } = newMatch
    if (!home_team || !away_team || !match_date) return toast.error('Completa los campos obligatorios')
    createMatchMut.mutate({
      home_team, away_team, home_flag: home_flag || '🏳️', away_flag: away_flag || '🏳️',
      group_name: group_name || 'Amistoso', match_date: new Date(match_date).toISOString(),
    })
    setNewMatch({ home_team: '', away_team: '', home_flag: '', away_flag: '', group_name: '', match_date: '' })
  }

  async function handleAddWaiter() {
    if (!waiterEmail.trim()) return toast.error('Ingresa el email')
    try {
      const { data: userId, error: rpcError } = await supabase
        .rpc('get_user_id_by_email', { p_email: waiterEmail.trim().toLowerCase() })
      if (rpcError) { toast.error('Error: ' + rpcError.message); return }
      if (!userId) { toast.error('No se encontró usuario con ese email'); return }
      const { error: updateError } = await supabase
        .from('profiles').update({ role: 'waiter' }).eq('id', userId)
      if (updateError) { toast.error('Error: ' + updateError.message); return }
      toast.success('Mesero agregado')
      qc.invalidateQueries({ queryKey: ['waiters'] })
      qc.invalidateQueries({ queryKey: ['all-users'] })
      setWaiterEmail('')
    } catch (e) {
      toast.error('Error: ' + e.message)
    }
  }

  async function handleAddAdmin() {
  if (!adminEmail.trim()) return toast.error('Ingresa el email')
  try {
    const { data: userId, error: rpcError } = await supabase
      .rpc('get_user_id_by_email', { p_email: adminEmail.trim().toLowerCase() })
    if (rpcError) { toast.error('Error: ' + rpcError.message); return }
    if (!userId) { toast.error('No se encontró usuario con ese email'); return }
    const { error: updateError } = await supabase
      .from('profiles').update({ role: 'admin' }).eq('id', userId)
    if (updateError) { toast.error('Error: ' + updateError.message); return }
    toast.success('Administrador agregado')
    qc.invalidateQueries({ queryKey: ['all-users'] })
    setAdminEmail('')
  } catch (e) {
    toast.error('Error: ' + e.message)
  }
}

  const liveMatches = matches.filter(m => m.status === 'live')
  const upcomingMatches = matches.filter(m => m.status === 'upcoming')
  const finishedMatches = matches.filter(m => m.status === 'finished')
  const activeTables = tables.filter(t => t.is_active)
  const freeTables = tables.filter(t => !t.is_active)

  const todayMatches = useMemo(() => matches.filter(m => {
    const matchDay = new Date(new Date(m.match_date).getTime() - 5 * 60 * 60 * 1000).toISOString().split('T')[0]
    return matchDay === todayStr
  }), [matches, todayStr])
  const todayLive = todayMatches.filter(m => m.status === 'live')
  const todayUpcoming = todayMatches.filter(m => m.status === 'upcoming')
  const todayFinished = todayMatches.filter(m => m.status === 'finished')
  

  if (lm) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-monaco-black">
      <div className="px-6 pt-8 pb-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl text-monaco-white tracking-wide capitalize mb-1">
              {tab === 'dashboard' ? 'Dashboard' : tab === 'mesas' ? 'Mesas' : tab === 'partidos' ? 'Partidos' : tab === 'premios' ? 'Premios' : tab === 'apuestas' ? 'Apuestas' : tab === 'usuarios' ? 'Usuarios' : 'Ajustes'}
            </h1>
            <p className="text-monaco-silver text-xs">Mónaco Club · Mundial 2026</p>
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-monaco-silver text-xs">
            <LogOut size={12} /> Salir
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            { key: 'dashboard', label: '📊 Dashboard' }, { key: 'mesas', label: '🪑 Mesas' },
            { key: 'partidos', label: '⚽ Partidos' }, { key: 'premios', label: '🏆 Premios' },
            { key: 'apuestas', label: '🎯 Apuestas' }, { key: 'usuarios', label: '👥 Usuarios' }, { key: 'ajustes', label: '⚙️ Ajustes' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${tab === t.key ? 'bg-monaco-red text-white' : 'bg-white/5 text-monaco-silver border border-white/10'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'dashboard' && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            <KPI label="En vivo" value={liveMatches.length} color="green" />
            <KPI label="Mesas" value={activeTables.length} color="red" />
            <KPI label="Jugadores" value={stats?.players?.length ?? 0} color="silver" />
            <KPI label="Premios" value={stats?.prizesAwarded ?? 0} color="yellow" />
          </div>
        )}
      </div>

      <div className="px-4 py-6 space-y-4">
        {tab === 'dashboard' && (<div className="space-y-5">
          {liveMatches.length > 0 && (<div>
            <p className="section-label flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> En vivo ahora</p>
            {liveMatches.map(match => (<LiveCard key={match.id} match={match} liveScore={liveScores[match.id]} onScoreChange={(side, v) => setLiveScores(s => ({ ...s, [match.id]: { ...s[match.id], [side]: v } }))} onUpdate={() => handleLiveScore(match.id)} onFinish={() => handleFinish(match.id)} isPending={liveScoreMut.isPending || finishMut.isPending} />))}
          </div>)}
          <p className="section-label flex items-center gap-2"><BarChart3 size={12} /> Estadísticas</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Apuestas" value={stats?.totalBets ?? 0} />
            <StatCard label="Aciertos" value={stats?.correctBets ?? 0} accent />
            <StatCard label="Jugados" value={stats?.matchesFinished ?? 0} />
            <StatCard label="Premios" value={stats?.prizesAwarded ?? 0} />
          </div>
          {(stats?.players?.length ?? 0) > 0 && (<div>
            <p className="section-label flex items-center gap-2"><Crown size={12} className="text-yellow-400" /> Top del torneo</p>
            <div className="space-y-2">{stats.players.slice(0, 5).map((p, i) => (
              <div key={p.id} className={`card flex items-center gap-3 ${i === 0 ? 'border-yellow-400/30 bg-yellow-400/5' : ''}`}>
                <span className={`w-6 text-center font-display text-sm flex-shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-monaco-silver' : i === 2 ? 'text-amber-600' : 'text-monaco-silver/40'}`}>{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-monaco-red/20 border border-monaco-red/30 flex items-center justify-center text-xs text-monaco-red flex-shrink-0">
                  {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full rounded-full object-cover" /> : p.full_name?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0"><p className="text-monaco-white text-sm truncate">{p.full_name ?? 'Anónimo'}</p><p className="text-monaco-silver text-xs">{p.total_correct} aciertos</p></div>
                <span className="text-monaco-red font-display text-lg flex-shrink-0">{p.total_points}</span>
              </div>
            ))}</div>
          </div>)}
          <p className="section-label">Accesos rápidos</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Mesas', icon: LayoutGrid, tab: 'mesas', color: 'red' }, { label: 'Partidos', icon: Trophy, tab: 'partidos', color: 'green' }, { label: 'Premios', icon: Gift, tab: 'premios', color: 'yellow' }, { label: 'Usuarios', icon: Users, tab: 'usuarios', color: 'blue' }].map(item => (
              <button key={item.tab} onClick={() => setTab(item.tab)} className="card flex items-center gap-3 p-3 active:scale-95 transition-all">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color === 'red' ? 'bg-monaco-red/20' : item.color === 'yellow' ? 'bg-yellow-500/20' : item.color === 'green' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                  <item.icon size={16} className={item.color === 'red' ? 'text-monaco-red' : item.color === 'yellow' ? 'text-yellow-400' : item.color === 'green' ? 'text-green-400' : 'text-blue-400'} />
                </div>
                <div className="flex-1 flex items-center justify-between min-w-0"><span className="text-monaco-white text-xs font-medium">{item.label}</span><ChevronRight size={12} className="text-monaco-silver/40 flex-shrink-0" /></div>
              </button>
            ))}
          </div>
        </div>)}

        {tab === 'mesas' && (<div className="space-y-4">
          <div className="card border-monaco-red/20 space-y-3">
            <p className="text-monaco-white text-sm font-medium flex items-center gap-2"><Plus size={14} className="text-monaco-red" /> Crear mesa</p>
            <div className="flex gap-2">
              <input type="number" min="1" value={newTableNum} onChange={e => setNewTableNum(e.target.value)} placeholder="Número de mesa" className="flex-1 bg-monaco-black border border-white/10 rounded-xl px-3 py-2.5 text-sm text-monaco-white placeholder-monaco-silver/40 focus:outline-none focus:border-monaco-red/50" />
              <button onClick={() => { if (!newTableNum) return toast.error('Ingresa el número'); createTableMut.mutate(Number(newTableNum)); setNewTableNum('') }} disabled={!newTableNum || createTableMut.isPending} className="px-5 py-2.5 bg-monaco-red rounded-xl text-white text-sm font-medium disabled:opacity-50">Crear</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="card text-center border-monaco-red/30 bg-monaco-red/5"><p className="text-2xl font-display text-monaco-red">{activeTables.length}</p><p className="text-[10px] text-monaco-silver tracking-widest uppercase mt-1">Ocupadas</p></div>
            <div className="card text-center"><p className="text-2xl font-display text-monaco-white">{freeTables.length}</p><p className="text-[10px] text-monaco-silver tracking-widest uppercase mt-1">Libres</p></div>
            <div className="card text-center"><p className="text-2xl font-display text-monaco-white">{tables.length}</p><p className="text-[10px] text-monaco-silver tracking-widest uppercase mt-1">Total</p></div>
          </div>
          {activeTables.map(table => { const tu = sessions.filter(s => s.table_number === table.table_number); return (
            <div key={table.id} className="card border-monaco-red/20 space-y-3">
              <div className="flex items-center justify-between">
                <div><p className="text-monaco-white font-medium">Mesa {table.table_number}</p><p className="text-[10px] text-monaco-red mt-0.5">● {tu.length} cliente{tu.length !== 1 ? 's' : ''}</p></div>
                <button onClick={() => setClosingTable(table.table_number)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-monaco-silver text-xs"><DoorOpen size={12} /> Cerrar</button>
              </div>
              {tu.map(s => (<div key={s.id} className="flex items-center gap-2.5 pt-2 border-t border-white/5">
                <div className="w-8 h-8 rounded-full bg-monaco-red/20 border border-monaco-red/30 flex items-center justify-center text-xs text-monaco-red flex-shrink-0">{s.profiles?.avatar_url ? <img src={s.profiles.avatar_url} className="w-full h-full rounded-full object-cover" /> : s.profiles?.full_name?.[0] ?? '?'}</div>
                <div className="flex-1 min-w-0"><p className="text-monaco-white text-xs font-medium truncate">{s.profiles?.full_name ?? 'Usuario'}</p><p className="text-monaco-silver text-[10px]">{s.profiles?.total_points ?? 0} pts</p></div>
              </div>))}
            </div>
          )})}
          {freeTables.length > 0 && (<div><p className="section-label">Disponibles</p><div className="grid grid-cols-4 gap-2">{freeTables.map(t => (
            <div key={t.id} className="card aspect-square flex flex-col items-center justify-center gap-1 relative group">
              <span className="text-monaco-silver font-display text-xl">{t.table_number}</span><span className="text-[9px] text-monaco-silver/40 uppercase">Libre</span>
              <button onClick={() => deleteTableMut.mutate(t.id)} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100"><X size={10} className="text-monaco-silver" /></button>
            </div>
          ))}</div></div>)}
        </div>)}

        {tab === 'partidos' && (<div className="space-y-4">
          <div className="flex bg-monaco-card rounded-xl p-1 border border-white/5">
            <button onClick={() => setMatchView('today')} className={`flex-1 py-2 rounded-lg text-xs font-medium tracking-wide transition-all ${matchView === 'today' ? 'bg-monaco-red text-white' : 'text-monaco-silver'}`}>📅 Hoy</button>
            <button onClick={() => setMatchView('all')} className={`flex-1 py-2 rounded-lg text-xs font-medium tracking-wide transition-all ${matchView === 'all' ? 'bg-monaco-red text-white' : 'text-monaco-silver'}`}>📋 Todos</button>
          </div>
          <div className="card border-monaco-red/20 space-y-3">
            <p className="text-monaco-white font-medium text-sm flex items-center gap-2"><Plus size={14} className="text-monaco-red" /> Crear partido</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ key: 'home_team', label: 'Local', ph: 'Colombia' }, { key: 'away_team', label: 'Visitante', ph: 'Brasil' }, { key: 'home_flag', label: 'Bandera local', ph: '🇨🇴' }, { key: 'away_flag', label: 'Bandera visitante', ph: '🇧🇷' }].map(f => (
                <div key={f.key} className="space-y-1"><p className="text-[10px] text-monaco-silver uppercase tracking-wide">{f.label}</p><input value={newMatch[f.key]} onChange={e => setNewMatch(m => ({ ...m, [f.key]: e.target.value }))} placeholder={f.ph} className="w-full bg-monaco-black border border-white/10 rounded-xl px-3 py-2 text-sm text-monaco-white placeholder-monaco-silver/30 focus:outline-none focus:border-monaco-red/50" /></div>
              ))}
            </div>
            <div className="space-y-1"><p className="text-[10px] text-monaco-silver uppercase tracking-wide">Grupo</p><input value={newMatch.group_name} onChange={e => setNewMatch(m => ({ ...m, group_name: e.target.value }))} placeholder="Grupo A, Octavos..." className="w-full bg-monaco-black border border-white/10 rounded-xl px-3 py-2 text-sm text-monaco-white placeholder-monaco-silver/30 focus:outline-none focus:border-monaco-red/50" /></div>
            <div className="space-y-1"><p className="text-[10px] text-monaco-silver uppercase tracking-wide">Fecha y hora</p><input type="datetime-local" value={newMatch.match_date} onChange={e => setNewMatch(m => ({ ...m, match_date: e.target.value }))} className="w-full bg-monaco-black border border-white/10 rounded-xl px-3 py-2 text-sm text-monaco-white focus:outline-none focus:border-monaco-red/50" /></div>
            <button onClick={handleCreateMatch} disabled={createMatchMut.isPending} className="btn-primary text-sm py-2.5">{createMatchMut.isPending ? 'Creando...' : '+ Crear partido'}</button>
          </div>

          {matchView === 'today' && (<div className="space-y-4">
            {todayMatches.length === 0 && <div className="card text-center py-10"><p className="text-monaco-silver text-sm">No hay partidos hoy</p></div>}
            {todayLive.length > 0 && (<div><p className="section-label flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> En vivo</p>{todayLive.map(m => (<LiveCard key={m.id} match={m} liveScore={liveScores[m.id]} onScoreChange={(side, v) => setLiveScores(s => ({ ...s, [m.id]: { ...s[m.id], [side]: v } }))} onUpdate={() => handleLiveScore(m.id)} onFinish={() => handleFinish(m.id)} isPending={liveScoreMut.isPending || finishMut.isPending} />))}</div>)}
            {todayUpcoming.length > 0 && (<div><p className="section-label">Próximos hoy</p>{todayUpcoming.map(m => (<MatchAdminCard key={m.id} match={m} scores={scores} setScores={setScores} onLive={() => liveMut.mutate(m.id)} onFinish={() => handleFinish(m.id)} onToggleBet={toggleBetMut} isPending={liveMut.isPending || finishMut.isPending} />))}</div>)}
            {todayFinished.length > 0 && (<div><p className="section-label">Finalizados hoy</p>{todayFinished.map(m => (<FinishedMatchCard key={m.id} match={m} />))}</div>)}
          </div>)}

          {matchView === 'all' && (<div className="space-y-4">
            {liveMatches.length > 0 && (<div><p className="section-label flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> En vivo</p>{liveMatches.map(m => (<LiveCard key={m.id} match={m} liveScore={liveScores[m.id]} onScoreChange={(side, v) => setLiveScores(s => ({ ...s, [m.id]: { ...s[m.id], [side]: v } }))} onUpdate={() => handleLiveScore(m.id)} onFinish={() => handleFinish(m.id)} isPending={liveScoreMut.isPending || finishMut.isPending} />))}</div>)}
            {upcomingMatches.length > 0 && (<div><p className="section-label">Próximos ({upcomingMatches.length})</p>{upcomingMatches.map(m => (<MatchAdminCard key={m.id} match={m} scores={scores} setScores={setScores} onLive={() => liveMut.mutate(m.id)} onFinish={() => handleFinish(m.id)} onToggleBet={toggleBetMut} isPending={liveMut.isPending || finishMut.isPending} />))}</div>)}
            {finishedMatches.length > 0 && (<div><p className="section-label">Finalizados ({finishedMatches.length})</p>{finishedMatches.map(m => (<FinishedMatchCard key={m.id} match={m} />))}</div>)}
          </div>)}
        </div>)}

        {tab === 'premios' && (<div className="space-y-4">
          <div className="card border-monaco-red/20 space-y-3">
            <p className="text-monaco-white text-sm font-medium flex items-center gap-2"><Star size={14} className="text-monaco-red" /> Premio de esta noche</p>
            <p className="text-monaco-silver text-xs leading-relaxed">Se entrega al cliente con más puntos al finalizar la noche.</p>
            <div className="space-y-2">
              {[{ key: 'discount_5', label: 'Descuento 5%' }, { key: 'colombia_shirt', label: 'Camisa Selección Colombia' }, { key: 'beer_bucket', label: 'Cubetazo de cerveza' }, { key: 'custom', label: 'Personalizado' }].map(p => (
                <button key={p.key} onClick={() => setNewPrize(n => ({ ...n, type: p.key }))} className={`w-full py-2 rounded-xl text-sm text-left px-3 transition-all ${newPrize.type === p.key ? 'bg-monaco-red/20 border border-monaco-red/30 text-monaco-red' : 'bg-white/5 text-monaco-silver border border-white/10'}`}>{p.label}</button>
              ))}
              {newPrize.type === 'custom' && <input value={newPrize.desc} onChange={e => setNewPrize(n => ({ ...n, desc: e.target.value }))} placeholder="Describe el premio..." className="w-full bg-monaco-black border border-white/10 rounded-xl px-3 py-2 text-sm text-monaco-white placeholder-monaco-silver/40 focus:outline-none focus:border-monaco-red/50" />}
              <button onClick={() => addPrizeMut.mutate({ prizeType: newPrize.type, description: newPrize.type === 'custom' ? newPrize.desc : newPrize.type, quantity: 1 })} disabled={addPrizeMut.isPending} className="w-full py-2.5 bg-monaco-red/20 border border-monaco-red/30 rounded-xl text-monaco-red text-sm font-medium">{addPrizeMut.isPending ? 'Guardando...' : 'Guardar premio de la noche'}</button>
            </div>
            {prizeConfig.length > 0 && (<div className="border-t border-white/5 pt-3 space-y-2"><p className="text-[10px] text-monaco-silver uppercase tracking-wide">Premio configurado hoy</p>{prizeConfig.map(p => (
              <div key={p.id} className="flex items-center gap-2 py-1.5 bg-monaco-red/5 border border-monaco-red/20 rounded-xl px-3"><span className="text-monaco-red text-xs flex-1">{p.prize_description || p.prize_type}</span><button onClick={() => removePrizeMut.mutate(p.id)} className="p-1 rounded-lg bg-white/5 text-monaco-silver"><X size={12} /></button></div>
            ))}</div>)}
          </div>
          <GrandPrizeConfig user={user} />
          <NightWinnerCard onAssign={(bet) => { setAssigningPrize(bet); setPrizeType(prizeConfig[0]?.prize_type ?? 'discount_5') }} />
          <TournamentPrizeCard user={user} qc={qc} />
          {winners.length > 0 && (<div><p className="section-label flex items-center gap-2"><Crown size={12} className="text-yellow-400" /> Ganadores hoy</p>{winners.map(bet => (
            <div key={bet.id} className="card border-monaco-red/20 mb-2"><div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-monaco-red/20 border border-monaco-red/30 flex items-center justify-center text-monaco-red font-display flex-shrink-0">{bet.profiles?.full_name?.[0] ?? '?'}</div>
              <div className="flex-1 min-w-0"><p className="text-monaco-white text-sm font-medium truncate">{bet.profiles?.full_name ?? 'Usuario'}</p><p className="text-monaco-silver text-xs">{bet.matches?.home_flag} {bet.predicted_home}—{bet.predicted_away} {bet.matches?.away_flag} · +{bet.points_earned} pts</p></div>
              <button onClick={() => { setAssigningPrize(bet); setPrizeType(prizeConfig[0]?.prize_type ?? 'discount_5') }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-monaco-red text-white text-xs flex-shrink-0"><Gift size={12} /> Premio</button>
            </div></div>
          ))}</div>)}
        </div>)}

        {tab === 'usuarios' && (<div className="space-y-4">
          <div className="card border-yellow-500/20 space-y-3">
            <p className="text-monaco-white text-sm font-medium flex items-center gap-2"><UserPlus size={14} className="text-yellow-400" /> Agregar mesero</p>
            <p className="text-monaco-silver text-xs leading-relaxed">El mesero debe registrarse primero. Luego ingresa su email.</p>
            <input value={waiterEmail} onChange={e => setWaiterEmail(e.target.value)} placeholder="email@ejemplo.com" type="email" className="w-full bg-monaco-black border border-white/10 rounded-xl px-3 py-2.5 text-sm text-monaco-white placeholder-monaco-silver/40 focus:outline-none focus:border-yellow-500/50" />
            <button onClick={handleAddWaiter} className="btn-primary text-sm py-2.5">Asignar rol de mesero</button>
          </div>

          <div className="card border-monaco-red/20 space-y-3">
            <p className="text-monaco-white text-sm font-medium flex items-center gap-2">
              <Crown size={14} className="text-monaco-red" /> Agregar administrador
            </p>
            <p className="text-monaco-silver text-xs leading-relaxed">
              El usuario debe registrarse primero. Luego ingresa su email.
            </p>
            <input
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              placeholder="email@ejemplo.com" type="email"
              className="w-full bg-monaco-black border border-white/10 rounded-xl px-3 py-2.5 text-sm text-monaco-white placeholder-monaco-silver/40 focus:outline-none focus:border-monaco-red/50" />
            <button onClick={handleAddAdmin} className="w-full py-2.5 bg-monaco-red rounded-xl text-white text-sm font-medium">
              Asignar rol de admin
            </button>
          </div>


          {waiters.length > 0 && (<div><p className="section-label flex items-center gap-2"><Users size={12} /> Meseros ({waiters.length})</p>{waiters.map(w => (
            <div key={w.id} className="card flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-display flex-shrink-0">{w.avatar_url ? <img src={w.avatar_url} className="w-full h-full rounded-full object-cover" /> : w.full_name?.[0] ?? '?'}</div>
              <div className="flex-1 min-w-0"><p className="text-monaco-white text-sm truncate">{w.full_name ?? 'Sin nombre'}</p><span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">Mesero</span></div>
              <button onClick={() => removeWaiterMut.mutate(w.id)} className="p-2 rounded-lg bg-white/5 border border-white/10 text-monaco-silver"><Trash2 size={14} /></button>
            </div>
          ))}</div>)}
          <p className="section-label flex items-center gap-2"><Users size={12} /> Clientes ({allUsers.filter(u => u.role === 'user').length})</p>
          {allUsers.filter(u => u.role === 'user').map((u, i) => (
            <div key={u.id} className="card flex items-center gap-3 mb-2">
              <span className="text-monaco-silver/40 text-xs w-5 text-center flex-shrink-0">{i + 1}</span>
              <div className="w-8 h-8 rounded-full bg-monaco-red/20 border border-monaco-red/30 flex items-center justify-center text-xs text-monaco-red flex-shrink-0">{u.avatar_url ? <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" /> : u.full_name?.[0] ?? '?'}</div>
              <div className="flex-1 min-w-0"><p className="text-monaco-white text-sm truncate">{u.full_name ?? 'Sin nombre'}</p><p className="text-monaco-silver text-xs">{u.total_correct} aciertos</p></div>
              <span className="text-monaco-red font-display text-sm flex-shrink-0">{u.total_points} pts</span>
            </div>
          ))}
        </div>)}

        {tab === 'apuestas' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="card text-center border-monaco-red/30 bg-monaco-red/5">
                <p className="text-2xl font-display text-monaco-red">{allBets.length}</p>
                <p className="text-[10px] text-monaco-silver tracking-widest uppercase mt-1">Apuestas hoy</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-display text-monaco-white">{allBets.filter(b => b.is_correct).length}</p>
                <p className="text-[10px] text-monaco-silver tracking-widest uppercase mt-1">Aciertos</p>
              </div>
            </div>
            {allBets.length === 0 && (
              <div className="card text-center py-10"><p className="text-monaco-silver text-sm">No hay apuestas hoy</p></div>
            )}
            {allBets.map(bet => {
              const match = bet.matches
              const isFinished = match?.status === 'finished'
              const isExact = isFinished && bet.predicted_home === match.home_score && bet.predicted_away === match.away_score
              const isResult = isFinished && !isExact && (
                (bet.predicted_home > bet.predicted_away && match.home_score > match.away_score) ||
                (bet.predicted_home < bet.predicted_away && match.home_score < match.away_score) ||
                (bet.predicted_home === bet.predicted_away && match.home_score === match.away_score)
              )
              return (
                <div key={bet.id} className={`card mb-2 ${isExact ? 'border-green-500/30 bg-green-500/5' : isResult ? 'border-yellow-500/20 bg-yellow-500/5' : ''}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-monaco-red/20 border border-monaco-red/30 flex items-center justify-center text-xs text-monaco-red flex-shrink-0">
                      {bet.profiles?.avatar_url
                        ? <img src={bet.profiles.avatar_url} className="w-full h-full rounded-full object-cover" />
                        : bet.profiles?.full_name?.[0] ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-monaco-white text-sm font-medium truncate">{bet.profiles?.full_name ?? 'Usuario'}</p>
                      <p className="text-monaco-silver text-[10px]">Mesa {bet.table_number ?? '—'} · {new Date(bet.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {isFinished && (
                      <span className={`text-xs font-display flex-shrink-0 ${isExact ? 'text-green-400' : isResult ? 'text-yellow-400' : 'text-monaco-silver/50'}`}>+{bet.points_earned} pts</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between bg-monaco-black/50 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span>{match?.home_flag}</span>
                      <span className="text-monaco-white text-xs">{match?.home_team}</span>
                    </div>
                    <span className="text-monaco-red font-display text-lg">{bet.predicted_home} — {bet.predicted_away}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-monaco-white text-xs">{match?.away_team}</span>
                      <span>{match?.away_flag}</span>
                    </div>
                  </div>
                  {isFinished && (
                    <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-monaco-silver">Real:</span>
                      <span className={`text-xs font-display ${isExact ? 'text-green-400' : 'text-monaco-silver'}`}>{match.home_score} — {match.away_score}</span>
                      {isExact && <span className="text-[10px] text-green-400">✓ Exacto</span>}
                      {isResult && <span className="text-[10px] text-yellow-400">✓ Resultado</span>}
                      {!isExact && !isResult && <span className="text-[10px] text-monaco-silver/50">✗ Falló</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'ajustes' && (<div className="space-y-4">
          <div className="card space-y-2">
            <p className="text-monaco-white text-sm font-medium mb-3">Información del torneo</p>
            <InfoRow label="Partidos" value={`${matches.length} cargados`} /><InfoRow label="Finalizados" value={`${finishedMatches.length}`} />
            <InfoRow label="Jugadores" value={`${allUsers.filter(u => u.role === 'user').length}`} /><InfoRow label="Meseros" value={`${waiters.length}`} /><InfoRow label="Mesas" value={`${tables.length}`} />
          </div>
          <div className="card border-red-500/20 space-y-3">
            <p className="text-red-400 text-sm font-medium">Zona de riesgo</p>
            <button onClick={async () => { if (!confirm('¿Cerrar TODAS las mesas?')) return; for (const t of activeTables) { await closeTable({ tableNumber: t.table_number, closedBy: user.id }) }; qc.invalidateQueries({ queryKey: ['tables'] }); qc.invalidateQueries({ queryKey: ['sessions'] }); toast.success('Todas cerradas') }} className="w-full py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">Cerrar todas las mesas</button>
          </div>
        </div>)}
      </div>

      {closingTable && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6"><div className="bg-monaco-card rounded-3xl p-6 w-full max-w-xs border border-white/10 space-y-4">
        <div className="text-center"><DoorOpen size={32} className="text-monaco-red mx-auto mb-2" /><p className="font-display text-lg text-monaco-white">Cerrar Mesa {closingTable}</p><p className="text-monaco-silver text-xs mt-2">Se bloquearán los usuarios.</p></div>
        <div className="flex gap-2"><button onClick={() => setClosingTable(null)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-monaco-silver text-sm">Cancelar</button><button onClick={() => closeTableMut.mutate({ tableNumber: closingTable, closedBy: user.id })} disabled={closeTableMut.isPending} className="flex-1 py-3 bg-monaco-red rounded-xl text-white text-sm font-medium">{closeTableMut.isPending ? 'Cerrando...' : 'Confirmar'}</button></div>
      </div></div>)}

      {assigningPrize && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6"><div className="bg-monaco-card rounded-3xl p-6 w-full max-w-xs border border-white/10 space-y-4">
        <div className="text-center"><Gift size={28} className="text-monaco-red mx-auto mb-2" /><p className="font-display text-lg text-monaco-white">Asignar Premio</p><p className="text-monaco-silver text-xs mt-1">{assigningPrize.profiles?.full_name}</p></div>
        <div className="space-y-2">
          {[{ key: 'discount_5', label: 'Descuento 5%' }, { key: 'beer_bucket', label: 'Cubetazo de cerveza' }, { key: 'colombia_shirt', label: 'Camisa Selección Colombia' }, { key: 'custom', label: 'Premio especial' }].map(p => (
            <button key={p.key} onClick={() => setPrizeType(p.key)} className={`w-full py-2.5 rounded-xl text-sm text-left px-3 transition-all ${prizeType === p.key ? 'bg-monaco-red text-white' : 'bg-white/5 text-monaco-silver border border-white/10'}`}>{p.label}</button>
          ))}
          {prizeType === 'custom' && <input value={prizeDesc} onChange={e => setPrizeDesc(e.target.value)} placeholder="Describe el premio..." className="w-full bg-monaco-black border border-white/10 rounded-xl px-3 py-2.5 text-sm text-monaco-white placeholder-monaco-silver/40 focus:outline-none focus:border-monaco-red/50" />}
        </div>
        <div className="flex gap-2"><button onClick={() => { setAssigningPrize(null); setPrizeDesc('') }} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-monaco-silver text-sm">Cancelar</button><button onClick={() => assignPrizeMut.mutate({ userId: assigningPrize.user_id, matchId: assigningPrize.match_id, prizeType, description: prizeDesc, tableNumber: assigningPrize.table_number })} disabled={assignPrizeMut.isPending} className="flex-1 py-3 bg-monaco-red rounded-xl text-white text-sm font-medium">{assignPrizeMut.isPending ? 'Asignando...' : 'Asignar'}</button></div>
      </div></div>)}
    </div>
  )
}

function KPI({ label, value, color }) {
  return (<div className={`rounded-2xl px-2 py-2.5 text-center border ${color === 'green' ? 'bg-green-500/10 border-green-500/20' : color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/20' : color === 'silver' ? 'bg-white/5 border-white/10' : 'bg-monaco-red/10 border-monaco-red/20'}`}>
    <p className={`text-2xl font-display leading-none ${color === 'green' ? 'text-green-400' : color === 'yellow' ? 'text-yellow-400' : color === 'silver' ? 'text-monaco-white' : 'text-monaco-red'}`}>{value}</p>
    <p className="text-[9px] text-monaco-silver tracking-wide uppercase mt-1">{label}</p>
  </div>)
}
function StatCard({ label, value, accent }) {
  return (<div className={`card text-center ${accent ? 'border-monaco-red/30 bg-monaco-red/5' : ''}`}><p className={`text-2xl font-display ${accent ? 'text-monaco-red' : 'text-monaco-white'}`}>{value}</p><p className="text-[10px] text-monaco-silver tracking-widest uppercase mt-1">{label}</p></div>)
}
function InfoRow({ label, value }) {
  return (<div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"><span className="text-monaco-silver text-xs">{label}</span><span className="text-monaco-white text-xs font-medium">{value}</span></div>)
}
function LiveCard({ match, liveScore, onScoreChange, onUpdate, onFinish, isPending }) {
  return (<div className="card border-green-500/30 bg-green-500/5 space-y-3 mb-3">
    <div className="flex items-center justify-between"><span className="text-[10px] text-monaco-red tracking-widest uppercase">{match.group_name}</span><span className="flex items-center gap-1 text-[10px] text-green-400"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> EN VIVO</span></div>
    <div className="flex items-center justify-center gap-3">
      <span className="text-lg">{match.home_flag}</span><span className="text-monaco-white text-xs">{match.home_team}</span>
      <div className="px-4 py-1.5 bg-monaco-black rounded-xl border border-green-500/30"><span className="text-green-400 font-display text-xl">{match.home_score ?? 0} — {match.away_score ?? 0}</span></div>
      <span className="text-monaco-white text-xs">{match.away_team}</span><span className="text-lg">{match.away_flag}</span>
    </div>
    <div className="border-t border-white/5 pt-3"><p className="text-[10px] text-monaco-silver uppercase tracking-wide mb-2 flex items-center gap-1"><Zap size={10} className="text-yellow-400" /> Actualizar marcador</p>
      <div className="flex items-center gap-2">
        <input type="number" min="0" max="20" value={liveScore?.home ?? ''} onChange={e => onScoreChange('home', e.target.value)} placeholder={String(match.home_score ?? 0)} className="w-14 h-12 bg-monaco-black border border-white/10 rounded-xl text-center text-xl text-monaco-white font-display focus:outline-none focus:border-green-500/50" />
        <span className="text-monaco-silver">—</span>
        <input type="number" min="0" max="20" value={liveScore?.away ?? ''} onChange={e => onScoreChange('away', e.target.value)} placeholder={String(match.away_score ?? 0)} className="w-14 h-12 bg-monaco-black border border-white/10 rounded-xl text-center text-xl text-monaco-white font-display focus:outline-none focus:border-green-500/50" />
        <button onClick={onUpdate} disabled={isPending} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-xs font-medium"><Zap size={12} /> Actualizar</button>
      </div>
    </div>
    <button onClick={onFinish} disabled={isPending} className="w-full flex items-center justify-center gap-2 py-2.5 bg-monaco-red text-white rounded-xl text-xs font-medium"><Radio size={12} /> Finalizar</button>
  </div>)
}
function MatchAdminCard({ match, scores, setScores, onLive, onFinish, onToggleBet, isPending }) {
  const d = new Date(match.match_date), h = ((d.getUTCHours() - 5 + 24) % 24), ampm = h >= 12 ? 'PM' : 'AM', hour = h % 12 || 12
  const matchTime = `${hour}:${String(d.getUTCMinutes()).padStart(2,'0')} ${ampm}`
  return (<div className="card space-y-3 mb-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2"><span className="text-[10px] text-monaco-red tracking-widest uppercase">{match.group_name}</span><span className="text-[10px] text-monaco-silver">· {matchTime}</span></div>
      <button onClick={() => onToggleBet.mutate({ matchId: match.id, open: !match.betting_open })} className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all ${match.betting_open ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-monaco-silver'}`}>{match.betting_open ? <><Unlock size={8} /> Abiertas</> : <><Lock size={8} /> Cerradas</>}</button>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex flex-col items-center gap-1 flex-1"><span className="text-2xl">{match.home_flag}</span><span className="text-xs text-monaco-white text-center">{match.home_team}</span></div>
      <div className="flex items-center gap-2 mx-2">
        <input type="number" min="0" max="20" value={scores[match.id]?.home ?? ''} onChange={e => setScores(s => ({ ...s, [match.id]: { ...s[match.id], home: e.target.value } }))} placeholder="0" className="w-12 h-12 bg-monaco-black border border-white/10 rounded-xl text-center text-xl text-monaco-white font-display focus:outline-none focus:border-monaco-red/50" />
        <span className="text-monaco-silver">—</span>
        <input type="number" min="0" max="20" value={scores[match.id]?.away ?? ''} onChange={e => setScores(s => ({ ...s, [match.id]: { ...s[match.id], away: e.target.value } }))} placeholder="0" className="w-12 h-12 bg-monaco-black border border-white/10 rounded-xl text-center text-xl text-monaco-white font-display focus:outline-none focus:border-monaco-red/50" />
      </div>
      <div className="flex flex-col items-center gap-1 flex-1"><span className="text-2xl">{match.away_flag}</span><span className="text-xs text-monaco-white text-center">{match.away_team}</span></div>
    </div>
    <div className="flex gap-2">
      <button onClick={onLive} disabled={isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-medium"><Play size={12} /> En vivo</button>
      <button onClick={onFinish} disabled={isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-monaco-red text-white rounded-xl text-xs font-medium"><Radio size={12} /> Finalizar</button>
    </div>
  </div>)
}
function FinishedMatchCard({ match }) {
  const d = new Date(match.match_date), h = ((d.getUTCHours() - 5 + 24) % 24), ampm = h >= 12 ? 'PM' : 'AM', hour = h % 12 || 12
  const matchTime = `${hour}:${String(d.getUTCMinutes()).padStart(2,'0')} ${ampm}`
  return (<div className="card mb-2">
    <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="text-[10px] text-monaco-red tracking-widest uppercase">{match.group_name}</span><span className="text-[10px] text-monaco-silver">· {matchTime}</span></div><span className="text-[10px] text-monaco-silver bg-white/5 px-2 py-0.5 rounded-full">Finalizado</span></div>
    <div className="flex items-center gap-3"><span className="text-lg">{match.home_flag}</span><span className="text-monaco-white text-xs flex-1">{match.home_team}</span><div className="px-3 py-1 bg-monaco-black rounded-xl border border-white/10"><span className="text-monaco-red font-display text-lg">{match.home_score} — {match.away_score}</span></div><span className="text-monaco-white text-xs flex-1 text-right">{match.away_team}</span><span className="text-lg">{match.away_flag}</span></div>
  </div>)
}
function NightWinnerCard({ onAssign }) {
  const { data = [], isLoading } = useQuery({ queryKey: ['night-ranking'], queryFn: async () => { const today = new Date().toISOString().split('T')[0]; const { data, error } = await supabase.from('night_ranking').select('*').eq('night_date', today).order('night_points', { ascending: false }).limit(5); if (error) throw error; return data ?? [] }, refetchInterval: 15000 })
  return (<div className="card border-yellow-500/20 space-y-3">
    <p className="text-monaco-white font-medium text-sm flex items-center gap-2"><Crown size={14} className="text-yellow-400" /> Ranking de la noche</p>
    {isLoading && <p className="text-monaco-silver text-xs text-center py-3">Cargando...</p>}
    {!isLoading && data.length === 0 && <p className="text-monaco-silver text-xs text-center py-3">Aún no hay apuestas</p>}
    {data.map((p, i) => (<div key={p.id} className={`flex items-center gap-3 py-2 px-3 rounded-xl ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : ''}`}>
      <span className={`w-5 text-center font-display text-sm flex-shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-monaco-silver' : 'text-monaco-silver/40'}`}>{i + 1}</span>
      <div className="w-7 h-7 rounded-full bg-monaco-red/20 border border-monaco-red/30 flex items-center justify-center text-xs text-monaco-red flex-shrink-0">{p.avatar_url ? <img src={p.avatar_url} className="w-full h-full rounded-full object-cover" /> : p.full_name?.[0] ?? '?'}</div>
      <div className="flex-1 min-w-0"><p className="text-monaco-white text-xs font-medium truncate">{p.full_name ?? 'Anónimo'}</p></div>
      <div className="flex items-center gap-2 flex-shrink-0"><span className={`font-display text-sm ${i === 0 ? 'text-yellow-400' : 'text-monaco-red'}`}>{p.night_points} pts</span>
        {i === 0 && <button onClick={() => onAssign({ user_id: p.id, match_id: null, table_number: null, profiles: { full_name: p.full_name } })} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px]"><Gift size={10} /> Premio</button>}
      </div>
    </div>))}
  </div>)
}
function TournamentPrizeCard({ user, qc }) {
  const [pt, setPt] = useState('vip_table'); const [pd, setPd] = useState(''); const [a, setA] = useState(false)
  const { data: top } = useQuery({ queryKey: ['tournament-leader'], queryFn: async () => { const { data } = await supabase.from('profiles').select('id, full_name, avatar_url, total_points, total_correct').eq('role', 'user').order('total_points', { ascending: false }).limit(1).maybeSingle(); return data }, refetchInterval: 30000 })
  const { data: ep } = useQuery({ queryKey: ['tournament-prize'], queryFn: async () => { const { data } = await supabase.from('tournament_prizes').select('*, profiles(full_name)').not('winner_user_id', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle(); return data } })
  const am = useMutation({ mutationFn: async ({ winnerId, type, desc }) => { const { error } = await supabase.from('tournament_prizes').insert({ prize_type: type, prize_description: desc, winner_user_id: winnerId, awarded_at: new Date().toISOString(), created_by: user.id }); if (error) throw error }, onSuccess: () => { toast.success('¡Premio asignado!'); qc.invalidateQueries({ queryKey: ['tournament-prize'] }); setA(false) }, onError: (e) => toast.error(e.message) })
  return (<div className="card border-yellow-400/30 bg-yellow-400/5 space-y-3">
    <p className="text-monaco-white font-medium text-sm flex items-center gap-2"><Trophy size={14} className="text-yellow-400" /> Premio final del Mundial</p>
    {top && (<div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
      <div className="w-9 h-9 rounded-full bg-monaco-red/20 border border-monaco-red/30 flex items-center justify-center text-monaco-red font-display flex-shrink-0">{top.avatar_url ? <img src={top.avatar_url} className="w-full h-full rounded-full object-cover" /> : top.full_name?.[0] ?? '?'}</div>
      <div className="flex-1 min-w-0"><p className="text-monaco-white text-sm font-medium truncate">{top.full_name ?? 'Anónimo'}</p></div>
      <div className="text-right flex-shrink-0"><p className="text-yellow-400 font-display text-xl leading-none">{top.total_points}</p><p className="text-[10px] text-monaco-silver">pts</p></div>
    </div>)}
    {ep && (<div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-green-500/10 border border-green-500/20"><CheckCircle size={16} className="text-green-400 flex-shrink-0" /><p className="text-green-400 text-xs">Premio asignado a {ep.profiles?.full_name}</p></div>)}
    {!a ? <button onClick={() => setA(true)} disabled={!!ep} className="w-full py-2.5 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm font-medium disabled:opacity-40">{ep ? 'Ya entregado' : 'Asignar premio'}</button> : (
      <div className="space-y-2">{[{ key: 'vip_table', label: 'Mesa VIP + botella' }, { key: 'bottle', label: 'Botella premium' }, { key: 'custom', label: 'Personalizado' }].map(p => (
        <button key={p.key} onClick={() => setPt(p.key)} className={`w-full py-2 rounded-xl text-sm text-left px-3 transition-all ${pt === p.key ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400' : 'bg-white/5 text-monaco-silver border border-white/10'}`}>{p.label}</button>
      ))}{pt === 'custom' && <input value={pd} onChange={e => setPd(e.target.value)} placeholder="Describe..." className="w-full bg-monaco-black border border-white/10 rounded-xl px-3 py-2 text-sm text-monaco-white placeholder-monaco-silver/40 focus:outline-none focus:border-yellow-500/50" />}
      <div className="flex gap-2"><button onClick={() => setA(false)} className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-monaco-silver text-sm">Cancelar</button><button onClick={() => am.mutate({ winnerId: top?.id, type: pt, desc: pd })} disabled={!top || am.isPending} className="flex-1 py-2.5 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm font-medium disabled:opacity-50">{am.isPending ? '...' : '🏆 Confirmar'}</button></div></div>
    )}
  </div>)
}
function GrandPrizeConfig({ user }) {
  const [editing, setEditing] = useState(false); const [pt, setPt] = useState('vip_table'); const [pd, setPd] = useState(''); const qc = useQueryClient()
  const { data: gp } = useQuery({ queryKey: ['grand-prize-config'], queryFn: async () => { const { data } = await supabase.from('tournament_prize_config').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(); return data } })
  const sm = useMutation({ mutationFn: async ({ type, desc }) => { await supabase.from('tournament_prize_config').delete().neq('id', '00000000-0000-0000-0000-000000000000'); const { error } = await supabase.from('tournament_prize_config').insert({ prize_type: type, prize_description: desc, created_by: user.id }); if (error) throw error }, onSuccess: () => { toast.success('Premio mayor configurado'); qc.invalidateQueries({ queryKey: ['grand-prize-config'] }); setEditing(false) }, onError: (e) => toast.error(e.message) })
  const opts = [{ key: 'bottle_prem', label: 'Botella premium' }, { key: 'vip_table', label: 'Mesa VIP + botella' }, { key: 'vip_night', label: 'Noche VIP completa' }, { key: 'bottle_exclusive', label: 'Botella exclusiva + mesa VIP' }, { key: 'party_pack', label: 'Pack fiesta' }, { key: 'custom', label: 'Personalizado' }]
  return (<div className="card border-yellow-400/30 bg-yellow-400/5 space-y-3">
    <p className="text-monaco-white font-medium text-sm flex items-center gap-2"><Trophy size={14} className="text-yellow-400" /> Premio Mayor — Final del Mundial</p>
    {gp && !editing && (<div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20"><div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0"><Trophy size={20} className="text-yellow-400" /></div><div className="flex-1"><p className="text-monaco-white text-sm font-medium">🏆 {gp.prize_description || gp.prize_type}</p><p className="text-monaco-silver text-xs mt-0.5">Para el jugador con más puntos al final</p></div></div>)}
    {!gp && !editing && <p className="text-monaco-silver text-xs text-center py-2">No has configurado el premio mayor aún</p>}
    {!editing ? <button onClick={() => { if (gp) { setPt(gp.prize_type); setPd(gp.prize_description ?? '') }; setEditing(true) }} className="w-full py-2.5 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm font-medium">{gp ? 'Cambiar premio mayor' : 'Configurar premio mayor'}</button> : (
      <div className="space-y-2">{opts.map(p => (<button key={p.key} onClick={() => { setPt(p.key); if (p.key !== 'custom') setPd(p.label) }} className={`w-full py-2 rounded-xl text-sm text-left px-3 transition-all ${pt === p.key ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400' : 'bg-white/5 text-monaco-silver border border-white/10'}`}>{p.label}</button>))}
      {pt === 'custom' && <input value={pd} onChange={e => setPd(e.target.value)} placeholder="Describe el premio..." className="w-full bg-monaco-black border border-white/10 rounded-xl px-3 py-2 text-sm text-monaco-white placeholder-monaco-silver/40 focus:outline-none focus:border-yellow-500/50" />}
      <div className="flex gap-2"><button onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-monaco-silver text-sm">Cancelar</button><button onClick={() => sm.mutate({ type: pt, desc: pd })} disabled={sm.isPending} className="flex-1 py-2.5 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm font-medium disabled:opacity-50">{sm.isPending ? '...' : '🏆 Guardar'}</button></div></div>
    )}
    <p className="text-yellow-400/50 text-[10px] text-center">Los clientes ven este premio en su pantalla</p>
  </div>)
}
