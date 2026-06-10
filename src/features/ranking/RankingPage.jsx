import { useRanking }   from './useRanking'
import { useAuthStore } from '@/store/authStore'
import LoadingScreen    from '@/components/ui/LoadingScreen'
import { Crown, Trophy, Star } from 'lucide-react'

export default function RankingPage() {
  const { user }                          = useAuthStore()
  const { data: ranking = [], isLoading } = useRanking()

  if (isLoading) return <LoadingScreen />

  const myPosition  = ranking.findIndex(r => r.id === user?.id) + 1
  const me          = ranking.find(r => r.id === user?.id)
  const nightLeader = [...ranking].sort((a, b) => b.today_points - a.today_points)[0]

  return (
    <div className="min-h-screen bg-monaco-black pb-24">

      {/* Header */}
      <div className="px-5 pt-10 pb-6 bg-gradient-to-b from-[#1a0508] to-monaco-black">
        <h1 className="font-display text-2xl text-monaco-white tracking-wide">
          Ranking
        </h1>
        <p className="text-monaco-silver text-xs mt-0.5">
          Mundial 2026 · Tiempo real
        </p>
        <div className="w-8 h-px bg-monaco-red mt-3" />
      </div>

      <div className="px-4 space-y-4">

        {/* Mi posición */}
        {me && (
          <div className="card border-monaco-red/30 bg-monaco-red/5">
            <p className="text-[10px] text-monaco-red tracking-widest uppercase mb-2">
              Tu posición
            </p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-display text-monaco-red">#{myPosition}</p>
                <p className="text-[10px] text-monaco-silver mt-0.5">Global</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-display text-monaco-white">{me.total_points}</p>
                <p className="text-[10px] text-monaco-silver mt-0.5">Pts totales</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-display text-yellow-400">{me.today_points}</p>
                <p className="text-[10px] text-monaco-silver mt-0.5">Pts hoy</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-display text-monaco-white">{me.total_correct}</p>
                <p className="text-[10px] text-monaco-silver mt-0.5">Aciertos</p>
              </div>
            </div>
          </div>
        )}

        {/* Líder de la noche */}
        {nightLeader && nightLeader.today_points > 0 && (
          <div className="card border-yellow-500/30 bg-yellow-500/5">
            <p className="text-[10px] text-yellow-400 tracking-widest uppercase mb-2 flex items-center gap-1">
              <Star size={10} /> Líder de esta noche
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-400
                              flex items-center justify-center text-yellow-400 font-display flex-shrink-0">
                {nightLeader.avatar_url
                  ? <img src={nightLeader.avatar_url} className="w-full h-full rounded-full object-cover" />
                  : nightLeader.full_name?.[0] ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-monaco-white text-sm font-medium truncate">
                  {nightLeader.full_name ?? 'Anónimo'}
                  {nightLeader.id === user?.id && (
                    <span className="text-yellow-400 text-[10px] ml-1">¡Eres tú!</span>
                  )}
                </p>
                <p className="text-monaco-silver text-xs">
                  {nightLeader.today_correct} aciertos esta noche
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-yellow-400 font-display text-2xl leading-none">
                  {nightLeader.today_points}
                </p>
                <p className="text-[10px] text-monaco-silver">pts hoy</p>
              </div>
            </div>
          </div>
        )}

        {/* Podio top 3 */}
        {ranking.length >= 3 && (
          <div className="flex items-end justify-center gap-3 pt-2">
            <PodiumCard player={ranking[1]} position={2} isMe={ranking[1]?.id === user?.id} />
            <PodiumCard player={ranking[0]} position={1} isMe={ranking[0]?.id === user?.id} tall />
            <PodiumCard player={ranking[2]} position={3} isMe={ranking[2]?.id === user?.id} />
          </div>
        )}

        {/* Tabla completa */}
        <div>
          {/* Headers */}
          <div className="flex items-center gap-2 px-3 mb-2">
            <span className="w-6 flex-shrink-0" />
            <span className="flex-1 text-[10px] text-monaco-silver/50 uppercase tracking-widest">
              Jugador
            </span>
            <span className="w-14 text-center text-[10px] text-yellow-400/70 uppercase tracking-widest">
              Hoy
            </span>
            <span className="w-14 text-center text-[10px] text-monaco-silver/50 uppercase tracking-widest">
              Total
            </span>
          </div>

          <div className="space-y-2">
            {ranking.map((player, i) => (
              <div
                key={player.id}
                className={`card flex items-center gap-2 py-3 transition-all
                  ${player.id === user?.id
                    ? 'border-monaco-red/30 bg-monaco-red/5'
                    : i === 0 ? 'border-yellow-400/20 bg-yellow-400/3' : ''}`}
              >
                {/* Posición */}
                <span className={`w-6 text-center font-display text-sm flex-shrink-0
                  ${i === 0 ? 'text-yellow-400' :
                    i === 1 ? 'text-monaco-silver' :
                    i === 2 ? 'text-amber-600' : 'text-monaco-silver/40'}`}>
                  {i + 1}
                </span>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-monaco-red/20 border border-monaco-red/30
                                flex items-center justify-center text-xs text-monaco-red flex-shrink-0">
                  {player.avatar_url
                    ? <img src={player.avatar_url} className="w-full h-full rounded-full object-cover" />
                    : player.full_name?.[0] ?? '?'}
                </div>

                {/* Nombre */}
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

                {/* Puntos hoy */}
                <div className="w-14 text-center flex-shrink-0">
                  {player.today_points > 0 ? (
                    <span className="text-yellow-400 font-display text-base">
                      +{player.today_points}
                    </span>
                  ) : (
                    <span className="text-monaco-silver/30 text-sm">—</span>
                  )}
                </div>

                {/* Puntos totales */}
                <div className="w-14 text-center flex-shrink-0">
                  <span className="text-monaco-red font-display text-base">
                    {player.total_points}
                  </span>
                </div>
              </div>
            ))}

            {ranking.length === 0 && (
              <div className="card text-center py-10">
                <Trophy size={32} className="text-monaco-silver/20 mx-auto mb-3" />
                <p className="text-monaco-silver text-sm">
                  Aún no hay apuestas registradas
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PodiumCard({ player, position, isMe, tall }) {
  const medals   = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const heights  = { 1: 'h-16', 2: 'h-10', 3: 'h-8' }
  const borders  = {
    1: 'border-yellow-400',
    2: 'border-monaco-silver',
    3: 'border-amber-600'
  }

  return (
    <div className={`flex flex-col items-center gap-1 flex-1 ${tall ? '' : 'mb-4'}`}>
      <span className="text-lg">{medals[position]}</span>
      <div className={`w-11 h-11 rounded-full bg-monaco-red/20 border-2 ${borders[position]}
                      flex items-center justify-center text-xs font-medium text-monaco-red
                      ${isMe ? 'ring-2 ring-monaco-red ring-offset-1 ring-offset-monaco-black' : ''}`}>
        {player?.avatar_url
          ? <img src={player.avatar_url} className="w-full h-full rounded-full object-cover" />
          : player?.full_name?.[0] ?? '?'}
      </div>
      <p className="text-monaco-white text-[10px] text-center truncate w-full px-1 font-medium">
        {player?.full_name?.split(' ')[0] ?? 'Anónimo'}
        {isMe && <span className="text-monaco-red"> ★</span>}
      </p>
      <div className={`w-full rounded-t-lg flex flex-col items-center justify-center py-1 gap-0.5 ${heights[position]}
        ${position === 1 ? 'bg-yellow-400/20' :
          position === 2 ? 'bg-monaco-silver/10' : 'bg-amber-600/10'}`}>
        <span className="text-monaco-red font-display text-sm leading-none">
          {player?.total_points ?? 0}
        </span>
        {(player?.today_points ?? 0) > 0 && (
          <span className="text-yellow-400 text-[9px]">+{player.today_points} hoy</span>
        )}
      </div>
    </div>
  )
}