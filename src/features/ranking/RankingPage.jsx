import { useRanking }   from './useRanking'
import { useAuthStore } from '@/store/authStore'
import LoadingScreen    from '@/components/ui/LoadingScreen'
import { Crown, Medal } from 'lucide-react'

export default function RankingPage() {
  const { user }                          = useAuthStore()
  const { data: ranking = [], isLoading } = useRanking()

  if (isLoading) return <LoadingScreen />

  const myPosition = ranking.findIndex(r => r.id === user?.id) + 1

  return (
    <div className="min-h-screen bg-monaco-black pb-24">

      {/* Header */}
      <div className="px-5 pt-10 pb-6 bg-gradient-to-b from-[#1a0508] to-monaco-black">
        <h1 className="font-display text-2xl text-monaco-white tracking-wide">
          Ranking
        </h1>
        <p className="text-monaco-silver text-xs mt-0.5">
          Torneo Mundial 2026
        </p>
        <div className="w-8 h-px bg-monaco-red mt-3" />
      </div>

      <div className="px-4">

        {/* Mi posición */}
        {myPosition > 0 && (
          <div className="card border-monaco-red/30 bg-monaco-red/5 mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-monaco-red tracking-widest uppercase mb-0.5">
                Tu posición
              </p>
              <p className="text-monaco-white text-2xl font-display">
                #{myPosition}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-monaco-silver tracking-widest uppercase mb-0.5">
                Puntos
              </p>
              <p className="text-monaco-red text-2xl font-display">
                {ranking[myPosition - 1]?.total_points ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* Top 3 */}
        {ranking.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-6">
            {/* Segundo */}
            <PodiumCard user={ranking[1]} position={2} />
            {/* Primero */}
            <PodiumCard user={ranking[0]} position={1} tall />
            {/* Tercero */}
            <PodiumCard user={ranking[2]} position={3} />
          </div>
        )}

        {/* Lista completa */}
        <p className="section-label">Tabla completa</p>
        <div className="space-y-2">
          {ranking.map((player, i) => (
            <div
              key={player.id}
              className={`card flex items-center gap-3 py-3
                ${player.id === user?.id ? 'border-monaco-red/30 bg-monaco-red/5' : ''}`}
            >
              <span className={`w-6 text-center text-sm font-display
                ${i === 0 ? 'text-yellow-400' :
                  i === 1 ? 'text-monaco-silver' :
                  i === 2 ? 'text-amber-600' : 'text-monaco-silver/50'}`}>
                {i + 1}
              </span>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-monaco-red/20 border border-monaco-red/30
                              flex items-center justify-center text-xs font-medium text-monaco-red flex-shrink-0">
                {player.avatar_url
                  ? <img src={player.avatar_url} className="w-full h-full rounded-full object-cover" />
                  : initials(player.full_name)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-monaco-white text-sm font-medium truncate">
                  {player.full_name ?? 'Anónimo'}
                  {player.id === user?.id && (
                    <span className="text-monaco-red text-[10px] ml-1">(Tú)</span>
                  )}
                </p>
                <p className="text-monaco-silver text-[10px]">
                  {player.total_correct} aciertos · {player.total_bets} apuestas
                </p>
              </div>

              <span className="text-monaco-red font-display text-lg">
                {player.total_points}
              </span>
            </div>
          ))}

          {ranking.length === 0 && (
            <div className="card text-center py-10">
              <p className="text-monaco-silver text-sm">
                Aún no hay apuestas registradas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PodiumCard({ user, position, tall }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return (
    <div className={`flex flex-col items-center gap-1 flex-1 ${tall ? 'mb-0' : 'mb-4'}`}>
      <span className="text-lg">{medals[position]}</span>
      <div className={`w-10 h-10 rounded-full bg-monaco-red/20 border-2
                      flex items-center justify-center text-xs font-medium text-monaco-red
                      ${position === 1 ? 'border-yellow-400' :
                        position === 2 ? 'border-monaco-silver' : 'border-amber-600'}`}>
        {user?.avatar_url
          ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" />
          : initials(user?.full_name)}
      </div>
      <p className="text-monaco-white text-[10px] text-center truncate w-full px-1">
        {user?.full_name?.split(' ')[0] ?? 'Anónimo'}
      </p>
      <div className={`w-full rounded-t-lg flex items-center justify-center py-1
                      ${position === 1 ? 'bg-yellow-400/20 h-14' :
                        position === 2 ? 'bg-monaco-silver/10 h-10' : 'bg-amber-600/10 h-8'}`}>
        <span className="text-monaco-red font-display text-sm">
          {user?.total_points ?? 0}
        </span>
      </div>
    </div>
  )
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}