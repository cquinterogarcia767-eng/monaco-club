import { useMyBets }  from './useBets'
import { useAuthStore } from '@/store/authStore'
import { format }     from 'date-fns'
import { es }         from 'date-fns/locale'
import { CheckCircle, XCircle, Clock, Trophy } from 'lucide-react'
import LoadingScreen  from '@/components/ui/LoadingScreen'

export default function BetsPage() {
  const { profile }                        = useAuthStore()
  const { data: bets = [], isLoading }     = useMyBets()

  if (isLoading) return <LoadingScreen />

  const pending  = bets.filter(b => b.is_correct === null)
  const correct  = bets.filter(b => b.is_correct === true)
  const wrong    = bets.filter(b => b.is_correct === false)

  return (
    <div className="min-h-screen bg-monaco-black pb-24">

      {/* Header */}
      <div className="px-5 pt-10 pb-6 bg-gradient-to-b from-[#1a0508] to-monaco-black">
        <h1 className="font-display text-2xl text-monaco-white tracking-wide">
          Mis Apuestas
        </h1>
        <p className="text-monaco-silver text-xs mt-0.5">
          Historial del torneo
        </p>
        <div className="w-8 h-px bg-monaco-red mt-3" />
      </div>

      <div className="px-4 space-y-5">

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Total"     value={bets.length}    />
          <MiniStat label="Aciertos"  value={correct.length} accent />
          <MiniStat label="Pendientes" value={pending.length} />
        </div>

        {/* Sin apuestas */}
        {bets.length === 0 && (
          <div className="card text-center py-12">
            <Trophy size={36} className="text-monaco-silver/20 mx-auto mb-3" />
            <p className="text-monaco-white text-sm font-medium mb-1">
              Aún no tienes apuestas
            </p>
            <p className="text-monaco-silver text-xs leading-relaxed">
              Ve a Partidos y apuesta el<br />marcador de los juegos de hoy
            </p>
          </div>
        )}

        {/* Pendientes */}
        {pending.length > 0 && (
          <div>
            <p className="section-label flex items-center gap-2">
              <Clock size={12} /> En espera de resultado
            </p>
            <div className="space-y-2">
              {pending.map(bet => <BetCard key={bet.id} bet={bet} />)}
            </div>
          </div>
        )}

        {/* Acertadas */}
        {correct.length > 0 && (
          <div>
            <p className="section-label flex items-center gap-2">
              <CheckCircle size={12} className="text-green-400" /> Acertadas
            </p>
            <div className="space-y-2">
              {correct.map(bet => <BetCard key={bet.id} bet={bet} />)}
            </div>
          </div>
        )}

        {/* Falladas */}
        {wrong.length > 0 && (
          <div>
            <p className="section-label flex items-center gap-2">
              <XCircle size={12} /> Falladas
            </p>
            <div className="space-y-2">
              {wrong.map(bet => <BetCard key={bet.id} bet={bet} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BetCard({ bet }) {
  const match    = bet.matches
  const pending  = bet.is_correct === null
  const correct  = bet.is_correct === true

  const matchTime = (() => {
    if (!match?.match_date) return ''
    const d = new Date(match.match_date)
    let h = d.getUTCHours()
    const m = d.getUTCMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    const mins = m > 0 ? `:${String(m).padStart(2, '0')}` : ''
    return `${h}${mins} ${ampm}`
  })()

  return (
    <div className={`card transition-all
      ${correct  ? 'border-green-500/30 bg-green-500/5' :
        pending  ? 'border-monaco-red/20' : 'border-white/5'}`}>

      <div className="flex items-start gap-3">

        {/* Estado */}
        <div className="flex-shrink-0 mt-0.5">
          {pending && <Clock       size={16} className="text-monaco-red animate-pulse-red" />}
          {correct && <CheckCircle size={16} className="text-green-400" />}
          {!pending && !correct && <XCircle size={16} className="text-monaco-silver/40" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">

          {/* Grupo */}
          <p className="text-[10px] text-monaco-red tracking-widest uppercase mb-1">
            {match?.group_name} · {matchTime}
          </p>

          {/* Equipos */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{match?.home_flag}</span>
            <span className="text-monaco-white text-xs font-medium truncate">
              {match?.home_team}
            </span>
            <span className="text-monaco-silver text-xs">vs</span>
            <span className="text-monaco-white text-xs font-medium truncate">
              {match?.away_team}
            </span>
            <span className="text-base">{match?.away_flag}</span>
          </div>

          {/* Marcadores */}
          <div className="flex items-center gap-3">

            {/* Tu apuesta */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-monaco-silver uppercase tracking-wide">
                Tu apuesta:
              </span>
              <span className={`text-sm font-display font-bold
                ${correct ? 'text-green-400' : 'text-monaco-red'}`}>
                {bet.predicted_home} — {bet.predicted_away}
              </span>
            </div>

            {/* Resultado real */}
            {match?.status === 'finished' && (
              <>
                <span className="text-monaco-silver/30">·</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-monaco-silver uppercase tracking-wide">
                    Real:
                  </span>
                  <span className="text-sm font-display font-bold text-monaco-white">
                    {match.home_score} — {match.away_score}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Fecha */}
          <p className="text-monaco-silver/40 text-[10px] mt-1.5">
            Apostado el {format(new Date(bet.created_at), "d MMM · h:mm a", { locale: es })}
            {' · '} Mesa {bet.table_number}
          </p>
        </div>

        {/* Puntos */}
        <div className="flex-shrink-0 text-right">
          {correct && (
            <div>
              <p className="text-monaco-red font-display text-lg leading-none">
                +{bet.points_earned}
              </p>
              <p className="text-[10px] text-monaco-silver/50">pts</p>
            </div>
          )}
          {pending && (
            <div className="w-2 h-2 rounded-full bg-monaco-red animate-pulse-red" />
          )}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, accent }) {
  return (
    <div className={`card text-center py-3 ${accent ? 'border-monaco-red/30 bg-monaco-red/5' : ''}`}>
      <p className={`text-xl font-display ${accent ? 'text-monaco-red' : 'text-monaco-white'}`}>
        {value}
      </p>
      <p className="text-[10px] text-monaco-silver tracking-widest uppercase mt-0.5">
        {label}
      </p>
    </div>
  )
}