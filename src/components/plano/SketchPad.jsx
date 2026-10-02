import { useEffect, useRef, useState } from 'react'
import { Circle, Minus, Pencil, Send, Square, Trash2, Undo2, X } from 'lucide-react'
import { canvasToImageBlock } from '@/lib/plano'

const W = 960
const H = 640

const cores = [
  { id: 'construcao', label: 'Construção', color: '#1F2937' },
  { id: 'vegetacao', label: 'Vegetação', color: '#16A34A' },
  { id: 'agua', label: 'Água', color: '#2563EB' },
  { id: 'via', label: 'Via', color: '#9CA3AF' },
  { id: 'risco', label: 'Risco (fio/pessoas)', color: '#DC2626' },
]

const ferramentas = [
  { id: 'livre', label: 'Lápis', icon: Pencil },
  { id: 'retangulo', label: 'Retângulo', icon: Square },
  { id: 'circulo', label: 'Círculo', icon: Circle },
  { id: 'linha', label: 'Linha', icon: Minus },
  { id: 'decolagem', label: 'Decolagem (H)', icon: null },
]

export const legendaDesenho =
  'Legenda de cores do desenho: cinza-escuro = construção, verde = vegetação/árvores, azul = água, cinza-claro = via, vermelho = risco (fios, postes, pessoas), círculo com H = ponto de decolagem. Vista de cima, norte para cima.'

function drawShape(ctx, s) {
  ctx.strokeStyle = s.color
  ctx.fillStyle = s.color
  ctx.lineWidth = s.tool === 'livre' ? 3 : 3.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (s.tool === 'livre') {
    ctx.beginPath()
    s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    ctx.stroke()
    return
  }
  const [a, b] = [s.points[0], s.points.at(-1)]
  if (s.tool === 'retangulo') {
    ctx.globalAlpha = 0.12
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y)
    ctx.globalAlpha = 1
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
  } else if (s.tool === 'circulo') {
    const r = Math.hypot(b.x - a.x, b.y - a.y)
    ctx.beginPath()
    ctx.arc(a.x, a.y, r, 0, Math.PI * 2)
    ctx.globalAlpha = 0.12
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.stroke()
  } else if (s.tool === 'linha') {
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  } else if (s.tool === 'decolagem') {
    ctx.strokeStyle = '#16A34A'
    ctx.fillStyle = '#16A34A'
    ctx.beginPath()
    ctx.arc(a.x, a.y, 18, 0, Math.PI * 2)
    ctx.stroke()
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('H', a.x, a.y + 1)
  }
}

/** Editor para o piloto desenhar o croqui do local (vista superior). */
export function SketchPad({ instrucoes, onSend, onClose }) {
  const canvasRef = useRef(null)
  const [shapes, setShapes] = useState([])
  const [draft, setDraft] = useState(null)
  const [tool, setTool] = useState('retangulo')
  const [cor, setCor] = useState(cores[0].color)
  const [descricao, setDescricao] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#EEF1F5'
    ctx.lineWidth = 1
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '600 16px sans-serif'
    ctx.fillText('N ↑', W - 44, 26)
    ;[...shapes, draft].filter(Boolean).forEach((s) => drawShape(ctx, s))
  }, [shapes, draft])

  function pos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H }
  }

  function down(e) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = pos(e)
    if (tool === 'decolagem') {
      setShapes((prev) => [...prev, { tool, color: '#16A34A', points: [p] }])
      return
    }
    setDraft({ tool, color: cor, points: [p] })
  }

  function move(e) {
    if (!draft) return
    const p = pos(e)
    setDraft((d) => ({ ...d, points: d.tool === 'livre' ? [...d.points, p] : [d.points[0], p] }))
  }

  function up() {
    if (draft && draft.points.length > 1) setShapes((prev) => [...prev, draft])
    setDraft(null)
  }

  function send() {
    onSend(canvasToImageBlock(canvasRef.current, 'image/png'), descricao.trim())
  }

  return (
    <div className="rounded-2xl border border-dp-line bg-dp-night-900 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-xl font-bold text-white">Desenhe o mapa do local</p>
          <p className="text-sm text-white/60">{instrucoes || 'Vista de cima: construções, árvores, vias, água, fios e o ponto de decolagem.'}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar editor" className="cursor-pointer rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
          <X className="size-5" />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg bg-dp-night-950 p-1">
          {ferramentas.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTool(id)}
              aria-pressed={tool === id}
              title={label}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                tool === id ? 'bg-dp-signal-500 text-dp-night-950' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              {Icon ? <Icon className="size-3.5" /> : <span className="font-mono">H</span>}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {cores.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCor(c.color)}
              aria-pressed={cor === c.color}
              title={c.label}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors duration-150 ${
                cor === c.color ? 'bg-white/15 text-white' : 'text-white/55 hover:bg-white/10'
              }`}
            >
              <span className="size-3 rounded-full" style={{ background: c.color, boxShadow: '0 0 0 1px rgb(255 255 255 / 0.35)' }} />
              {c.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          <button type="button" onClick={() => setShapes((s) => s.slice(0, -1))} title="Desfazer" className="cursor-pointer rounded-md p-2 text-white/70 hover:bg-white/10">
            <Undo2 className="size-4" />
          </button>
          <button type="button" onClick={() => setShapes([])} title="Limpar" className="cursor-pointer rounded-md p-2 text-white/70 hover:bg-white/10">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="block w-full cursor-crosshair touch-none rounded-lg"
        aria-label="Área de desenho do mapa do local"
      />

      <textarea
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={2}
        placeholder="Descreva os detalhes: medidas aproximadas, alturas, o que é cada forma… (ex.: casa de 2 andares com 12×8 m, árvores de ~10 m ao sul, rede elétrica na rua)"
        className="mt-3 w-full resize-none rounded-lg border border-dp-line bg-dp-night-950 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-dp-sky-400 focus:outline-none"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={send}
          disabled={shapes.length === 0}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-dp-signal-500 px-5 py-2.5 text-sm font-bold text-dp-night-950 transition-[background-color,transform,opacity] duration-150 hover:bg-dp-signal-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="size-4" /> Enviar desenho
        </button>
      </div>
    </div>
  )
}
