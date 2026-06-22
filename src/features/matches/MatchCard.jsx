import { useState, useEffect } from 'react'
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

  // ¿Puede apostar ahora? (upcoming O live con apuestas abiertas)
  const canBetNow = canBet && !hasBet && (
    match.status === 'upcoming' || (isLive && match.betting_open)
  )

  function adjust(side, delta) {
    if (!canBetNow) return
    if (side === 'home') setHome(v => Math.max(0, v + delta))
    else                 setAway(v => Math.max(0, v + delta))
  }

  function handleBet() {
    if (!canBetNow || isPending) return
    placeBet({
      matchId:       match.id,
      tableNumber,
      predictedHome: home,
      predictedAway: away,
    })
  }

  const matchTime = (() => {
    const d    = new Date(match.match_date)
    const h    = ((d.getUTCHours() - 5 + 24) % 24)
    const m    = d.getUTCMinutes()
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

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-monaco-red tracking-widest uppercase">
          {match.group_name}
        </span>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-green-400">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                En vivo
              </span>
              {match.betting_open && match.live_started_at && (
                <BettingCountdown liveStartedAt={match.live_started_at} />
              )}
              {!match.betting_open && (
                <span className="text-[10px] text-monaco-silver/50 flex items-center gap-1">
                  <Lock size={10} /> Apuestas cerradas
                </span>
              )}
            </div>
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

      {/* Marcador en vivo — mostrar arriba cuando está en vivo */}
      {isLive && (
        <div className="flex items-center justify-center gap-2 mb-3 py-1.5 rounded-xl
                        bg-green-500/10 border border-green-500/20">
          <span className="text-[10px] text-green-400 uppercase tracking-wide">Marcador actual:</span>
          <span className="text-green-400 font-display text-sm">
            {match.home_score ?? 0} — {match.away_score ?? 0}
          </span>
        </div>
      )}

      {/* Equipos y selector de marcador */}
      <div className="flex items-center justify-between mb-4">

        {/* Local */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-2xl">{match.home_flag}</span>
          <span className="text-xs text-monaco-white font-medium text-center">
            {match.home_team}
          </span>
        </div>

        {/* Selector de predicción */}
        <div className="flex items-center gap-2 mx-2">

          {/* Goles local */}
          <div className="flex flex-col items-center gap-1">
            {canBetNow && (
              <button onClick={() => adjust('home', 1)}
                className="w-6 h-6 rounded bg-white/5 text-monaco-silver text-sm
                           flex items-center justify-center active:bg-white/10">+</button>
            )}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                            text-xl font-display font-bold
                            ${canBetNow
                              ? 'bg-white/5 text-monaco-white border border-white/10'
                              : isLive && hasBet
                                ? 'bg-monaco-red/20 text-monaco-red border border-monaco-red/30'
                              : isFinished && correct
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : hasBet
                                ? 'bg-monaco-red/20 text-monaco-red border border-monaco-red/30'
                              : isFinished
                                ? 'bg-white/5 text-monaco-white border border-white/10'
                                : 'bg-white/5 text-monaco-white border border-white/10'}`}>
              {hasBet ? existingBet.predicted_home :
               isFinished ? match.home_score :
               home}
            </div>
            {canBetNow && (
              <button onClick={() => adjust('home', -1)}
                className="w-6 h-6 rounded bg-white/5 text-monaco-silver text-sm
                           flex items-center justify-center active:bg-white/10">−</button>
            )}
          </div>

          <span className="text-monaco-silver text-lg">—</span>

          {/* Goles visitante */}
          <div className="flex flex-col items-center gap-1">
            {canBetNow && (
              <button onClick={() => adjust('away', 1)}
                className="w-6 h-6 rounded bg-white/5 text-monaco-silver text-sm
                           flex items-center justify-center active:bg-white/10">+</button>
            )}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                            text-xl font-display font-bold
                            ${canBetNow
                              ? 'bg-white/5 text-monaco-white border border-white/10'
                              : isLive && hasBet
                                ? 'bg-monaco-red/20 text-monaco-red border border-monaco-red/30'
                              : isFinished && correct
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : hasBet
                                ? 'bg-monaco-red/20 text-monaco-red border border-monaco-red/30'
                              : isFinished
                                ? 'bg-white/5 text-monaco-white border border-white/10'
                                : 'bg-white/5 text-monaco-white border border-white/10'}`}>
              {hasBet ? existingBet.predicted_away :
               isFinished ? match.away_score :
               away}
            </div>
            {canBetNow && (
              <button onClick={() => adjust('away', -1)}
                className="w-6 h-6 rounded bg-white/5 text-monaco-silver text-sm
                           flex items-center justify-center active:bg-white/10">−</button>
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

      {/* Botón apostar */}
      {canBetNow && (
        <button onClick={handleBet} disabled={isPending} className="btn-primary text-sm py-2.5">
          {isPending ? 'Registrando...' : 'Apostar este marcador'}
        </button>
      )}

      {/* Ya apostó — partido en curso */}
      {hasBet && !isFinished && (
        <div className="flex items-center justify-center gap-2 py-2">
          <CheckCircle size={14} className="text-monaco-red" />
          <span className="text-xs text-monaco-red tracking-wide">
            Apostaste {existingBet.predicted_home} — {existingBet.predicted_away}
          </span>
        </div>
      )}

      {/* Ya apostó — partido finalizado */}
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
                  Apostaste {existingBet.predicted_home} — {existingBet.predicted_away} · +{existingBet.points_earned} pt
                </span></>
          }
        </div>
      )}

      {/* No puede apostar */}
      {!canBet && !hasBet && !isFinished && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Lock size={12} className="text-monaco-silver/50" />
          <span className="text-xs text-monaco-silver/50">
            Activa tu mesa para apostar
          </span>
        </div>
      )}

      {/* Live con apuestas cerradas y no apostó */}
      {canBet && !hasBet && isLive && !match.betting_open && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Lock size={12} className="text-monaco-silver/50" />
          <span className="text-xs text-monaco-silver/50">
            Tiempo de apuestas terminado
          </span>
        </div>
      )}
    </div>
  )
}

function BettingCountdown({ liveStartedAt }) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!liveStartedAt) return

    function calc() {
      const started  = new Date(liveStartedAt).getTime()
      const deadline = started + 15 * 60 * 1000
      const diff     = Math.max(0, deadline - Date.now())
      setRemaining(diff)
    }

    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [liveStartedAt])

  if (remaining === null) return null
  if (remaining === 0) return (
    <span className="text-[10px] text-monaco-silver/50 flex items-center gap-1">
      <Lock size={10} /> Cerradas
    </span>
  )

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)

  return (
    <span className={`text-[10px] flex items-center gap-1
      ${remaining < 60000 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
      ⏱ {mins}:{String(secs).padStart(2, '0')} para apostar
    </span>
  )
}