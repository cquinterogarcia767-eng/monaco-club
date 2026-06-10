import { useState } from 'react'
import { useAuthStore }   from '@/store/authStore'
import { supabase }       from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast              from 'react-hot-toast'
import LoadingScreen      from '@/components/ui/LoadingScreen'
import { useSignOut }     from '@/hooks/useSignOut'
import {
  Search, CheckCircle, DoorOpen,
  Circle, LogOut
} from 'lucide-react'

const getToday = () => new Date().toISOString().split('T')[0]

async function getTables() {
  const { data, error } = await supabase
    .from('tables').select('*').order('table_number')
  if (error) throw error
  return data
}

async function getActiveSessions() {
  const { data, error } = await supabase
    .from('table_sessions')
    .select('*, profiles(id, full_name, avatar_url, total_points, total_correct)')
    .eq('night_date', getToday())
    .eq('is_active', true)
    .order('table_number')
  if (error) throw error
  return data
}

async function activateUserTable({ userId, tableNumber, activatedBy }) {
  const { error } = await supabase.rpc('activate_user_table', {
    p_user_id:      userId,
    p_table_number: tableNumber,
    p_activated_by: activatedBy,
  })
  if (error) throw error
}

async function closeTable({ tableNumber, closedBy }) {
  const { error } = await supabase.rpc('close_table', {
    p_table_number: tableNumber,
    p_closed_by:    closedBy,
  })
  if (error) throw error
}

export default function StaffPage() {
  const { user, profile }  = useAuthStore()
  const qc                 = useQueryClient()
  const [searchQuery, setSearchQuery]     = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]         = useState(false)
  const [selectedUser, setSelectedUser]   = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)
  const [closingTable, setClosingTable]   = useState(null)
  const signOut = useSignOut()

  const { data: tables   = [], isLoading: lt } = useQuery({
    queryKey: ['tables'],   queryFn: getTables,         refetchInterval: 5000
  })
  const { data: sessions = [], isLoading: ls } = useQuery({
    queryKey: ['sessions'], queryFn: getActiveSessions, refetchInterval: 5000
  })

  const activateMutation = useMutation({
    mutationFn: activateUserTable,
    onSuccess: () => {
      toast.success('¡Mesa activada! El cliente ya puede apostar')
      qc.invalidateQueries({ queryKey: ['tables']   })
      qc.invalidateQueries({ queryKey: ['sessions'] })
      setSelectedUser(null)
      setSelectedTable(null)
    },
    onError: (e) => toast.error(e.message)
  })

  const closeMutation = useMutation({
    mutationFn: closeTable,
    onSuccess: () => {
      toast.success('Mesa cerrada — clientes bloqueados')
      qc.invalidateQueries({ queryKey: ['tables']   })
      qc.invalidateQueries({ queryKey: ['sessions'] })
      setClosingTable(null)
    },
    onError: (e) => toast.error(e.message)
  })

  async function searchUsers(query) {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, total_points, total_correct')
      .eq('role', 'user')
      .ilike('full_name', `%${query}%`)
      .limit(6)
    setSearchResults(data ?? [])
    setSearching(false)
  }

  function selectUser(u) {
    setSelectedUser(u)
    setSearchQuery('')
    setSearchResults([])
    const freeTable = tables.find(t => !t.is_active)
    if (freeTable) setSelectedTable(freeTable.table_number)
  }

  if (lt || ls) return <LoadingScreen />

  const activeTables = tables.filter(t => t.is_active)
  const freeTables   = tables.filter(t => !t.is_active)

  return (
    <div className="min-h-screen bg-monaco-black pb-10">

      {/* Header */}
      <div className="px-5 pt-10 pb-6 bg-gradient-to-b from-[#1a0508] to-monaco-black">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-monaco-white tracking-wide">
              Panel Mesero
            </h1>
            <p className="text-monaco-silver text-xs mt-0.5">
              {profile?.full_name} · Mónaco Club
            </p>
          </div>
          <button onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                       bg-white/5 border border-white/10 text-monaco-silver text-xs">
            <LogOut size={12} /> Salir
          </button>
        </div>
        <div className="w-8 h-px bg-monaco-red mt-3" />
      </div>

      <div className="px-4 space-y-4">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card text-center border-monaco-red/30 bg-monaco-red/5">
            <p className="text-2xl font-display text-monaco-red">{activeTables.length}</p>
            <p className="text-[10px] text-monaco-silver tracking-widest uppercase mt-1">Ocupadas</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-display text-monaco-white">{freeTables.length}</p>
            <p className="text-[10px] text-monaco-silver tracking-widest uppercase mt-1">Libres</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-display text-monaco-white">{sessions.length}</p>
            <p className="text-[10px] text-monaco-silver tracking-widest uppercase mt-1">Clientes</p>
          </div>
        </div>

        {/* Buscar cliente para activar */}
        {!selectedUser && (
          <div className="card border-monaco-red/20 space-y-3">
            <p className="text-monaco-white text-sm font-medium flex items-center gap-2">
              <Search size={14} className="text-monaco-red" />
              Activar cliente
            </p>
            <input
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                searchUsers(e.target.value)
              }}
              placeholder="Buscar cliente por nombre..."
              className="w-full bg-monaco-black border border-white/10 rounded-xl
                         px-3 py-2.5 text-sm text-monaco-white placeholder-monaco-silver/40
                         focus:outline-none focus:border-monaco-red/50"
            />

            {searching && (
              <p className="text-monaco-silver text-xs text-center py-2">Buscando...</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map(u => (
                  <button key={u.id} onClick={() => selectUser(u)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl
                               bg-white/5 border border-white/10 active:bg-white/10 text-left">
                    <div className="w-9 h-9 rounded-full bg-monaco-red/20 border border-monaco-red/30
                                    flex items-center justify-center text-monaco-red text-sm flex-shrink-0">
                      {u.avatar_url
                        ? <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" />
                        : u.full_name?.[0] ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-monaco-white text-sm font-medium truncate">{u.full_name}</p>
                      <p className="text-monaco-silver text-xs">
                        {u.total_points} pts · {u.total_correct} aciertos
                      </p>
                    </div>
                    <CheckCircle size={16} className="text-monaco-red/50 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {searchQuery && !searching && searchResults.length === 0 && (
              <p className="text-monaco-silver text-xs text-center py-2">
                No se encontraron clientes con ese nombre
              </p>
            )}
          </div>
        )}

        {/* Cliente seleccionado — asignar mesa */}
        {selectedUser && (
          <div className="card border-green-500/30 bg-green-500/5 space-y-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-monaco-red/20 border-2
                              border-monaco-red/30 flex items-center justify-center
                              text-monaco-red font-display text-lg flex-shrink-0">
                {selectedUser.avatar_url
                  ? <img src={selectedUser.avatar_url}
                      className="w-full h-full rounded-full object-cover" />
                  : selectedUser.full_name?.[0] ?? '?'}
              </div>
              <div className="flex-1">
                <p className="text-monaco-white font-medium">
                  {selectedUser.full_name ?? 'Cliente'}
                </p>
                <p className="text-monaco-silver text-xs">
                  {selectedUser.total_points} pts · {selectedUser.total_correct} aciertos
                </p>
              </div>
              <CheckCircle size={22} className="text-green-400 flex-shrink-0" />
            </div>

            <div>
              <p className="text-[10px] text-monaco-silver tracking-widest uppercase mb-2">
                Asignar a mesa
              </p>
              {freeTables.length === 0 ? (
                <p className="text-monaco-silver text-sm text-center py-2">
                  Todas las mesas están ocupadas
                </p>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {freeTables.map(t => (
                    <button key={t.id}
                      onClick={() => setSelectedTable(t.table_number)}
                      className={`aspect-square rounded-xl text-sm font-display
                                  font-bold flex items-center justify-center transition-all
                        ${selectedTable === t.table_number
                          ? 'bg-monaco-red text-white scale-105'
                          : 'bg-white/5 text-monaco-silver border border-white/10'}`}>
                      {t.table_number}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedUser(null); setSelectedTable(null) }}
                className="flex-1 py-3 bg-white/5 border border-white/10
                           rounded-xl text-monaco-silver text-sm">
                Cancelar
              </button>
              <button
                onClick={() => activateMutation.mutate({
                  userId:      selectedUser.id,
                  tableNumber: selectedTable,
                  activatedBy: user.id,
                })}
                disabled={!selectedTable || activateMutation.isPending}
                className="flex-1 py-3 bg-monaco-red rounded-xl text-white
                           text-sm font-medium disabled:opacity-50">
                {activateMutation.isPending ? 'Activando...' : '✓ Activar mesa'}
              </button>
            </div>
          </div>
        )}

        {/* Mesas ocupadas */}
        {activeTables.length > 0 && (
          <div>
            <p className="section-label flex items-center gap-2">
              <Circle size={8} className="text-monaco-red fill-monaco-red" />
              Mesas ocupadas
            </p>
            <div className="space-y-3">
              {activeTables.map(table => {
                const tableUsers = sessions.filter(s => s.table_number === table.table_number)
                return (
                  <div key={table.id} className="card border-monaco-red/20">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-monaco-white font-medium text-sm">
                          Mesa {table.table_number}
                        </p>
                        <p className="text-[10px] text-monaco-red mt-0.5">
                          ● {tableUsers.length} cliente{tableUsers.length !== 1 ? 's' : ''} · desde las {
                            table.activated_at
                              ? new Date(table.activated_at).toLocaleTimeString('es', {
                                  hour: '2-digit', minute: '2-digit'
                                })
                              : '—'
                          }
                        </p>
                      </div>
                      <button onClick={() => setClosingTable(table.table_number)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                   bg-white/5 border border-white/10 text-monaco-silver
                                   text-xs active:bg-white/10">
                        <DoorOpen size={12} /> Cerrar mesa
                      </button>
                    </div>
                    {tableUsers.map(session => (
                      <div key={session.id}
                        className="flex items-center gap-2.5 py-2 border-t border-white/5">
                        <div className="w-8 h-8 rounded-full bg-monaco-red/20
                                        border border-monaco-red/30 flex items-center
                                        justify-center text-xs text-monaco-red flex-shrink-0">
                          {session.profiles?.avatar_url
                            ? <img src={session.profiles.avatar_url}
                                className="w-full h-full rounded-full object-cover" />
                            : session.profiles?.full_name?.[0] ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-monaco-white text-xs font-medium truncate">
                            {session.profiles?.full_name ?? 'Cliente'}
                          </p>
                          <p className="text-monaco-silver text-[10px]">
                            {session.profiles?.total_correct ?? 0} aciertos ·{' '}
                            {session.profiles?.total_points ?? 0} pts
                          </p>
                        </div>
                        <span className="text-monaco-red text-xs font-display flex-shrink-0">
                          {session.profiles?.total_points ?? 0} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Mesas libres */}
        {freeTables.length > 0 && (
          <div>
            <p className="section-label flex items-center gap-2">
              <Circle size={8} className="text-green-400 fill-green-400" />
              Mesas disponibles
            </p>
            <div className="grid grid-cols-5 gap-2">
              {freeTables.map(t => (
                <div key={t.id}
                  className="aspect-square rounded-xl bg-white/5 border border-white/10
                             flex flex-col items-center justify-center gap-0.5">
                  <span className="text-monaco-silver font-display text-lg leading-none">
                    {t.table_number}
                  </span>
                  <span className="text-[8px] text-green-400 uppercase tracking-wide">libre</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tables.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-monaco-silver text-sm">No hay mesas configuradas</p>
            <p className="text-monaco-silver/50 text-xs mt-1">El administrador debe crearlas</p>
          </div>
        )}
      </div>

      {/* Modal cerrar mesa */}
      {closingTable && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="bg-monaco-card rounded-3xl p-6 w-full max-w-xs
                          border border-white/10 space-y-4">
            <div className="text-center">
              <DoorOpen size={32} className="text-monaco-red mx-auto mb-2" />
              <p className="font-display text-lg text-monaco-white">
                Cerrar Mesa {closingTable}
              </p>
              <p className="text-monaco-silver text-xs mt-2 leading-relaxed">
                Los clientes de esta mesa quedarán bloqueados y no podrán
                hacer más apuestas esta noche.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setClosingTable(null)}
                className="flex-1 py-3 bg-white/5 border border-white/10
                           rounded-xl text-monaco-silver text-sm">
                Cancelar
              </button>
              <button
                onClick={() => closeMutation.mutate({ tableNumber: closingTable, closedBy: user.id })}
                disabled={closeMutation.isPending}
                className="flex-1 py-3 bg-monaco-red rounded-xl text-white text-sm font-medium">
                {closeMutation.isPending ? 'Cerrando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}