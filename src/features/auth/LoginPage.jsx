import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)

  async function handleGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) {
      toast.error('Error al conectar con Google')
      setLoading(false)
    }
  }

  async function handleFacebook() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: window.location.origin }
    })
    if (error) {
      toast.error('Error al conectar con Facebook')
      setLoading(false)
    }
  }

  async function handleMagicLink() {
    if (!email) return toast.error('Ingresa tu email')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    if (error) toast.error(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-monaco-black flex flex-col items-center justify-between px-6 py-12">

      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-sm">

        {/* Escudo */}
        <div className="animate-fade-up">
          <svg width="88" height="100" viewBox="0 0 64 72" fill="none">
            <path d="M32 2L60 14V38C60 54 32 70 32 70C32 70 4 54 4 38V14L32 2Z"
              fill="#C41E3A" stroke="#A8A8A8" strokeWidth="1.5"/>
            <path d="M32 2L60 14V28H4V14L32 2Z"
              fill="#141414" stroke="#A8A8A8" strokeWidth="1.5"/>
            <text x="32" y="23" textAnchor="middle" fill="#F5F5F5"
              fontSize="9" fontWeight="bold" fontFamily="serif" letterSpacing="1">
              MÓNACO
            </text>
            <text x="32" y="44" textAnchor="middle" fill="#F5F5F5"
              fontSize="5.4" fontFamily="serif" letterSpacing="0.3">
              CLUB DE LICORES
            </text>
          </svg>
        </div>

        {/* Títulos */}
        <div className="text-center animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <h1 className="font-display text-3xl text-monaco-white tracking-widest">
            MÓNACO
          </h1>
          <p className="text-monaco-silver text-xs tracking-[0.3em] mt-1 uppercase">
            La Casa de los Artistas
          </p>
          <div className="w-10 h-px bg-monaco-red mx-auto mt-4" />
        </div>

        {/* Descripción */}
        <div className="text-center animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <p className="text-monaco-silver text-sm leading-relaxed">
            Predice el marcador de cada partido<br />
            del Mundial y gana premios esta noche
          </p>
        </div>

        {/* Botones */}
        <div className="w-full flex flex-col gap-3 animate-fade-up"
          style={{ animationDelay: '0.3s', opacity: 0 }}>

          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-monaco-card
                       border border-white/10 rounded-2xl text-monaco-white text-sm
                       font-body font-medium tracking-wide transition-all
                       active:scale-95 hover:border-white/20 disabled:opacity-50">
            <GoogleIcon />
            Continuar con Google
          </button>

          <button onClick={handleFacebook} disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-monaco-card
                       border border-white/10 rounded-2xl text-monaco-white text-sm
                       font-body font-medium tracking-wide transition-all
                       active:scale-95 hover:border-white/20 disabled:opacity-50">
            <FacebookIcon />
            Continuar con Facebook
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-monaco-silver text-xs">o entra con email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {!sent ? (
            <div className="w-full space-y-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-monaco-card border border-white/10 rounded-2xl
                           px-4 py-3 text-sm text-monaco-white placeholder-monaco-silver/40
                           focus:outline-none focus:border-monaco-red/50"
              />
              <button onClick={handleMagicLink} disabled={loading} className="btn-primary">
                {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
              </button>
            </div>
          ) : (
            <div className="card border-monaco-red/30 text-center py-4">
              <p className="text-monaco-white text-sm font-medium mb-1">¡Revisa tu correo!</p>
              <p className="text-monaco-silver text-xs">
                Te enviamos un enlace para entrar
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-monaco-silver text-xs leading-relaxed animate-fade-up"
          style={{ animationDelay: '0.4s', opacity: 0 }}>
          El acceso se activa en mesa.<br />
          Disponible solo para clientes del club.
        </p>
      </div>

      <p className="text-monaco-silver/40 text-[10px] tracking-widest uppercase">
        Mundial 2026
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}