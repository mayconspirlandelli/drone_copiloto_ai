import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Container } from '@/components/Container'
import { DroneSide, DroneTop } from '@/components/DroneGlyph'
import { movimentos } from '@/data/content'

const EASE_OUT = [0.23, 1, 0.32, 1]

function startPoint(d) {
  const [, x, y] = d.match(/M\s*([\d.]+)\s+([\d.]+)/)
  return { x: Number(x), y: Number(y) }
}

function endPoint(d) {
  const nums = d.match(/[\d.]+/g).map(Number)
  return { x: nums.at(-2), y: nums.at(-1) }
}

/**
 * Diagrama animado do movimento. A trajetória roda em loop com SVG <animateMotion>
 * (declarativo, não ocupa a main thread). Com movimento reduzido o drone fica parado
 * no início e a trajetória tracejada continua explicando o movimento.
 */
function MovimentoDiagram({ mov, large = false, uid }) {
  const reduce = useReducedMotion()
  const s0 = startPoint(mov.d)
  const dur = mov.name === 'FPV' ? '3.2s' : '3.6s'
  const isTop = mov.view === 'top'
  const subjectStart = mov.subject.moving ? startPoint(mov.subject.moving) : mov.subject

  return (
    <svg viewBox="0 0 160 100" className="block w-full" aria-hidden="true">
      {isTop ? (
        <rect width="160" height="100" fill="url(#dp-mini-grid)" />
      ) : (
        <line x1="0" y1="90" x2="160" y2="90" stroke="#2A3A5C" strokeWidth="2" />
      )}
      <defs>
        <pattern id="dp-mini-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0 H0 V10" fill="none" stroke="#5CC8FF" strokeOpacity="0.07" />
        </pattern>
      </defs>

      {mov.obstacle && (
        <g>
          <rect x={mov.obstacle.x + mov.obstacle.w / 2 - 1.5} y={mov.obstacle.y + 14} width="3" height={mov.obstacle.h - 14} fill="#3DDC84" fillOpacity="0.5" />
          <circle cx={mov.obstacle.x + mov.obstacle.w / 2} cy={mov.obstacle.y + 10} r={mov.obstacle.w / 1.4} fill="#1F4A3A" stroke="#3DDC84" strokeOpacity="0.5" />
        </g>
      )}
      {mov.gate && (
        <g fill="#1E2C4A" stroke="#B8E6FF" strokeOpacity="0.5">
          <rect x={mov.gate.x - 6} y={mov.gate.y} width="6" height={mov.gate.h} />
          <rect x={mov.gate.x + mov.gate.w} y={mov.gate.y} width="6" height={mov.gate.h} />
          <rect x={mov.gate.x - 6} y={mov.gate.y - 6} width={mov.gate.w + 12} height="6" />
        </g>
      )}

      <path d={mov.d} fill="none" stroke="#5CC8FF" strokeOpacity="0.45" strokeWidth="1.3" strokeDasharray="3 4" />

      {/* sujeito filmado */}
      <g transform={mov.subject.moving ? undefined : `translate(${mov.subject.x} ${mov.subject.y})`}>
        {mov.subject.moving && !reduce && (
          <animateMotion dur={dur} repeatCount="indefinite" path={`M0 0 L ${endPoint(mov.subject.moving).x - subjectStart.x} ${endPoint(mov.subject.moving).y - subjectStart.y}`} />
        )}
        <g transform={mov.subject.moving ? `translate(${subjectStart.x} ${subjectStart.y})` : undefined}>
          {isTop ? (
            <rect x="-7" y="-5" width="14" height="10" rx="2" fill="#1E2C4A" stroke="#B8E6FF" strokeOpacity="0.6" />
          ) : (
            <path d="M-8 8 V-2 L0 -9 L8 -2 V8 Z" fill="#1E2C4A" stroke="#B8E6FF" strokeOpacity="0.6" />
          )}
        </g>
      </g>

      {/* drone */}
      <g transform={reduce ? `translate(${s0.x} ${s0.y})` : undefined}>
        {!reduce && <animateMotion key={uid} dur={dur} repeatCount="indefinite" path={mov.d} rotate={isTop && mov.name === 'FPV' ? 'auto' : '0'} />}
        {isTop ? <DroneTop scale={large ? 0.55 : 0.5} spinning={!reduce} /> : <DroneSide scale={large ? 0.8 : 0.7} />}
      </g>

      <text x="6" y="12" className="fill-white/35 font-mono text-[6.5px] tracking-widest">
        {isTop ? 'VISTA SUPERIOR' : 'VISTA LATERAL'}
      </text>
    </svg>
  )
}

export function Movimentos() {
  const [selected, setSelected] = useState(movimentos[2].name)
  const mov = movimentos.find((m) => m.name === selected)

  const specs = [
    ['Posição inicial', mov.inicio],
    ['Altura', mov.altura],
    ['Velocidade inicial', mov.velocidade],
    ['Gimbal', mov.gimbal],
    ['Duração', mov.duracao],
  ]

  return (
    <section id="movimentos" className="bg-dp-night-950">
      <Container className="py-16 sm:py-24">
        <p className="mb-3 font-mono text-xs tracking-[0.25em] text-dp-sky-400 uppercase">Movimentos cinematográficos</p>
        <h2 className="font-heading mb-3 text-4xl font-bold text-white sm:text-5xl">Cada movimento, uma intenção.</h2>
        <p className="mb-10 max-w-[620px] text-white/60">
          Objetivo visual, trajetória, altura, velocidade, gimbal, duração, riscos e quando não executar. Escolha um movimento para ver o diagrama.
        </p>

        {/* Detalhe do movimento selecionado */}
        <div className="mb-8 grid gap-6 rounded-2xl border border-dp-line bg-dp-night-900 p-5 sm:p-7 lg:grid-cols-[1.1fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-dp-line bg-dp-night-950">
            <MovimentoDiagram mov={mov} large uid={mov.name} />
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mov.name}
              initial={{ opacity: 0, transform: 'translateY(8px)' }}
              animate={{ opacity: 1, transform: 'translateY(0px)' }}
              exit={{ opacity: 0, transform: 'translateY(-6px)' }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <h3 className="font-heading text-4xl font-bold text-white">{mov.name}</h3>
              <p className="mt-2 mb-5 text-white/70">{mov.objetivo}</p>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
                {specs.map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[10.5px] tracking-widest text-white/40 uppercase">{k}</dt>
                    <dd className="text-dp-sky-200">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-dp-warn-500/10 p-3">
                  <p className="mb-1 font-mono text-[10.5px] tracking-widest text-dp-warn-500 uppercase">Riscos</p>
                  <p className="text-sm text-white/75">{mov.riscos}</p>
                </div>
                <div className="rounded-lg bg-dp-stop-500/10 p-3">
                  <p className="mb-1 font-mono text-[10.5px] tracking-widest text-dp-stop-500 uppercase">Não executar quando</p>
                  <p className="text-sm text-white/75">{mov.naoExecutar}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Grade de movimentos */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {movimentos.map((m) => {
            const isSel = m.name === selected
            return (
              <button
                key={m.name}
                type="button"
                onClick={() => setSelected(m.name)}
                aria-pressed={isSel}
                className={`cursor-pointer overflow-hidden rounded-xl border text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.98] ${
                  isSel ? 'border-dp-signal-500 bg-dp-night-800' : 'border-dp-line bg-dp-night-900 hover:border-dp-sky-400/60'
                }`}
              >
                <MovimentoDiagram mov={m} uid={`grid-${m.name}`} />
                <span className={`block px-3 py-2.5 text-sm font-semibold ${isSel ? 'text-dp-signal-300' : 'text-white'}`}>{m.name}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-6 text-sm text-white/40">
          Não proponha automatização próxima de pessoas ou obstáculos sem avaliação específica. Valores são referências iniciais.
        </p>
      </Container>
    </section>
  )
}
