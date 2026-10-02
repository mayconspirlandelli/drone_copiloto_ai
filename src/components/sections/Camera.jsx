import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Container } from '@/components/Container'
import { cameraSettings, fpsOptions } from '@/data/content'

const EASE_OUT = [0.23, 1, 0.32, 1]

function gimbalLabel(angle) {
  if (angle >= -10) return 'Horizonte — paisagens e reveals'
  if (angle >= -45) return 'Cinematográfico — órbitas, dolly e tracking'
  if (angle > -80) return 'Oblíquo acentuado — contexto do terreno'
  return 'Top Down — padrões e geometria'
}

function GimbalDiagram({ angle }) {
  const a = (-angle * Math.PI) / 180
  const len = 150
  const spread = (20 * Math.PI) / 180
  const ox = 40
  const oy = 40
  const p1 = [ox + Math.cos(a - spread) * len, oy + Math.sin(a - spread) * len]
  const p2 = [ox + Math.cos(a + spread) * len, oy + Math.sin(a + spread) * len]

  return (
    <svg viewBox="0 0 240 170" className="block w-full" aria-hidden="true">
      <line x1="0" y1="160" x2="240" y2="160" stroke="#0F1A2E" strokeOpacity="0.2" strokeWidth="2" />
      <line x1={ox} y1={oy} x2="240" y2={oy} stroke="#0F1A2E" strokeOpacity="0.15" strokeDasharray="3 5" />
      <path
        d={`M${ox} ${oy} L${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} Z`}
        fill="#FF8A1F"
        fillOpacity="0.18"
        style={{ transition: 'd 200ms cubic-bezier(0.23, 1, 0.32, 1)' }}
      />
      <g transform={`translate(${ox} ${oy})`}>
        <line x1="-16" y1="-4" x2="16" y2="-4" stroke="#0F1A2E" strokeWidth="2" strokeLinecap="round" />
        <rect x="-7" y="-6" width="14" height="8" rx="2" fill="#0F1A2E" />
        <g transform={`rotate(${-angle})`} style={{ transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)' }}>
          <rect x="0" y="2" width="12" height="7" rx="2" fill="#FF8A1F" />
        </g>
      </g>
      <text x="236" y={oy - 6} textAnchor="end" className="fill-dp-ink/40 font-mono text-[9px]">
        0°
      </text>
    </svg>
  )
}

export function Camera() {
  const [fps, setFps] = useState(24)
  const [angle, setAngle] = useState(-25)
  const shutter = 2 * fps

  return (
    <section id="camera" className="bg-dp-paper">
      <Container className="py-16 sm:py-24">
        <p className="mb-3 font-mono text-xs tracking-[0.25em] text-dp-ink/50 uppercase">Câmera e gimbal</p>
        <h2 className="font-heading mb-10 text-4xl font-bold text-dp-ink sm:text-5xl">Configure antes de decolar.</h2>

        <div className="grid items-start gap-5 lg:grid-cols-3">
          {/* Shutter */}
          <div className="rounded-2xl bg-dp-ink p-6 text-white">
            <p className="mb-4 font-mono text-[11px] tracking-[0.2em] text-white/45 uppercase">Regra do shutter</p>
            <div className="mb-5 flex flex-wrap gap-1.5">
              {fpsOptions.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={f === fps}
                  onClick={() => setFps(f)}
                  className={`cursor-pointer rounded-md px-3 py-1.5 font-mono text-sm transition-[background-color,color,transform] duration-150 active:scale-[0.97] ${
                    f === fps ? 'bg-dp-signal-500 text-dp-night-950' : 'bg-white/8 text-white/70 hover:bg-white/15'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm text-white/45">{fps} fps →</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={shutter}
                  initial={{ opacity: 0, transform: 'translateY(10px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  exit={{ opacity: 0, transform: 'translateY(-10px)' }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="font-heading text-6xl font-bold text-dp-signal-500 tabular-nums"
                >
                  1/{shutter}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Shutter próximo de 1/(2×FPS) é uma convenção cinematográfica flexível, não obrigação absoluta. Em luz forte, use filtro ND para mantê-lo.
            </p>
          </div>

          {/* Gimbal */}
          <div className="rounded-2xl border border-dp-ink/10 bg-white p-6">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-mono text-[11px] tracking-[0.2em] text-dp-ink/50 uppercase">Inclinação do gimbal</p>
              <span className="font-heading text-3xl font-bold text-dp-ink tabular-nums">{angle}°</span>
            </div>
            <GimbalDiagram angle={angle} />
            <input
              type="range"
              min={-90}
              max={0}
              step={5}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              aria-label="Inclinação do gimbal em graus"
              className="mt-2 w-full accent-dp-signal-500"
            />
            <p className="mt-3 text-sm font-semibold text-dp-ink">{gimbalLabel(angle)}</p>
          </div>

          {/* Demais ajustes */}
          <div className="rounded-2xl border border-dp-ink/10 bg-white p-6">
            <p className="mb-3 font-mono text-[11px] tracking-[0.2em] text-dp-ink/50 uppercase">Ajustes recomendados</p>
            <dl className="divide-y divide-dp-ink/8">
              {cameraSettings.map(({ label, value }) => (
                <div key={label} className="py-2.5">
                  <dt className="text-sm font-bold text-dp-ink">{label}</dt>
                  <dd className="text-sm text-dp-ink/60">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  )
}
