import { useState } from 'react'
import { format }   from 'date-fns'
import { es }       from 'date-fns/locale'
import { CheckCircle, Lock, Clock } from 'lucide-react'
import { usePlaceBet } from '@/features/bets/useBets'

export default function MatchCard({ match, existingBet, canBet, tableNumber }) {
  const [home, setHome] = useState(existingBet?.predicted_home ?? 0)
  const [away, setAway] = useState(existingBet?.predicted_away ?? 0)
  const { mutate: placeBet, isPending } = usePlaceBet()

  const isFinished = match.status === 'finished'
  const isLive     = match.status === 'live'
  const hasBet     = !!existingBet
  const correct    = existingBet?.is_correct

  function adjust(side, delta) {
    if (!canBet || hasBet) return
    if (side === 'home') setHome(v => Math.max(0, v + delta))
    else                 setAway(v => Math.max(0, v + delta))
  }

  function handleBet() {
    if (!canBet || isPending) return
    placeBet({
      matchId:       match.id,
      tableNumber,
      predictedHome: home,
      predictedAway: away,
    })
  }

  // Mostrar hora Colombia directamente sin conversión del navegador
const matchTime = (() => {
  const d = new Date(match.match_date)
  // Convertir UTC a Colombia (UTC-5)
  const h = ((d.getUTCHours() - 5 + 24) % 24)
  const m = d.getUTCMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  const mins = m > 0 ? `:${String(m).padStart(2, '0')}` : ''
  return `${hour}${mins} ${ampm}`
})()

  return (
    <div className={`card transition-all ${
      correct === true  ? 'border-green-500/30 bg-green-500/5' :
      correct === false ? 'border-white/5' :
      hasBet            ? 'border-monaco-red/30' : ''
    }`}>

      {/* Header del partido */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-monaco-red tracking-widest uppercase">
          {match.group_name}
        </span>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              En vivo
            </span>
          )}
          {!isLive && !isFinished && (
            <span className="flex items-center gap-1 text-[10px] text-monaco-silver">
              <Clock size={10} />
              {matchTime}
            </span>
          )}
          {isFinished && (
            <span className="text-[10px] text-monaco-silver">Finalizado</span>
          )}
        </div>
      </div>

      {/* Equipos y marcador */}
      <div className="flex items-center justify-between mb-4">

        {/* Local */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-2xl">{match.home_flag}</span>
          <span className="text-xs text-monaco-white font-medium text-center">
            {match.home_team}
          </span>
        </div>

        {/* Selector de marcador */}
        <div className="flex items-center gap-2 mx-2">
          {/* Goles local */}
          <div className="flex flex-col items-center gap-1">
            {canBet && !hasBet && (
              <button onClick={() => adjust('home', 1)}
                className="w-6 h-6 rounded bg-white/5 text-monaco-silver text-sm
                           flex items-center justify-center active:bg-white/10">
                +
              </button>
            )}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                            text-xl font-display font-bold
                            ${hasBet ? 'bg-monaco-red/20 text-monaco-red border border-monaco-red/30'
                                     : 'bg-white/5 text-monaco-white border border-white/10'}`}>
              {isFinished ? match.home_score : home}
            </div>
            {canBet && !hasBet && (
              <button onClick={() => adjust('home', -1)}
                className="w-6 h-6 rounded bg-white/5 text-monaco-silver text-sm
                           flex items-center justify-center active:bg-white/10">
                −
              </button>
            )}
          </div>

          <span className="text-monaco-silver text-lg">—</span>

          {/* Goles visitante */}
          <div className="flex flex-col items-center gap-1">
            {canBet && !hasBet && (
              <button onClick={() => adjust('away', 1)}
                className="w-6 h-6 rounded bg-white/5 text-monaco-silver text-sm
                           flex items-center justify-center active:bg-white/10">
                +
              </button>
            )}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                            text-xl font-display font-bold
                            ${hasBet ? 'bg-monaco-red/20 text-monaco-red border border-monaco-red/30'
                                     : 'bg-white/5 text-monaco-white border border-white/10'}`}>
              {isFinished ? match.away_score : away}
            </div>
            {canBet && !hasBet && (
              <button onClick={() => adjust('away', -1)}
                className="w-6 h-6 rounded bg-white/5 text-monaco-silver text-sm
                           flex items-center justify-center active:bg-white/10">
                −
              </button>
            )}
          </div>
        </div>

        {/* Visitante */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-2xl">{match.away_flag}</span>
          <span className="text-xs text-monaco-white font-medium text-center">
            {match.away_team}
          </span>
        </div>
      </div>

      {/* Footer — acción */}
      {canBet && !hasBet && (
        <button
          onClick={handleBet}
          disabled={isPending}
          className="btn-primary text-sm py-2.5"
        >
          {isPending ? 'Registrando...' : 'Apostar este marcador'}
        </button>
      )}

      {hasBet && !isFinished && (
        <div className="flex items-center justify-center gap-2 py-2">
          <CheckCircle size={14} className="text-monaco-red" />
          <span className="text-xs text-monaco-red tracking-wide">
            Apostaste {existingBet.predicted_home} — {existingBet.predicted_away}
          </span>
        </div>
      )}

      {hasBet && isFinished && (
        <div className={`flex items-center justify-center gap-2 py-2 rounded-xl
                        ${correct ? 'bg-green-500/10' : 'bg-white/5'}`}>
          {correct
            ? <><CheckCircle size={14} className="text-green-400" />
                <span className="text-xs text-green-400">
                  ¡Acertaste! +{existingBet.points_earned} pts
                </span></>
            : <><Lock size={14} className="text-monaco-silver" />
                <span className="text-xs text-monaco-silver">
                  Apostaste {existingBet.predicted_home} — {existingBet.predicted_away}
                </span></>
          }
        </div>
      )}

      {!canBet && !hasBet && !isFinished && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Lock size={12} className="text-monaco-silver/50" />
          <span className="text-xs text-monaco-silver/50">
            Activa tu mesa para apostar
          </span>
        </div>
      )}
    </div>
  )
}