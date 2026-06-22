import { useState, useEffect } from 'react'
import LogoReal from '@/assets/PERFIL-MONACO.png'

export default function LoadingScreen() {
  const [showRetry, setShowRetry] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  function forceReset() {
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-monaco-black flex flex-col items-center justify-center gap-4">
      <img
        src={LogoReal}
        alt="Mónaco Club"
        className="w-20 h-20 object-contain animate-pulse"
      />
      <div className="w-8 h-px bg-monaco-red" />
      {showRetry && (
        <button
          onClick={forceReset}
          className="mt-4 px-6 py-2 bg-white/5 border border-white/10
                     rounded-xl text-monaco-silver text-xs active:bg-white/10">
          Toca aquí si no carga
        </button>
      )}
    </div>
  )
}