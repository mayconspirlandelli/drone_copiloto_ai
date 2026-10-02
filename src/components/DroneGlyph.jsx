/**
 * Drone em vista superior desenhado em torno da origem (0,0) — use dentro de um <svg>
 * e posicione com um <g transform> ou motion values. `scale` = 1 ocupa ~28×28 unidades.
 */
export function DroneTop({ scale = 1, spinning = true, body = '#FF8A1F', frame = '#B8E6FF' }) {
  const rotors = [
    [-9, -9],
    [9, -9],
    [-9, 9],
    [9, 9],
  ]
  return (
    <g transform={`scale(${scale})`}>
      <line x1="-9" y1="-9" x2="9" y2="9" stroke={frame} strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="-9" x2="-9" y2="9" stroke={frame} strokeWidth="2" strokeLinecap="round" />
      {rotors.map(([x, y]) => (
        <g key={`${x}${y}`} transform={`translate(${x} ${y})`}>
          <circle r="5.5" fill="none" stroke={frame} strokeOpacity="0.45" strokeWidth="1" />
          <g className={spinning ? 'dp-rotor' : undefined}>
            <line x1="-5" y1="0" x2="5" y2="0" stroke={frame} strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </g>
      ))}
      <rect x="-4.5" y="-4.5" width="9" height="9" rx="2.5" fill={body} />
    </g>
  )
}

/** Drone em vista lateral, centrado na origem. */
export function DroneSide({ scale = 1, body = '#FF8A1F', frame = '#B8E6FF' }) {
  return (
    <g transform={`scale(${scale})`}>
      <line x1="-11" y1="-2" x2="11" y2="-2" stroke={frame} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="-14" y1="-5" x2="-8" y2="-5" stroke={frame} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="-5" x2="14" y2="-5" stroke={frame} strokeWidth="1.4" strokeLinecap="round" />
      <rect x="-5" y="-4" width="10" height="6" rx="2" fill={body} />
      <circle cx="0" cy="4" r="2" fill={frame} />
    </g>
  )
}

export function Logo({ className }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <svg viewBox="-16 -16 32 32" className="size-8" aria-hidden="true">
        <DroneTop scale={1.05} spinning={false} />
      </svg>
      <span className="font-heading text-[22px] font-bold tracking-wide text-white">
        DroneCopiloto <span className="text-dp-signal-500">AI</span>
      </span>
    </span>
  )
}
