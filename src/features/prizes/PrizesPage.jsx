import { useQuery }     from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { supabase }     from '@/lib/supabase'
import { Crown, Gift, Percent, Trophy, Star, Medal } from 'lucide-react'

const getToday = () => new Date().toISOString().split('T')[0]

async function getMyPrizes(userId) {
  const { data, error } = await supabase
    .from('night_prizes')
    .select('*, matches(home_team, away_team, home_flag, away_flag)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

async function getTonightPrize() {
  const { data, error } = await supabase
    .from('prize_config')
    .select('*')
    .eq('night_date', getToday())
    .eq('is_active', true)
  if (error) throw error
  return data ?? []
}

const PRIZE_LABELS = {
  discount_10: '10% de descuento',
  discount_20: '20% de descuento',
  discount_30: '30% de descuento',
  discount_50: '50% de descuento',
  shot:        'Camisa Colombia',
  free_entry:  'Cubetazo Cerveza',
  
}

const PRIZE_CONFIG = {
  discount_10: { icon: Percent, color: 'text-monaco-red',   bg: 'bg-monaco-red/10 border-monaco-red/30' },
  discount_20: { icon: Percent, color: 'text-monaco-red',   bg: 'bg-monaco-red/10 border-monaco-red/30' },
  discount_30: { icon: Percent, color: 'text-monaco-red',   bg: 'bg-monaco-red/10 border-monaco-red/30' },
  discount_50: { icon: Percent, color: 'text-monaco-red',   bg: 'bg-monaco-red/10 border-monaco-red/30' },
  free_entry:  { icon: Star,    color: 'text-blue-400',     bg: 'bg-blue-400/10 border-blue-400/30'     },
 shot:        { icon: Crown,   color: 'text-yellow-400',   bg: 'bg-yellow-400/10 border-yellow-400/30' },
}

export default function PrizesPage() {
  const { user } = useAuthStore()

  const { data: prizes = [], isLoading } = useQuery({
    queryKey: ['prizes', user?.id],
    queryFn:  () => getMyPrizes(user.id),
    enabled:  !!user,
  })

  const { data: tonightPrize = [] } = useQuery({
    queryKey: ['tonight-prize'],
    queryFn:  getTonightPrize,
    refetchInterval: 30000,
  })

  const pending = prizes.filter(p => !p.claimed)
  const claimed = prizes.filter(p => p.claimed)

  return (
    <div className="min-h-screen bg-monaco-black pb-24">

      {/* Header */}
      <div className="px-5 pt-10 pb-6 bg-gradient-to-b from-[#1a0508] to-monaco-black">
        <h1 className="font-display text-2xl text-monaco-white tracking-wide">
          Premios
        </h1>
        <p className="text-monaco-silver text-xs mt-0.5">
          Mundial 2026 · Mónaco Club
        </p>
        <div className="w-8 h-px bg-monaco-red mt-3" />
      </div>

      <div className="px-4 space-y-5">

        {/* Cómo ganar */}
        <div className="card border-white/5 space-y-3">
          <p className="section-label flex items-center gap-2">
            <Trophy size={12} /> Cómo ganar puntos
          </p>
          <div className="space-y-2">
            {[
              { pts: '1 pt',  desc: 'Vas al local y apuestas cualquier marcador'  },
              { pts: '3 pts', desc: 'Aciertas el resultado — quién gana o empata' },
              { pts: '5 pts', desc: 'Aciertas el marcador exacto del partido'     },
            ].map(({ pts, desc }) => (
              <div key={pts} className="flex items-start gap-3">
                <span className="text-monaco-red text-xs font-display w-12 flex-shrink-0 pt-0.5">
                  {pts}
                </span>
                <span className="text-monaco-silver text-xs leading-relaxed">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Premio de esta noche */}
        <div className="card border-monaco-red/30 bg-monaco-red/5 space-y-3">
          <p className="section-label flex items-center gap-2">
            <Star size={12} className="text-monaco-red" /> Premio de esta noche
          </p>
          {tonightPrize.length > 0 ? (
            <div className="space-y-2">
              {tonightPrize.map(prize => {
                const config = PRIZE_CONFIG[prize.prize_type]
                const Icon   = config?.icon ?? Gift
                const label  = PRIZE_LABELS[prize.prize_type] ?? prize.prize_description ?? 'Premio especial'
                return (
                  <div key={prize.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border
                      ${config?.bg ?? 'bg-monaco-red/10 border-monaco-red/30'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${config?.bg ?? 'bg-monaco-red/10'}`}>
                      <Icon size={20} className={config?.color ?? 'text-monaco-red'} />
                    </div>
                    <div>
                      <p className="text-monaco-white text-sm font-medium">{label}</p>
                      <p className="text-monaco-silver text-xs mt-0.5">
                        Para el que más puntos acumule hoy
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-monaco-silver text-xs text-center py-3">
              El admin aún no configura el premio de hoy
            </p>
          )}
        </div>

        {/* Premio mayor — dinámico desde Supabase */}
        <GrandPrizeDisplay />

        {/* Premios pendientes */}
        {isLoading && (
          <div className="card text-center py-8">
            <p className="text-monaco-silver text-sm">Cargando...</p>
          </div>
        )}

        {!isLoading && pending.length === 0 && claimed.length === 0 && (
          <div className="card text-center py-10">
            <Trophy size={32} className="text-monaco-silver/20 mx-auto mb-3" />
            <p className="text-monaco-white text-sm font-medium mb-1">
              Aún no tienes premios
            </p>
            <p className="text-monaco-silver text-xs leading-relaxed">
              Apuesta el marcador exacto<br />para ganar premios esta noche
            </p>
          </div>
        )}

        {pending.length > 0 && (
          <div>
            <p className="section-label">🎁 Por reclamar</p>
            <div className="space-y-3">
              {pending.map(prize => (
                <PrizeCard key={prize.id} prize={prize} />
              ))}
            </div>
          </div>
        )}

        {claimed.length > 0 && (
          <div>
            <p className="section-label">✅ Ya reclamados</p>
            <div className="space-y-2 opacity-50">
              {claimed.map(prize => (
                <PrizeCard key={prize.id} prize={prize} claimed />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function GrandPrizeDisplay() {
  const { data: grandPrize } = useQuery({
    queryKey: ['grand-prize-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tournament_prize_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    },
    refetchInterval: 60000,
  })

  return (
    <div className="card border-yellow-400/30 bg-yellow-400/5 space-y-3">
      <p className="section-label flex items-center gap-2">
        <Medal size={12} className="text-yellow-400" /> Premio Mayor — Final del Mundial
      </p>
      <div className="flex items-center gap-3 p-3 rounded-xl
                      bg-yellow-500/10 border border-yellow-500/20">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center
                        justify-center flex-shrink-0">
          <Trophy size={24} className="text-yellow-400" />
        </div>
        <div>
          <p className="text-monaco-white text-sm font-medium">
            🏆 {grandPrize?.prize_description || 'Gran Premio del Torneo'}
          </p>
          <p className="text-monaco-silver text-xs mt-0.5 leading-relaxed">
            El jugador con más puntos al finalizar el Mundial 2026 se lo lleva
          </p>
          <p className="text-yellow-400/70 text-[10px] mt-1">
            En caso de empate, gana quien apostó primero
          </p>
        </div>
      </div>
      <div className="text-center py-1">
        <p className="text-[10px] text-monaco-silver/50 uppercase tracking-widest">
          Acumula puntos cada noche que vengas al club
        </p>
      </div>
    </div>
  )
}

function PrizeCard({ prize, claimed }) {
  const config = PRIZE_CONFIG[prize.prize_type] ?? {
    icon: Gift, color: 'text-monaco-red', bg: 'bg-monaco-red/10 border-monaco-red/30'
  }
  const Icon  = config.icon
  const label = PRIZE_LABELS[prize.prize_type] ?? prize.prize_description ?? 'Premio especial'

  return (
    <div className={`card ${config.bg} ${claimed ? '' : 'animate-fade-up'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                        ${config.bg}`}>
          <Icon size={22} className={config.color} />
        </div>
        <div className="flex-1">
          <p className="text-monaco-white text-sm font-medium">{label}</p>
          <p className="text-monaco-silver text-xs mt-0.5">
            Reclámalo con el administrador
          </p>
          {prize.matches && (
            <p className="text-monaco-silver/50 text-[10px] mt-1">
              {prize.matches.home_flag} {prize.matches.home_team} vs{' '}
              {prize.matches.away_flag} {prize.matches.away_team}
            </p>
          )}
        </div>
        {!claimed && (
          <div className="w-2 h-2 rounded-full bg-monaco-red animate-pulse-red flex-shrink-0" />
        )}
      </div>

      {!claimed && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-[10px] text-monaco-silver text-center tracking-wide">
            Muéstrale esta pantalla al administrador para reclamar
          </p>
        </div>
      )}
    </div>
  )
}