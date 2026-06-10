import { useState }            from 'react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { es }                  from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { useMatchesByDate }    from './useMatches'
import { useMyBetsToday }      from '@/features/bets/useBets'
import { useTableSession }     from '@/features/table-sessions/useTableSession'
import { useAuthStore }        from '@/store/authStore'
import MatchCard               from './MatchCard'
import LoadingScreen           from '@/components/ui/LoadingScreen'

export default function MatchesPage() {
  const [date, setDate] = useState(new Date())

  const { data: matches = [], isLoading } = useMatchesByDate(date)
  const { data: betsToday = [] }          = useMyBetsToday()
  const { session, hasAccess }            = useTableSession()

  const betsByMatch = Object.fromEntries(
    betsToday.map(b => [b.match_id, b])
  )

  // Fecha de hoy en Colombia (UTC-5)
  const nowColombia = new Date(Date.now() - 5 * 60 * 60 * 1000)
  const todayStr    = nowColombia.toISOString().split('T')[0]
  const selectedStr = new Date(date.getTime() - 5 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  // Solo puede apostar si la fecha seleccionada es HOY
  const isSelectedToday = selectedStr === todayStr
  const canBetToday     = hasAccess && isSelectedToday

  const dateLabel = isSelectedToday
    ? 'Hoy'
    : format(date, "EEEE d 'de' MMMM", { locale: es })

  const upcoming = matches.filter(m => m.status !== 'finished')
  const finished = matches.filter(m => m.status === 'finished')

  return (
    <div className="min-h-screen bg-monaco-black pb-24">

      {/* Header */}
      <div className="px-5 pt-10 pb-4 bg-gradient-to-b from-[#1a0508] to-monaco-black">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl text-monaco-white tracking-wide">
            Partidos
          </h1>
          {hasAccess ? (
            <span className="text-[10px] bg-monaco-red/20 text-monaco-red
                             border border-monaco-red/30 px-2 py-1 rounded-full tracking-wide">
              Mesa {session.table_number} · Activa
            </span>
          ) : (
            <span className="text-[10px] bg-white/5 text-monaco-silver
                             border border-white/10 px-2 py-1 rounded-full tracking-wide">
              Sin mesa activa
            </span>
          )}
        </div>
        <div className="w-8 h-px bg-monaco-red mt-3" />
      </div>

      {/* Navegador de fecha */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <button
          onClick={() => setDate(d => subDays(d, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg
                     bg-white/5 text-monaco-silver active:bg-white/10">
          <ChevronLeft size={16} />
        </button>

        <div className="text-center">
          <p className="text-monaco-white text-sm font-medium capitalize">
            {dateLabel}
          </p>
          <p className="text-monaco-silver text-[10px]">
            {format(date, 'd MMM yyyy', { locale: es })}
          </p>
        </div>

        <button
          onClick={() => setDate(d => addDays(d, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg
                     bg-white/5 text-monaco-silver active:bg-white/10">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Sin acceso */}
        {!hasAccess && isSelectedToday && (
          <div className="card border-monaco-red/20 bg-monaco-red/5 text-center py-5">
            <p className="text-monaco-white text-sm font-medium mb-1">
              Acceso no activado
            </p>
            <p className="text-monaco-silver text-xs leading-relaxed">
              Pídele al mesero que active<br />tu mesa para poder apostar
            </p>
          </div>
        )}

        {/* Aviso fecha bloqueada */}
        {!isSelectedToday && matches.length > 0 && (
          <div className="card border-white/5 bg-white/3 flex items-center gap-3 py-3">
            <Lock size={16} className="text-monaco-silver/40 flex-shrink-0" />
            <div>
              <p className="text-monaco-silver text-xs font-medium">
                Solo puedes apostar el día del partido
              </p>
              <p className="text-monaco-silver/50 text-[10px] mt-0.5">
                Vuelve el {format(date, "d 'de' MMMM", { locale: es })} para apostar estos partidos
              </p>
            </div>
          </div>
        )}

        {isLoading && <LoadingScreen />}

        {/* Partidos disponibles */}
        {!isLoading && upcoming.length > 0 && (
          <div>
            <p className="section-label">
              {isSelectedToday ? 'Disponibles hoy' : 'Próximos partidos'}
            </p>
            <div className="space-y-3">
              {upcoming.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  existingBet={betsByMatch[match.id]}
                  canBet={canBetToday && match.betting_open}
                  tableNumber={session?.table_number}
                />
              ))}
            </div>
          </div>
        )}

        {/* Finalizados */}
        {!isLoading && finished.length > 0 && (
          <div className="mt-4">
            <p className="section-label">Finalizados</p>
            <div className="space-y-3">
              {finished.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  existingBet={betsByMatch[match.id]}
                  canBet={false}
                  tableNumber={null}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sin partidos */}
        {!isLoading && matches.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-monaco-silver/50 text-2xl mb-3">⚽</p>
            <p className="text-monaco-white text-sm font-medium mb-1">
              Sin partidos este día
            </p>
            <p className="text-monaco-silver text-xs">
              Navega entre fechas para ver el calendario
            </p>
          </div>
        )}
      </div>
    </div>
  )
}