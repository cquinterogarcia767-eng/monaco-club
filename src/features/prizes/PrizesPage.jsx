import { useQuery }     from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { supabase }     from '@/lib/supabase'
import { Crown, Gift, Percent, Trophy } from 'lucide-react'

async function getMyPrizes(userId) {
  const { data, error } = await supabase
    .from('night_prizes')
    .select('*, matches(home_team, away_team, home_flag, away_flag)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

const PRIZE_CONFIG = {
  discount_20: {
    icon:  Percent,
    label: '20% de descuento',
    desc:  'En tu consumo de esta noche',
    color: 'text-monaco-red',
    bg:    'bg-monaco-red/10 border-monaco-red/30',
  },
  bottle: {
    icon:  Gift,
    label: 'Botella sorpresa',
    desc:  'Reclámala con el administrador',
    color: 'text-purple-400',
    bg:    'bg-purple-400/10 border-purple-400/30',
  },
  vip_table: {
    icon:  Crown,
    label: 'Mesa VIP',
    desc:  'Mesa premium en tu próxima visita',
    color: 'text-yellow-400',
    bg:    'bg-yellow-400/10 border-yellow-400/30',
  },
}

export default function PrizesPage() {
  const { user } = useAuthStore()

  const { data: prizes = [], isLoading } = useQuery({
    queryKey: ['prizes', user?.id],
    queryFn:  () => getMyPrizes(user.id),
    enabled:  !!user,
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
          Tus premios ganados
        </p>
        <div className="w-8 h-px bg-monaco-red mt-3" />
      </div>

      <div className="px-4 space-y-5">

        {/* Cómo ganar */}
        <div className="card border-white/5 space-y-3">
          <p className="section-label flex items-center gap-2">
            <Trophy size={12} /> Cómo ganar
          </p>
          <div className="space-y-2">
            {[
              { pts: '1 pt',  desc: 'Vas al local y apuestas cualquier marcador'      },
              { pts: '3 pts', desc: 'Aciertas el resultado — quién gana o empata'     },
              { pts: '5 pts', desc: 'Aciertas el marcador exacto del partido'         },
              { pts: '🏆',    desc: 'Más puntos al final del Mundial = Premio Mayor'  },
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

        {/* Cargando */}
        {isLoading && (
          <div className="card text-center py-8">
            <p className="text-monaco-silver text-sm">Cargando...</p>
          </div>
        )}

        {/* Sin premios */}
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

        {/* Por reclamar */}
        {pending.length > 0 && (
          <div>
            <p className="section-label">Por reclamar</p>
            <div className="space-y-3">
              {pending.map(prize => (
                <PrizeCard key={prize.id} prize={prize} />
              ))}
            </div>
          </div>
        )}

        {/* Ya reclamados */}
        {claimed.length > 0 && (
          <div>
            <p className="section-label">Ya reclamados</p>
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

function PrizeCard({ prize, claimed }) {
  const config = PRIZE_CONFIG[prize.prize_type] ?? {
    icon:  Gift,
    label: prize.prize_description ?? 'Premio especial',
    desc:  'Reclámalo con el administrador',
    color: 'text-monaco-red',
    bg:    'bg-monaco-red/10 border-monaco-red/30',
  }
  const Icon = config.icon

  return (
    <div className={`card ${config.bg} ${claimed ? '' : 'animate-fade-up'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                        ${config.bg}`}>
          <Icon size={22} className={config.color} />
        </div>
        <div className="flex-1">
          <p className="text-monaco-white text-sm font-medium">{config.label}</p>
          <p className="text-monaco-silver text-xs mt-0.5">{config.desc}</p>
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