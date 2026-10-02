import { useEffect, useMemo, useRef, useState } from 'react'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { Compass, Pause, Play, RotateCcw, Wind } from 'lucide-react'
import { Container } from '@/components/Container'
import { DroneTop } from '@/components/DroneGlyph'
import { flightPlan } from '@/data/content'

// A reprodução roda acelerada para que os 57 s do roteiro caibam em ~19 s de tela.
const SPEED = 3
const MAP_W = 800
const MAP_H = 500
const PROFILE_W = 800
const PROFILE_H = 110
const MAX_ALT = 60

const { scenes, home, house } = flightPlan
const houseCenter = { x: house.x + house.w / 2, y: house.y + house.h / 2 }

function formatTime(s) {
  const v = Math.max(0, Math.round(s))
  return `00:${String(v).padStart(2, '0')}`
}

function altToY(alt) {
  return PROFILE_H - 14 - (alt / MAX_ALT) * (PROFILE_H - 30)
}

/** Cone de visão da câmera (ou "pegada" quadrada no Top Down). */
function fovPath(x, y, angleDeg, mode) {
  if (mode === 'down') {
    const s = 22
    return `M${x - s} ${y - s} H${x + s} V${y + s} H${x - s} Z`
  }
  const a = (angleDeg * Math.PI) / 180
  const spread = (32 * Math.PI) / 180
  const r = 78
  const p1 = [x + Math.cos(a - spread) * r, y + Math.sin(a - spread) * r]
  const p2 = [x + Math.cos(a + spread) * r, y + Math.sin(a + spread) * r]
  return `M${x} ${y} L${p1[0]} ${p1[1]} A ${r} ${r} 0 0 1 ${p2[0]} ${p2[1]} Z`
}

/** Trecho da trajetória que vai sendo "desenhado" conforme o tempo avança. */
function SceneTrack({ d, t, start, end, isActive }) {
  const pathLength = useTransform(t, [start, end], [0, 1], { clamp: true })
  const opacity = useTransform(t, (v) => (v > start ? 1 : 0))
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={isActive ? '#FF8A1F' : '#5CC8FF'}
      strokeWidth={isActive ? 3.5 : 2.5}
      strokeLinecap="round"
      style={{ pathLength, opacity }}
    />
  )
}

function MapBackdrop() {
  const wire = flightPlan.hazards.find((h) => h.kind === 'wire')
  const people = flightPlan.hazards.find((h) => h.kind === 'people')
  const trees = [
    [150, 395, 16], [178, 410, 13], [132, 372, 11], [205, 388, 10],
    [300, 150, 18], [330, 175, 12], [270, 180, 11],
    [620, 230, 15], [650, 255, 12], [600, 260, 10],
    [520, 420, 12], [480, 440, 10],
  ]

  return (
    <g>
      <defs>
        <pattern id="dp-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="#FF4D5E" strokeOpacity="0.35" strokeWidth="3" />
        </pattern>
      </defs>

      {/* estrada de acesso */}
      <path d="M0 470 C 200 460, 330 340, 400 290" fill="none" stroke="#2A3A5C" strokeWidth="14" strokeLinecap="round" />

      {trees.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#1F4A3A" stroke="#3DDC84" strokeOpacity="0.35" />
      ))}

      {/* imóvel */}
      <rect x={house.x} y={house.y} width={house.w} height={house.h} rx="4" fill="#1E2C4A" stroke="#B8E6FF" strokeOpacity="0.6" />
      <line x1={house.x} y1={houseCenter.y} x2={house.x + house.w} y2={houseCenter.y} stroke="#B8E6FF" strokeOpacity="0.35" />
      <text x={houseCenter.x} y={house.y + house.h + 18} textAnchor="middle" className="fill-white/55 font-mono text-[11px]">
        IMÓVEL
      </text>

      {/* riscos */}
      <path d={wire.d} stroke="#FF8A1F" strokeWidth="2" strokeDasharray="10 6" fill="none" />
      <text x="112" y="200" transform="rotate(-39 112 200)" className="fill-dp-signal-300 font-mono text-[11px]">
        {wire.label}
      </text>
      <rect x={people.x} y={people.y} width={people.w} height={people.h} rx="6" fill="url(#dp-hatch)" stroke="#FF4D5E" strokeOpacity="0.6" />
      <text x={people.x + 10} y={people.y + people.h - 12} className="fill-dp-stop-500 font-mono text-[10.5px]">
        {people.label}
      </text>

      {/* home point */}
      <circle cx={home.x} cy={home.y} r="15" fill="#070C17" stroke="#3DDC84" strokeWidth="2" />
      <text x={home.x} y={home.y + 5} textAnchor="middle" className="fill-dp-go-500 font-heading text-[15px] font-bold">
        H
      </text>

      {/* escala */}
      <g transform="translate(640 478)">
        <line x1="0" y1="0" x2="100" y2="0" stroke="#B8E6FF" strokeOpacity="0.6" strokeWidth="2" />
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#B8E6FF" strokeOpacity="0.6" />
        <line x1="100" y1="-5" x2="100" y2="5" stroke="#B8E6FF" strokeOpacity="0.6" />
        <text x="50" y="-8" textAnchor="middle" className="fill-white/50 font-mono text-[10px]">
          50 m
        </text>
      </g>
    </g>
  )
}

export function FlightPlan() {
  const reduce = useReducedMotion()
  const mapRef = useRef(null)
  const inView = useInView(mapRef, { once: true, amount: 0.45 })
  const measureRefs = useRef([])
  const controlsRef = useRef(null)

  const timeline = useMemo(() => {
    let acc = 0
    return scenes.map((s) => {
      const start = acc
      acc += s.duracao
      return { start, end: acc }
    })
  }, [])
  const total = timeline.at(-1).end

  const t = useMotionValue(0)
  const droneX = useMotionValue(home.x)
  const droneY = useMotionValue(home.y)
  const fov = useMotionValue('')
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)

  const clock = useTransform(t, (v) => `${formatTime(v)} / ${formatTime(total)}`)
  const markerX = useTransform(t, (v) => (v / total) * PROFILE_W)
  const markerY = useTransform(t, (v) => {
    const i = Math.max(0, timeline.findIndex((seg) => v <= seg.end))
    const seg = timeline[i]
    const local = (v - seg.start) / (seg.end - seg.start)
    const [a0, a1] = scenes[i].alt
    return altToY(a0 + (a1 - a0) * local)
  })

  function placeDrone(v) {
    let i = timeline.findIndex((seg) => v <= seg.end)
    if (i < 0) i = timeline.length - 1
    const seg = timeline[i]
    const local = Math.min(1, Math.max(0, (v - seg.start) / (seg.end - seg.start)))
    const path = measureRefs.current[i]
    if (!path) return
    const len = path.getTotalLength()
    const at = len * local
    const p = path.getPointAtLength(at)
    const ahead = path.getPointAtLength(Math.min(len, at + 2))
    const behind = path.getPointAtLength(Math.max(0, at - 2))
    const heading = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI

    const mode = scenes[i].camera
    let camAngle = heading
    if (mode === 'subject') {
      camAngle = (Math.atan2(houseCenter.y - p.y, houseCenter.x - p.x) * 180) / Math.PI
    } else if (mode === 'back') {
      camAngle = heading + 180
    }

    droneX.set(p.x)
    droneY.set(p.y)
    fov.set(fovPath(p.x, p.y, camAngle, mode))
    setActive(i)
  }

  useMotionValueEvent(t, 'change', placeDrone)

  function play(from = t.get() >= total ? 0 : t.get()) {
    controlsRef.current?.stop()
    t.set(from)
    placeDrone(from)
    setPlaying(true)
    controlsRef.current = animate(t, total, {
      duration: (total - from) / SPEED,
      ease: 'linear',
      onComplete: () => setPlaying(false),
    })
  }

  function pause() {
    controlsRef.current?.stop()
    setPlaying(false)
  }

  function jumpTo(i) {
    if (reduce) {
      pause()
      t.set(timeline[i].start + scenes[i].duracao / 2)
      return
    }
    play(timeline[i].start)
  }

  // Posição inicial e autoplay quando o mapa entra na tela.
  useEffect(() => {
    placeDrone(reduce ? total : 0)
    if (reduce) t.set(total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (inView && !reduce) play(0)
    return () => controlsRef.current?.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  const scene = scenes[active]
  const profilePoints = scenes
    .flatMap((s, i) => [
      `${(timeline[i].start / total) * PROFILE_W},${altToY(s.alt[0])}`,
      `${(timeline[i].end / total) * PROFILE_W},${altToY(s.alt[1])}`,
    ])
    .join(' ')

  return (
    <section id="plano-de-voo" className="bg-dp-night-900">
      <Container className="py-16 sm:py-24">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-xs tracking-[0.25em] text-dp-sky-400 uppercase">Plano de voo · exemplo</p>
            <h2 className="font-heading text-4xl font-bold text-white sm:text-5xl">{flightPlan.title}</h2>
            <p className="mt-3 max-w-[640px] text-white/60">{flightPlan.objetivo}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (playing ? pause() : play())}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-dp-signal-500 px-5 py-2.5 text-sm font-bold text-dp-night-950 transition-[background-color,transform] duration-150 hover:bg-dp-signal-300 active:scale-[0.97]"
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {playing ? 'Pausar' : 'Reproduzir'}
            </button>
            <button
              type="button"
              onClick={() => play(0)}
              aria-label="Reiniciar simulação"
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white transition-[border-color,transform] duration-150 hover:border-dp-sky-400 active:scale-[0.97]"
            >
              <RotateCcw className="size-4" />
            </button>
            <motion.span className="ml-2 font-mono text-sm text-dp-sky-200 tabular-nums">{clock}</motion.span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          {/* Mapa + perfil de altitude */}
          <div className="overflow-hidden rounded-2xl border border-dp-line bg-dp-night-950">
            <div ref={mapRef} className="dp-grid relative">
              <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block w-full" role="img" aria-label="Mapa do plano de voo com trajetória animada">
                <MapBackdrop />

                {/* rota planejada completa (fantasma) e retorno */}
                <path d={flightPlan.rth} fill="none" stroke="#3DDC84" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 7" />
                {scenes.map((s) => (
                  <path key={`ghost-${s.id}`} d={s.d} fill="none" stroke="#5CC8FF" strokeOpacity="0.18" strokeWidth="2" strokeDasharray="4 6" />
                ))}

                {/* geometria invisível usada só para medir a trajetória */}
                {scenes.map((s, i) => (
                  <path key={`measure-${s.id}`} ref={(el) => (measureRefs.current[i] = el)} d={s.d} fill="none" stroke="none" />
                ))}

                {scenes.map((s, i) => (
                  <SceneTrack
                    key={`track-${s.id}`}
                    d={s.d}
                    t={t}
                    start={timeline[i].start}
                    end={timeline[i].end}
                    isActive={i === active}
                  />
                ))}

                {/* waypoints numerados no início de cada cena */}
                {scenes.map((s, i) => {
                  const [, x, y] = s.d.match(/M\s*([\d.]+)\s+([\d.]+)/)
                  const offset = i === 4 ? 22 : 0 // Orbit e Side Tracking começam no mesmo ponto
                  return (
                    <g
                      key={`wp-${s.id}`}
                      transform={`translate(${Number(x) + offset} ${Number(y) - 22})`}
                      onClick={() => jumpTo(i)}
                      className="cursor-pointer"
                    >
                      <circle r="11" fill={i === active ? '#FF8A1F' : '#141F36'} stroke={i === active ? '#FF8A1F' : '#5CC8FF'} strokeOpacity="0.8" />
                      <text y="4" textAnchor="middle" className={`font-mono text-[11px] font-semibold ${i === active ? 'fill-dp-night-950' : 'fill-dp-sky-200'}`}>
                        {s.id}
                      </text>
                    </g>
                  )
                })}

                <motion.path d={fov} fill="#5CC8FF" fillOpacity="0.16" stroke="#5CC8FF" strokeOpacity="0.4" />
                <motion.g style={{ x: droneX, y: droneY }}>
                  <circle r="20" fill="#FF8A1F" fillOpacity="0.12" />
                  <DroneTop scale={1.25} spinning={!reduce} />
                </motion.g>
              </svg>

              <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5 font-mono text-[10.5px] text-white/55">
                <span className="flex items-center gap-1.5">
                  <Compass className="size-3.5 text-dp-sky-400" /> N ↑
                </span>
                <span className="flex items-center gap-1.5">
                  <Wind className="size-3.5 text-dp-sky-400" /> vento: conferir no local
                </span>
              </div>
            </div>

            <div className="border-t border-dp-line px-4 pt-3 pb-2">
              <div className="mb-1 flex justify-between font-mono text-[10.5px] tracking-widest text-white/40 uppercase">
                <span>Perfil de altitude</span>
                <span>máx. planejado {MAX_ALT} m</span>
              </div>
              <svg viewBox={`0 0 ${PROFILE_W} ${PROFILE_H}`} className="block w-full" aria-hidden="true">
                <line x1="0" y1={altToY(MAX_ALT)} x2={PROFILE_W} y2={altToY(MAX_ALT)} stroke="#FFC233" strokeOpacity="0.5" strokeDasharray="4 6" />
                <line x1="0" y1={altToY(0)} x2={PROFILE_W} y2={altToY(0)} stroke="#2A3A5C" />
                {timeline.slice(1).map((seg) => (
                  <line key={seg.start} x1={(seg.start / total) * PROFILE_W} y1="6" x2={(seg.start / total) * PROFILE_W} y2={altToY(0)} stroke="#2A3A5C" strokeDasharray="2 4" />
                ))}
                <polyline points={`0,${altToY(0)} ${profilePoints} ${PROFILE_W},${altToY(0)}`} fill="#5CC8FF" fillOpacity="0.1" stroke="none" />
                <polyline points={profilePoints} fill="none" stroke="#5CC8FF" strokeWidth="2" />
                <motion.line x1={markerX} x2={markerX} y1="4" y2={altToY(0)} stroke="#FF8A1F" strokeWidth="1.5" />
                <motion.circle cx={markerX} cy={markerY} r="5" fill="#FF8A1F" />
              </svg>
            </div>
          </div>

          {/* Telemetria da cena ativa + roteiro */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-dp-line bg-dp-night-950 p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-mono text-[11px] tracking-[0.2em] text-dp-signal-300 uppercase">
                  Cena {scene.id} · {scene.fase}
                </span>
                <span className="font-mono text-[11px] text-white/40">{scene.duracao} s</span>
              </div>
              <motion.p
                key={scene.id}
                initial={{ opacity: 0, transform: 'translateY(6px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="font-heading mb-1 text-3xl font-bold text-white"
              >
                {scene.movimento}
              </motion.p>
              <p className="mb-5 text-sm text-white/60">{scene.objetivo}</p>
              <dl className="grid grid-cols-3 gap-3 font-mono">
                {[
                  ['Altura', scene.altura],
                  ['Veloc.', scene.velocidade],
                  ['Gimbal', scene.gimbal],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-dp-night-800 px-3 py-2.5">
                    <dt className="text-[10px] tracking-widest text-white/40 uppercase">{k}</dt>
                    <dd className="mt-1 text-[13px] text-dp-sky-200">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <ol className="flex flex-col gap-1.5">
              {scenes.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(i)}
                    className={`grid w-full cursor-pointer grid-cols-[28px_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 ${
                      i === active ? 'bg-dp-signal-500/12 ring-1 ring-dp-signal-500/50' : 'hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`flex size-7 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                        i === active ? 'bg-dp-signal-500 text-dp-night-950' : i < active ? 'bg-dp-sky-400/20 text-dp-sky-200' : 'bg-dp-night-800 text-white/50'
                      }`}
                    >
                      {s.id}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{s.movimento}</span>
                      <span className="block text-xs text-white/45">{s.fase}</span>
                    </span>
                    <span className="font-mono text-xs text-white/40">{s.altura.split(' ·')[0]}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Tabela completa no formato padrão do copiloto */}
        <div className="mt-10 overflow-x-auto rounded-2xl border border-dp-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-dp-night-800 font-mono text-[11px] tracking-widest text-white/50 uppercase">
              <tr>
                {['Cena', 'Movimento', 'Altura', 'Velocidade', 'Gimbal', 'Duração', 'Objetivo visual'].map((h) => (
                  <th key={h} className="px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenes.map((s, i) => (
                <tr key={s.id} className={`border-t border-dp-line transition-colors duration-200 ${i === active ? 'bg-dp-signal-500/8' : ''}`}>
                  <td className="px-4 py-3 font-mono text-dp-sky-200">{s.id}</td>
                  <td className="px-4 py-3 font-semibold text-white">{s.movimento}</td>
                  <td className="px-4 py-3 font-mono text-white/70">{s.altura}</td>
                  <td className="px-4 py-3 font-mono text-white/70">{s.velocidade}</td>
                  <td className="px-4 py-3 font-mono text-white/70">{s.gimbal}</td>
                  <td className="px-4 py-3 font-mono text-white/70">{s.duracao} s</td>
                  <td className="px-4 py-3 text-white/60">{s.objetivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1fr]">
          <div>
            <h3 className="mb-2 font-mono text-[11px] tracking-[0.2em] text-white/45 uppercase">Premissas</h3>
            <ul className="space-y-1.5 text-sm text-white/65">
              {flightPlan.premissas.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-dp-sky-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <p className="self-end text-sm text-white/45 md:text-right">
            Valores são referências iniciais de planejamento, nunca garantias universais. Simulação reproduzida em {SPEED}× a velocidade real.
          </p>
        </div>
      </Container>
    </section>
  )
}
