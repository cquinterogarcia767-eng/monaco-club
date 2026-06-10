import { NavLink } from 'react-router-dom'
import { Trophy, Ticket, Medal, Gift, User } from 'lucide-react'

const tabs = [
  { to: '/',         icon: Trophy, label: 'Partidos' },
  { to: '/apuestas', icon: Ticket, label: 'Apuestas' },
  { to: '/ranking',  icon: Medal,  label: 'Ranking'  },
  { to: '/premios',  icon: Gift,   label: 'Premios'  },
  { to: '/perfil',   icon: User,   label: 'Perfil'   },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-monaco-dark
                    border-t border-white/5 flex z-50">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-3 gap-0.5
             text-[10px] tracking-wide transition-colors
             ${isActive ? 'text-monaco-red' : 'text-monaco-silver'}`
          }
        >
          <Icon size={20} strokeWidth={1.5} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}