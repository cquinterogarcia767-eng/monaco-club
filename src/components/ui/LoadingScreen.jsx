import LogoReal from '@/assets/PERFIL-MONACO.png'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-monaco-black flex flex-col items-center justify-center">
      <img
        src={LogoReal}
        alt="Mónaco Club"
        className="w-20 h-20 object-contain animate-pulse"
      />
      <div className="w-8 h-px bg-monaco-red mt-4" />
    </div>
  )
}