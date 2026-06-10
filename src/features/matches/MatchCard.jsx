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

  const matchTime = (() => {
    const d    = new Date(match.match_date)
    const h    = ((d.getUTCHours() - 5 + 24) % 24)
    const m    = d.getUTCMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    const mins = m > 0 ? `:${String(m).padStart(2, '0')}` : ''
    return `${hour}${mins} ${ampm}`
  })()

  // Marcador a mostrar — real si está en vivo o finalizado
  const displayHome = (isLive || isFinished) ? (match.home_score ?? 0) : home
  const displayAway = (isLive || isFinished) ? (match.away_score ?? 0) : away

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

      {/* Equipos y marcador */}
      <div className="flex items-center justify-between mb-4">

        {/* Local */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-2xl">{match.home_flag}</span>
          <span className="text-xs text-monaco-white font-medium text-center">
            {match.home_team}
          </span>
        </div>

        {/* Selector */}
        <div className="flex items-center gap-2 mx-2">

          {/* Goles local */}
          <div className="flex flex-col items-center gap-1">
            {canBet && !hasBet && !isLive && (
              <button onClick={() => adjust('home', 1)}
                className="w-6 h-6 rounded bg-white/5 text-monaco-silver text-sm
                           flex items-center justify-center active:bg-white/10">+</button>
            )}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                            text-xl font-display font-bold
                            ${isLive
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : hasBet
                                ? 'bg-monaco-red/20 text-monaco-red border border-monaco-red/30'
                                : 'bg-white/5 text-monaco-white border border-white/10'}`}>
              {displayHome}
            </div>
            {canBet && !hasBet && !isLive && (
              <button onClick={() => adjust('home', -1)}
                className="w-6 h-6 rounded bg-white/5 text-monaco-silver text-sm
                           flex items-center justify-center active:bg-white/10">−</button>
            )}
          </div>

          <span className="text-monaco-silver text-lg">—</span>

          {/* Goles visitante */}
          <div className="flex flex-col items-center gap-1">
            {canBet && !hasBet && !isLive && (
              <button onClick={() => adjust('away', 1)}
                className="w-6 h-6 rounded bg-white/5 text-monaco-silver text-sm
                           flex items-center justify-center active:bg-white/10">+</button>
            )}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                            text-xl font-display font-bold
                            ${isLive
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : hasBet
                                ? 'bg-monaco-red/20 text-monaco-red border border-monaco-red/30'
                                : 'bg-white/5 text-monaco-white border border-white/10'}`}>
              {displayAway}
            </div>
            {canBet && !hasBet && !isLive && (
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

      {/* Footer */}
      {canBet && !hasBet && !isLive && (
        <button onClick={handleBet} disabled={isPending} className="btn-primary text-sm py-2.5">
          {isPending ? 'Registrando...' : 'Apostar este marcador'}
        </button>
      )}

      {canBet && !hasBet && isLive && match.betting_open && (
        <button onClick={handleBet} disabled={isPending} className="btn-primary text-sm py-2.5">
          {isPending ? 'Registrando...' : 'Apostar marcador actual'}
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