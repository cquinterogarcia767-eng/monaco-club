import { useState, useRef, useEffect } from 'react'
import { useAuthStore }      from '@/store/authStore'
import { useMyBets }         from '@/features/bets/useBets'
import { supabase }          from '@/lib/supabase'
import { format }            from 'date-fns'
import { es }                from 'date-fns/locale'
import { CheckCircle, XCircle, Clock, Settings, Camera, QrCode } from 'lucide-react'
import { Link }              from 'react-router-dom'
import LoadingScreen         from '@/components/ui/LoadingScreen'
import QRCode                from 'qrcode'
import toast                 from 'react-hot-toast'
import { useSignOut } from '@/hooks/useSignOut'

export default function ProfilePage() {
  const { user, profile, setProfile }          = useAuthStore()
  const { data: bets = [], isLoading }         = useMyBets()
  const [showQR, setShowQR]                    = useState(false)
  const [qrUrl, setQrUrl]                      = useState(null)
  const [uploadingPhoto, setUploadingPhoto]    = useState(false)
  const fileInputRef                           = useRef(null)
  const signOut = useSignOut()

  // ── Pedir nombre si falta o quedó por defecto ──
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [tempName, setTempName]             = useState('')
  const [savingName, setSavingName]         = useState(false)

  useEffect(() => {
    if (profile && (!profile.full_name || profile.full_name.trim() === '' || profile.full_name === 'Jugador')) {
      setShowNamePrompt(true)
    }
  }, [profile])

  async function saveName() {
    if (!tempName.trim()) return toast.error('Ingresa tu nombre')
    setSavingName(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: tempName.trim() })
      .eq('id', user.id)
    setSavingName(false)
    if (error) return toast.error('Error al guardar el nombre')
    setProfile({ ...profile, full_name: tempName.trim() })
    toast.success('¡Nombre guardado!')
    setShowNamePrompt(false)
  }

  const accuracy = profile?.total_bets > 0
    ? Math.round((profile.total_correct / profile.total_bets) * 100)
    : 0

  async function handleShowQR() {
    try {
      const url = await QRCode.toDataURL(user.id, {
        width: 240,
        margin: 2,
        color: { dark: '#F5F5F5', light: '#1E1E1E' }
      })
      setQrUrl(url)
      setShowQR(true)
    } catch (e) {
      toast.error('Error generando QR')
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast.error('La foto debe pesar menos de 2MB')

    setUploadingPhoto(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success('Foto actualizada')
    } catch (e) {
      toast.error('Error subiendo la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (isLoading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-monaco-black pb-24">

      {/* Header */}
      <div className="px-5 pt-10 pb-6 bg-gradient-to-b from-[#1a0508] to-monaco-black">
        <div className="flex items-center gap-4">

          {/* Avatar con botón de cambio */}
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url}
                className="w-16 h-16 rounded-full border-2 border-monaco-red object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-monaco-red
                              bg-monaco-red/20 flex items-center justify-center
                              text-monaco-red text-2xl font-display">
                {initials(profile?.full_name)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full
                         bg-monaco-red flex items-center justify-center
                         border-2 border-monaco-black"
            >
              <Camera size={10} className="text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="flex-1">
            <h1 className="font-display text-xl text-monaco-white">
              {profile?.full_name ?? 'Jugador'}
            </h1>
            <p className="text-monaco-silver text-xs mt-0.5">{user?.email}</p>
            {profile?.role === 'admin' && (
              <span className="text-[10px] bg-monaco-red/20 text-monaco-red
                               border border-monaco-red/30 px-2 py-0.5 rounded-full mt-1 inline-block">
                Administrador
              </span>
            )}
            {profile?.role === 'waiter' && (
              <span className="text-[10px] bg-yellow-500/20 text-yellow-400
                               border border-yellow-500/30 px-2 py-0.5 rounded-full mt-1 inline-block">
                Mesero
              </span>
            )}
          </div>
        </div>
        <div className="w-8 h-px bg-monaco-red mt-4" />
      </div>

      <div className="px-4 space-y-4">

        {/* Botón QR 
        <button
          onClick={handleShowQR}
          className="w-full flex items-center justify-center gap-3 py-4
                     bg-monaco-card border border-monaco-red/30 rounded-2xl
                     text-monaco-white text-sm font-medium tracking-wide
                     active:scale-95 transition-all"
        >
          <QrCode size={18} className="text-monaco-red" />
          Mostrar mi QR al mesero
        </button>*/}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Puntos totales"  value={profile?.total_points  ?? 0} accent />
          <StatCard label="Aciertos"        value={profile?.total_correct ?? 0} />
          <StatCard label="Apuestas"        value={profile?.total_bets    ?? 0} />
          <StatCard label="Precisión"       value={`${accuracy}%`} />
        </div>

        {/* Historial */}
        <div>
          <p className="section-label">Historial de apuestas</p>
          {bets.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-monaco-silver text-sm">
                Aún no tienes apuestas registradas
              </p>
            </div>
          )}
          <div className="space-y-2">
            {bets.map(bet => (
              <BetRow key={bet.id} bet={bet} />
            ))}
          </div>
        </div>

        {/* Botones admin/mesero */}
        {(profile?.role === 'admin' || profile?.role === 'waiter') && (
          <Link
            to="/staff"
            className="w-full flex items-center justify-center gap-2 py-3
                       bg-monaco-card border border-yellow-500/30 rounded-xl
                       text-yellow-400 text-sm font-medium tracking-wide"
          >
            <Settings size={16} />
            Panel de staff
          </Link>
        )}

        {profile?.role === 'admin' && (
          <Link
            to="/admin"
            className="w-full flex items-center justify-center gap-2 py-3
                       bg-monaco-card border border-monaco-red/30 rounded-xl
                       text-monaco-red text-sm font-medium tracking-wide"
          >
            <Settings size={16} />
            Panel de administrador
          </Link>
        )}

        <button onClick={signOut} className="btn-ghost text-sm py-3">
  Cerrar sesión
</button>
      </div>

      {/* Modal QR */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-monaco-card rounded-3xl p-8 flex flex-col items-center gap-4
                       border border-monaco-red/30 w-full max-w-xs"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <p className="font-display text-lg text-monaco-white">Mi QR</p>
              <p className="text-monaco-silver text-xs mt-1">
                Muéstraselo al mesero para activar tu mesa
              </p>
            </div>

            {qrUrl && (
              <div className="p-4 bg-[#1E1E1E] rounded-2xl border border-white/10">
                <img src={qrUrl} className="w-48 h-48" />
              </div>
            )}

            <p className="text-monaco-silver/50 text-[10px] tracking-widest text-center">
              {profile?.full_name ?? user?.email}
            </p>

            <button
              onClick={() => setShowQR(false)}
              className="btn-ghost text-sm py-2.5"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal pedir nombre — obligatorio si falta */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center px-6">
          <div className="bg-monaco-card rounded-3xl p-6 w-full max-w-xs
                          border border-monaco-red/30 space-y-4">
            <div className="text-center">
              <p className="font-display text-lg text-monaco-white">¡Bienvenido a Mónaco!</p>
              <p className="text-monaco-silver text-xs mt-2 leading-relaxed">
                Ingresa tu nombre completo para que el mesero pueda identificarte
              </p>
            </div>
            <input
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              placeholder="Tu nombre completo"
              autoFocus
              className="w-full bg-monaco-black border border-white/10 rounded-xl
                         px-4 py-3 text-sm text-monaco-white placeholder-monaco-silver/40
                         focus:outline-none focus:border-monaco-red/50"
            />
            <button
              onClick={saveName}
              disabled={savingName}
              className="w-full py-3 bg-monaco-red rounded-xl text-white
                         text-sm font-medium disabled:opacity-50"
            >
              {savingName ? 'Guardando...' : 'Guardar y continuar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BetRow({ bet }) {
  const match   = bet.matches
  const pending = bet.is_correct === null
  const correct = bet.is_correct === true

  return (
    <div className={`card flex items-center gap-3
      ${correct  ? 'border-green-500/20' :
        pending  ? 'border-monaco-red/20' : 'border-white/5'}`}>

      <div className="flex-shrink-0">
        {pending && <Clock       size={16} className="text-monaco-red" />}
        {correct && <CheckCircle size={16} className="text-green-400" />}
        {!pending && !correct && <XCircle size={16} className="text-monaco-silver/40" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-monaco-white text-sm font-medium truncate">
          {match?.home_flag} {match?.home_team} vs {match?.away_flag} {match?.away_team}
        </p>
        <p className="text-monaco-silver text-xs mt-0.5">
          Apostaste: {bet.predicted_home} — {bet.predicted_away}
          {match?.status === 'finished' && (
            <span className="text-monaco-silver/50 ml-1">
              · Real: {match.home_score} — {match.away_score}
            </span>
          )}
        </p>
        <p className="text-monaco-silver/40 text-[10px] mt-0.5">
          {format(new Date(bet.created_at), "d MMM · h:mm a", { locale: es })}
        </p>
      </div>

      {correct && (
        <div className="flex-shrink-0 text-right">
          <p className="text-monaco-red font-display text-lg leading-none">
            +{bet.points_earned}
          </p>
          <p className="text-[10px] text-monaco-silver/50">pts</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`card text-center ${accent ? 'border-monaco-red/30 bg-monaco-red/5' : ''}`}>
      <p className={`text-2xl font-display ${accent ? 'text-monaco-red' : 'text-monaco-white'}`}>
        {value}
      </p>
      <p className="text-[10px] text-monaco-silver tracking-widest uppercase mt-1">{label}</p>
    </div>
  )
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}