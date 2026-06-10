export default function TermsPage() {
  return (
    <div className="min-h-screen bg-monaco-black px-5 py-10 pb-24">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="text-center mb-8">
          <svg width="48" height="56" viewBox="0 0 64 72" fill="none" className="mx-auto mb-4">
            <path d="M32 2L60 14V38C60 54 32 70 32 70C32 70 4 54 4 38V14L32 2Z"
              fill="#C41E3A" stroke="#A8A8A8" strokeWidth="1.5"/>
            <path d="M32 2L60 14V28H4V14L32 2Z"
              fill="#141414" stroke="#A8A8A8" strokeWidth="1.5"/>
            <text x="32" y="22" textAnchor="middle" fill="#F5F5F5"
              fontSize="8" fontWeight="bold" fontFamily="serif" letterSpacing="0.5">MÓNACO</text>
            <text x="32" y="46" textAnchor="middle" fill="#F5F5F5"
              fontSize="4.5" fontFamily="serif">CLUB DE LICORES</text>
          </svg>
          <h1 className="font-display text-2xl text-monaco-white tracking-wide">
            Términos y Condiciones
          </h1>
          <p className="text-monaco-silver text-xs mt-1">
            Torneo de predicciones · Mundial 2026
          </p>
          <div className="w-8 h-px bg-monaco-red mx-auto mt-3" />
        </div>

        <Section title="1. Participación">
          Para participar en el torneo de predicciones el cliente debe estar
          presente físicamente en Mónaco Club de Licores durante la noche del partido
          y tener su mesa activada por un mesero del establecimiento.
          No se aceptan apuestas realizadas fuera del local.
        </Section>

        <Section title="2. Cómo apostar">
          Cada cliente puede realizar una apuesta por partido, prediciendo el
          marcador final. Las apuestas se cierran automáticamente 15 minutos
          después de que el partido inicie. Una vez registrada la apuesta no
          puede modificarse.
        </Section>

        <Section title="3. Sistema de puntos">
          Los puntos se asignan así una vez finalizado el partido:
          <ul className="mt-2 space-y-1.5">
            <Rule pts="1 pt"  rule="Por participar y apostar cualquier marcador" />
            <Rule pts="3 pts" rule="Por acertar el resultado — equipo ganador o empate" />
            <Rule pts="5 pts" rule="Por acertar el marcador exacto del partido" />
          </ul>
        </Section>

        <Section title="4. Premio de la noche">
          Cada noche de partido se entrega un premio al jugador que acumule
          más puntos durante esa jornada. El premio es definido por el
          administrador del establecimiento y puede ser un descuento,
          una botella u otro beneficio.
          Solo se entrega un premio por noche, independientemente de
          cuántos jugadores hayan obtenido la misma puntuación.
          En caso de empate en puntos, el premio se otorga al jugador
          que haya realizado su primera apuesta antes.
        </Section>

        <Section title="5. Premio final del Mundial">
          Al finalizar el torneo Mundial 2026, el jugador con mayor
          puntaje acumulado a lo largo de todas las jornadas se hace
          acreedor al premio mayor del torneo, definido por el
          establecimiento. En caso de empate en el puntaje total,
          el premio se otorga al jugador que haya apostado primero
          durante el torneo.
        </Section>

        <Section title="6. Restricciones">
          Las apuestas son únicamente para entretenimiento dentro del
          establecimiento. No hay dinero de por medio. Los premios no
          son canjeables por efectivo. El establecimiento se reserva
          el derecho de modificar los premios disponibles cada noche.
          El administrador tiene la decisión final en caso de cualquier
          disputa.
        </Section>

        <Section title="7. Conducta">
          El uso indebido de la plataforma, la suplantación de identidad
          o cualquier intento de manipular el sistema resultará en la
          descalificación inmediata del jugador y la pérdida de sus puntos
          y premios acumulados.
        </Section>

        <div className="card border-monaco-red/20 bg-monaco-red/5 text-center py-4">
          <p className="text-monaco-silver text-xs leading-relaxed">
            Al participar en el torneo aceptas estos términos.<br />
            <span className="text-monaco-red font-medium">
              Mónaco Club · La Casa de los Artistas
            </span>
          </p>
        </div>

      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card space-y-2">
      <p className="text-monaco-white text-sm font-medium">{title}</p>
      <p className="text-monaco-silver text-xs leading-relaxed">{children}</p>
    </div>
  )
}

function Rule({ pts, rule }) {
  return (
    <li className="flex items-start gap-3 list-none">
      <span className="text-monaco-red text-xs font-display w-12 flex-shrink-0">{pts}</span>
      <span className="text-monaco-silver text-xs leading-relaxed">{rule}</span>
    </li>
  )
}