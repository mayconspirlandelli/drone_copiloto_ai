import { useEffect, useId, useMemo, useRef } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import { DroneTop } from '@/components/DroneGlyph'
import { fovPath, periodoLabel, smoothPath } from '@/lib/plano'

// Cores de layer no estilo AutoCAD (fundo do model space escuro).
export const CAD = {
  bg: '#212830',
  grid: '#2C3540',
  gridMajor: '#36414E',
  white: '#E8EDF2',
  cyan: '#4FD8E8',
  green: '#5BE37D',
  yellow: '#F2D45C',
  red: '#FF5A5A',
  magenta: '#E070E8',
  gray: '#8C98A6',
  orange: '#FF8A1F',
}

const layers = {
  edificacao: { stroke: CAD.white, hatch: 'diag', label: 'EDIF' },
  arvore: { stroke: CAD.green, label: 'VEG' },
  vegetacao: { stroke: CAD.green, hatch: 'dots', label: 'VEG' },
  via: { stroke: CAD.gray, hatch: null, label: 'VIA' },
  agua: { stroke: CAD.cyan, hatch: 'water', label: 'AGUA' },
  muro: { stroke: CAD.yellow, label: 'MURO' },
  fio_eletrico: { stroke: CAD.red, dash: 'dashed', label: 'REDE' },
  poste: { stroke: CAD.red, label: 'REDE' },
  pessoas: { stroke: CAD.red, hatch: 'cross', label: 'PESSOAS' },
  obstaculo: { stroke: CAD.orange, hatch: 'diag', label: 'OBST' },
  decolagem: { stroke: CAD.green, label: 'H' },
  outro: { stroke: CAD.gray, label: 'OUTRO' },
}

function Hatches({ uid, k }) {
  const s = 2.4 * k
  return (
    <defs>
      <pattern id={`${uid}-diag`} width={s} height={s} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2={s} stroke={CAD.white} strokeOpacity="0.35" strokeWidth={0.18 * k} />
      </pattern>
      <pattern id={`${uid}-cross`} width={s} height={s} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d={`M0 0 V${s} M0 0 H${s}`} stroke={CAD.red} strokeOpacity="0.45" strokeWidth={0.18 * k} />
      </pattern>
      <pattern id={`${uid}-water`} width={s * 2} height={s} patternUnits="userSpaceOnUse">
        <path d={`M0 ${s / 2} q ${s / 2} ${-s / 3} ${s} 0 t ${s} 0`} fill="none" stroke={CAD.cyan} strokeOpacity="0.5" strokeWidth={0.16 * k} />
      </pattern>
      <pattern id={`${uid}-dots`} width={s} height={s} patternUnits="userSpaceOnUse">
        <circle cx={s / 2} cy={s / 2} r={0.22 * k} fill={CAD.green} fillOpacity="0.55" />
      </pattern>
    </defs>
  )
}

function Elemento({ el, uid, k }) {
  const layer = layers[el.tipo] ?? layers.outro
  const sw = 0.28 * k
  const fill = layer.hatch ? `url(#${uid}-${layer.hatch})` : 'none'
  const label = (el.rotulo || layer.label).toUpperCase()
  const fontSize = 1.9 * k

  if (el.tipo === 'decolagem') {
    const r = Math.max(el.raio || 0, 3 * k)
    return (
      <g>
        <circle cx={el.x} cy={el.y} r={r} fill="none" stroke={CAD.green} strokeWidth={sw * 1.4} />
        <text x={el.x} y={el.y + r * 0.38} textAnchor="middle" fill={CAD.green} fontSize={r * 1.1} fontFamily="JetBrains Mono, monospace" fontWeight="600">
          H
        </text>
      </g>
    )
  }

  if (el.forma === 'linha' && el.pontos?.length >= 2) {
    const d = el.pontos.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')
    const i0 = Math.floor((el.pontos.length - 1) / 2)
    const [pa, pb] = [el.pontos[i0], el.pontos[i0 + 1]]
    const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }
    if (el.tipo === 'via') {
      const width = Math.max(el.largura || 0, 6)
      return (
        <g>
          <path d={d} fill="none" stroke={CAD.gray} strokeOpacity="0.25" strokeWidth={width} strokeLinejoin="round" />
          <path d={d} fill="none" stroke={CAD.gray} strokeWidth={sw} strokeDasharray={`${3 * k} ${1 * k} ${0.6 * k} ${1 * k}`} />
          <text x={mid.x} y={mid.y - width / 2 - k} fill={CAD.gray} fontSize={fontSize} fontFamily="JetBrains Mono, monospace" textAnchor="middle">
            {label}
          </text>
        </g>
      )
    }
    return (
      <g>
        <path
          d={d}
          fill="none"
          stroke={layer.stroke}
          strokeWidth={sw * (el.tipo === 'muro' ? 2.2 : 1.2)}
          strokeDasharray={layer.dash ? `${2.5 * k} ${1.2 * k}` : undefined}
        />
        <text x={mid.x + k} y={mid.y - k} fill={layer.stroke} fontSize={fontSize} fontFamily="JetBrains Mono, monospace">
          {label}
        </text>
      </g>
    )
  }

  if (el.forma === 'circulo') {
    const r = Math.max(el.raio || 0, 0.8 * k)
    return (
      <g>
        <circle cx={el.x} cy={el.y} r={r} fill={fill} stroke={layer.stroke} strokeWidth={sw} />
        {(el.tipo === 'arvore' || el.tipo === 'poste') && (
          <path d={`M${el.x - r * 0.5} ${el.y} H${el.x + r * 0.5} M${el.x} ${el.y - r * 0.5} V${el.y + r * 0.5}`} stroke={layer.stroke} strokeWidth={sw * 0.7} />
        )}
        {el.tipo !== 'arvore' && (
          <text x={el.x + r + 0.6 * k} y={el.y + 0.6 * k} fill={layer.stroke} fontSize={fontSize} fontFamily="JetBrains Mono, monospace">
            {label}
          </text>
        )}
      </g>
    )
  }

  // retângulo
  const w = Math.max(el.largura || 0, k)
  const h = Math.max(el.altura || 0, k)
  return (
    <g>
      <rect x={el.x} y={el.y} width={w} height={h} fill={fill} stroke={layer.stroke} strokeWidth={sw * (el.tipo === 'edificacao' ? 1.6 : 1)} />
      <text x={el.x + w / 2} y={el.y + h / 2 + 0.7 * k} textAnchor="middle" fill={layer.stroke} fontSize={fontSize} fontFamily="JetBrains Mono, monospace" paintOrder="stroke" stroke={CAD.bg} strokeWidth={0.5 * k}>
        {label}
      </text>
      {el.altura_estimada_m != null && (
        <text x={el.x + w / 2} y={el.y + h / 2 + 3 * k} textAnchor="middle" fill={CAD.gray} fontSize={fontSize * 0.8} fontFamily="JetBrains Mono, monospace">
          h≈{el.altura_estimada_m} m
        </text>
      )}
    </g>
  )
}

/** Cota horizontal/vertical no padrão de desenho técnico. */
function Cota({ x1, y1, x2, y2, texto, k, vertical }) {
  const t = 1.2 * k
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  return (
    <g stroke={CAD.cyan} strokeWidth={0.16 * k} fill={CAD.cyan}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {vertical ? (
        <>
          <line x1={x1 - t} y1={y1} x2={x1 + t} y2={y1} />
          <line x1={x2 - t} y1={y2} x2={x2 + t} y2={y2} />
          <text x={mx - t} y={my} transform={`rotate(-90 ${mx - t} ${my})`} textAnchor="middle" stroke="none" fontSize={1.8 * k} fontFamily="JetBrains Mono, monospace">
            {texto}
          </text>
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - t} x2={x1} y2={y1 + t} />
          <line x1={x2} y1={y2 - t} x2={x2} y2={y2 + t} />
          <text x={mx} y={my - t} textAnchor="middle" stroke="none" fontSize={1.8 * k} fontFamily="JetBrains Mono, monospace">
            {texto}
          </text>
        </>
      )}
    </g>
  )
}

/** Drone voando em loop sobre a trajetória da cena. */
function CenaLayer({ cena, k }) {
  const reduce = useReducedMotion()
  const pathRef = useRef(null)
  const progress = useMotionValue(reduce ? 1 : 0)
  const x = useMotionValue(cena.trajetoria[0]?.x ?? 0)
  const y = useMotionValue(cena.trajetoria[0]?.y ?? 0)
  const fov = useMotionValue('')
  const d = useMemo(() => smoothPath(cena.trajetoria), [cena.trajetoria])

  function place(v) {
    const path = pathRef.current
    if (!path) return
    const len = path.getTotalLength()
    const at = len * v
    const p = path.getPointAtLength(at)
    const a = path.getPointAtLength(Math.min(len, at + 0.5))
    const b = path.getPointAtLength(Math.max(0, at - 0.5))
    const heading = (Math.atan2(a.y - b.y, a.x - b.x) * 180) / Math.PI
    let cam = heading
    if (cena.camera === 'subject') cam = (Math.atan2(cena.alvo.y - p.y, cena.alvo.x - p.x) * 180) / Math.PI
    if (cena.camera === 'back') cam = heading + 180
    x.set(p.x)
    y.set(p.y)
    fov.set(fovPath(p.x, p.y, cam, cena.camera, 13 * k))
  }

  useMotionValueEvent(progress, 'change', place)

  useEffect(() => {
    place(progress.get())
    if (reduce) return
    const duration = Math.min(9, Math.max(4, (cena.duracao_s || 10) / 2))
    const controls = animate(progress, [0, 1], { duration, ease: 'linear', repeat: Infinity, repeatDelay: 0.8 })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, reduce])

  const start = cena.trajetoria[0]
  const end = cena.trajetoria.at(-1)

  return (
    <g>
      <path ref={pathRef} d={d} fill="none" stroke="none" />
      <path d={d} fill="none" stroke={CAD.orange} strokeOpacity="0.3" strokeWidth={0.3 * k} strokeDasharray={`${1.2 * k} ${1.2 * k}`} />
      <motion.path d={d} fill="none" stroke={CAD.orange} strokeWidth={0.55 * k} strokeLinecap="round" style={{ pathLength: progress }} />
      {cena.camera === 'subject' && (
        <g stroke={CAD.magenta} strokeWidth={0.2 * k}>
          <circle cx={cena.alvo.x} cy={cena.alvo.y} r={1.4 * k} fill="none" />
          <path d={`M${cena.alvo.x - 2.2 * k} ${cena.alvo.y} H${cena.alvo.x + 2.2 * k} M${cena.alvo.x} ${cena.alvo.y - 2.2 * k} V${cena.alvo.y + 2.2 * k}`} />
        </g>
      )}
      <circle cx={start.x} cy={start.y} r={0.9 * k} fill={CAD.orange} />
      <rect x={end.x - 0.9 * k} y={end.y - 0.9 * k} width={1.8 * k} height={1.8 * k} fill="none" stroke={CAD.orange} strokeWidth={0.25 * k} />
      <motion.path d={fov} fill={CAD.orange} fillOpacity="0.14" stroke={CAD.orange} strokeOpacity="0.45" strokeWidth={0.15 * k} />
      <motion.g style={{ x, y }}>
        <g transform={`scale(${0.16 * k})`}>
          <circle r="16" fill={CAD.orange} fillOpacity="0.15" />
          <DroneTop scale={1} spinning={!reduce} />
        </g>
      </motion.g>
    </g>
  )
}

/**
 * Planta baixa do local em estilo CAD (vista superior, unidades em metros).
 * Com `cena`, anima o drone voando a trajetória; com `trajetorias`, desenha as rotas de todas as cenas.
 */
export function PlantaCAD({ plano, cena, trajetorias, compact = false, className }) {
  const uid = useId().replace(/:/g, '')
  const { planta, resumo } = plano
  const W = Math.max(10, planta.largura_m)
  const D = Math.max(10, planta.profundidade_m)
  const k = Math.max(W, D) / 100
  const m = 9 * k
  const tb = compact ? 0 : 12 * k
  const gridStep = [1, 2, 5, 10, 20, 50, 100].find((s) => Math.max(W, D) / s <= 14) ?? 100

  const gridLines = []
  for (let gx = 0; gx <= W + 0.001; gx += gridStep) gridLines.push(<line key={`gx${gx}`} x1={gx} y1={0} x2={gx} y2={D} />)
  for (let gy = 0; gy <= D + 0.001; gy += gridStep) gridLines.push(<line key={`gy${gy}`} x1={0} y1={gy} x2={W} y2={gy} />)

  // Ordem de desenho: áreas de fundo primeiro, riscos e decolagem por cima.
  const order = ['via', 'agua', 'vegetacao', 'pessoas', 'edificacao', 'obstaculo', 'muro', 'arvore', 'outro', 'fio_eletrico', 'poste', 'decolagem']
  const elementos = [...planta.elementos].sort((a, b) => order.indexOf(a.tipo) - order.indexOf(b.tipo))

  return (
    <svg
      viewBox={`${-m} ${-m} ${W + 2 * m} ${D + 2 * m + tb}`}
      className={className}
      style={{ background: CAD.bg, display: 'block', width: '100%' }}
      role="img"
      aria-label={`Planta baixa: ${resumo.titulo}${cena ? ` — cena ${cena.nome}` : ''}`}
    >
      <Hatches uid={uid} k={k} />
      <g stroke={CAD.grid} strokeWidth={0.1 * k}>
        {gridLines}
      </g>
      <rect x={0} y={0} width={W} height={D} fill="none" stroke={CAD.gridMajor} strokeWidth={0.2 * k} />

      {elementos.map((el, i) => (
        <Elemento key={i} el={el} uid={uid} k={k} />
      ))}

      {trajetorias?.map((c, i) => (
        <g key={i}>
          <path d={smoothPath(c.trajetoria)} fill="none" stroke={CAD.orange} strokeOpacity="0.75" strokeWidth={0.35 * k} strokeDasharray={`${1.5 * k} ${1 * k}`} />
          <g transform={`translate(${c.trajetoria[0].x} ${c.trajetoria[0].y})`}>
            <circle r={1.8 * k} fill={CAD.bg} stroke={CAD.orange} strokeWidth={0.25 * k} />
            <text y={0.65 * k} textAnchor="middle" fill={CAD.orange} fontSize={1.8 * k} fontFamily="JetBrains Mono, monospace">
              {i + 1}
            </text>
          </g>
        </g>
      ))}

      {cena && <CenaLayer cena={cena} k={k} />}

      {/* cotas gerais */}
      <Cota x1={0} y1={-4 * k} x2={W} y2={-4 * k} texto={`${Math.round(W)} m`} k={k} />
      <Cota x1={-4 * k} y1={0} x2={-4 * k} y2={D} texto={`${Math.round(D)} m`} k={k} vertical />

      {/* norte */}
      <g transform={`translate(${W + 4.5 * k} ${4 * k})`} fill={CAD.white}>
        <path d={`M0 ${-3 * k} L${1.3 * k} ${1.5 * k} L0 ${0.6 * k} L${-1.3 * k} ${1.5 * k} Z`} />
        <text y={4.2 * k} textAnchor="middle" fontSize={1.8 * k} fontFamily="JetBrains Mono, monospace">
          N
        </text>
      </g>

      {/* carimbo */}
      {!compact && (
        <g transform={`translate(0 ${D + 6 * k})`} fontFamily="JetBrains Mono, monospace">
          <rect width={W} height={9 * k} fill="none" stroke={CAD.white} strokeOpacity="0.7" strokeWidth={0.18 * k} />
          <line x1={W * 0.55} y1={0} x2={W * 0.55} y2={9 * k} stroke={CAD.white} strokeOpacity="0.7" strokeWidth={0.18 * k} />
          <line x1={W * 0.8} y1={0} x2={W * 0.8} y2={9 * k} stroke={CAD.white} strokeOpacity="0.7" strokeWidth={0.18 * k} />
          <text x={1.2 * k} y={3.6 * k} fill={CAD.white} fontSize={2.2 * k}>
            {resumo.titulo.toUpperCase()}
          </text>
          <text x={1.2 * k} y={7 * k} fill={CAD.gray} fontSize={1.6 * k}>
            {resumo.local}
          </text>
          <text x={W * 0.55 + 1.2 * k} y={3.6 * k} fill={CAD.gray} fontSize={1.5 * k}>
            PERÍODO
          </text>
          <text x={W * 0.55 + 1.2 * k} y={7 * k} fill={CAD.yellow} fontSize={2 * k}>
            {(periodoLabel[resumo.periodo] ?? resumo.periodo).toUpperCase()}
          </text>
          <text x={W * 0.8 + 1.2 * k} y={3.6 * k} fill={CAD.gray} fontSize={1.5 * k}>
            UNID. / GRADE
          </text>
          <text x={W * 0.8 + 1.2 * k} y={7 * k} fill={CAD.white} fontSize={2 * k}>
            m / {gridStep} m
          </text>
        </g>
      )}
    </svg>
  )
}

export const legendaCAD = [
  { label: 'Edificação', color: CAD.white },
  { label: 'Vegetação', color: CAD.green },
  { label: 'Água', color: CAD.cyan },
  { label: 'Muro', color: CAD.yellow },
  { label: 'Rede elétrica / pessoas', color: CAD.red },
  { label: 'Trajetória do drone', color: CAD.orange },
  { label: 'Alvo da câmera', color: CAD.magenta },
]
