export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-monaco-black flex flex-col items-center justify-center gap-4">
      <svg width="56" height="64" viewBox="0 0 64 72" fill="none">
        <path d="M32 2L60 14V38C60 54 32 70 32 70C32 70 4 54 4 38V14L32 2Z"
          fill="#C41E3A" stroke="#A8A8A8" strokeWidth="1.5"/>
        <path d="M32 2L60 14V28H4V14L32 2Z"
          fill="#141414" stroke="#A8A8A8" strokeWidth="1.5"/>
        <text x="32" y="23" textAnchor="middle" fill="#F5F5F5"
          fontSize="9" fontWeight="bold" fontFamily="serif" letterSpacing="1">
          MÓNACO
        </text>
        <text x="32" y="48" textAnchor="middle" fill="#F5F5F5"
          fontSize="5.5" fontFamily="serif">
          CLUB DE LICORES
        </text>
      </svg>
      <div className="w-8 h-0.5 bg-monaco-red animate-pulse-red rounded-full" />
    </div>
  )
}