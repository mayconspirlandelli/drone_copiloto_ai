import { Fragment, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Eye, EyeOff, ImagePlus, KeyRound, Settings2, Loader2, Map as MapIcon, Mic, MicOff, RotateCcw, Send, Sparkles, Volume2, VolumeX, X } from 'lucide-react'
import { Container } from '@/components/Container'
import { DroneTop } from '@/components/DroneGlyph'
import { legendaCAD, PlantaCAD } from '@/components/plano/PlantaCAD'
import { legendaDesenho, SketchPad } from '@/components/plano/SketchPad'
import { demoPlano } from '@/data/demoPlano'
import { fileToImageBlock, imagePartToDataUrl, periodoLabel } from '@/lib/plano'
import { falar, pararFala, sinteseSuportada, useDitado } from '@/lib/useVoz'

const EASE_OUT = [0.23, 1, 0.32, 1]

const saudacao =
  'Olá! Sou o DroneCopiloto AI e vou montar o plano de voo com você. Para começar: que tipo de voo você vai fazer e qual o objetivo da filmagem?'

const tiposDeVoo = ['Imóvel / arquitetura', 'Evento ao ar livre', 'Paisagem / natureza', 'Inspeção de telhado', 'Esporte / ação']
const periodos = ['Manhã', 'Tarde', 'Noite']

const etapas = [
  { id: 'tipo', label: 'Tipo de voo' },
  { id: 'local', label: 'Descrição do local' },
  { id: 'periodo', label: 'Horário (manhã, tarde ou noite)' },
  { id: 'foto', label: 'Foto do local (opcional)' },
  { id: 'desenho', label: 'Desenho do mapa' },
  { id: 'plano', label: 'Planta baixa + 3 cenas' },
]

/** Renderização mínima de markdown: parágrafos, listas e **negrito**. */
function RichText({ text }) {
  const blocks = text.split(/\n{2,}/)
  const inline = (s) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') ? (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    )
  return blocks.map((block, i) => {
    const lines = block.split('\n')
    if (lines.every((l) => /^\s*([-*•]|\d+\.)\s/.test(l))) {
      return (
        <ul key={i} className="my-1.5 space-y-1">
          {lines.map((l, j) => (
            <li key={j} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-dp-sky-400" />
              <span>{inline(l.replace(/^\s*([-*•]|\d+\.)\s/, ''))}</span>
            </li>
          ))}
        </ul>
      )
    }
    return (
      <p key={i} className="my-1.5 whitespace-pre-line">
        {inline(block)}
      </p>
    )
  })
}

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, transform: 'translateY(8px)' }}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-dp-night-800">
          <svg viewBox="-16 -16 32 32" className="size-5" aria-hidden="true">
            <DroneTop spinning={false} />
          </svg>
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
          isUser ? 'rounded-br-md bg-dp-signal-500 text-dp-night-950' : msg.erro ? 'rounded-bl-md bg-dp-stop-500/15 text-white' : 'rounded-bl-md bg-dp-night-800 text-white/85'
        }`}
      >
        {msg.images?.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {msg.images.map((src, i) => (
              <img key={i} src={src} alt="Imagem enviada" className="max-h-40 rounded-lg border border-black/10 bg-white object-contain" />
            ))}
          </div>
        )}
        {isUser ? <p className="whitespace-pre-line">{msg.text}</p> : <RichText text={msg.text} />}
        {msg.retry && (
          <button type="button" onClick={msg.retry} className="mt-1 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-dp-signal-300 hover:text-dp-signal-500">
            <RotateCcw className="size-3.5" /> Tentar novamente
          </button>
        )}
      </div>
    </motion.div>
  )
}

function CenaCard({ plano, cena, index }) {
  const specs = [
    ['Altura', cena.altura],
    ['Veloc.', cena.velocidade],
    ['Gimbal', cena.gimbal],
    ['Duração', `${cena.duracao_s} s`],
  ]
  return (
    <motion.article
      initial={{ opacity: 0, transform: 'translateY(16px)' }}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.08, ease: EASE_OUT }}
      className="overflow-hidden rounded-2xl border border-dp-line bg-dp-night-900"
    >
      <PlantaCAD plano={plano} cena={cena} compact />
      <div className="p-4">
        <p className="font-mono text-[10.5px] tracking-[0.2em] text-dp-signal-300 uppercase">
          Cena {index + 1} · {cena.movimento}
        </p>
        <h3 className="font-heading mt-1 text-2xl font-bold text-white">{cena.nome}</h3>
        <p className="mt-1 text-sm text-white/65">{cena.objetivo}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 font-mono">
          {specs.map(([k, v]) => (
            <div key={k} className="rounded-md bg-dp-night-800 px-2.5 py-1.5">
              <dt className="text-[9.5px] tracking-widest text-white/40 uppercase">{k}</dt>
              <dd className="text-xs text-dp-sky-200">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 rounded-md bg-dp-warn-500/10 px-2.5 py-2 text-xs text-white/75">
          <span className="font-semibold text-dp-warn-500">Riscos: </span>
          {cena.riscos}
        </p>
      </div>
    </motion.article>
  )
}

function Resultado({ plano, exemplo }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-2xl border border-dp-line bg-dp-night-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dp-line px-4 py-3">
          <div>
            <p className="font-mono text-[10.5px] tracking-[0.2em] text-dp-sky-400 uppercase">
              Planta baixa {exemplo && '· exemplo'}
            </p>
            <h2 className="font-heading text-2xl font-bold text-white">{plano.resumo.titulo}</h2>
          </div>
          <span className="font-mono text-xs text-white/45">
            {plano.resumo.tipo_voo} · {periodoLabel[plano.resumo.periodo] ?? plano.resumo.periodo}
          </span>
        </div>
        <PlantaCAD plano={plano} trajetorias={plano.cenas} />
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-dp-line px-4 py-3 font-mono text-[10.5px] text-white/55">
          {legendaCAD.map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {plano.cenas.map((cena, i) => (
          <CenaCard key={`${cena.nome}-${i}`} plano={plano} cena={cena} index={i} />
        ))}
      </div>

      {plano.planta.observacoes.length > 0 && (
        <div className="rounded-2xl border border-dp-line bg-dp-night-900 p-4">
          <p className="mb-2 font-mono text-[10.5px] tracking-[0.2em] text-white/45 uppercase">Premissas e inspeção presencial</p>
          <ul className="space-y-1 text-sm text-white/65">
            {plano.planta.observacoes.map((o) => (
              <li key={o} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-dp-sky-400" />
                {o}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/40">
            Valores são referências iniciais. Faça o <a href="/#checklist" className="text-dp-sky-400 underline underline-offset-2">checklist pré-voo</a> e confirme autorizações no SARPAS NG.
          </p>
        </div>
      )}
    </div>
  )
}

const STORAGE_MODELO = 'dronecopiloto-modelo'

function carregarConfig() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_MODELO) || 'null')
  } catch {
    return null
  }
}

function salvarConfig(config) {
  try {
    if (config) localStorage.setItem(STORAGE_MODELO, JSON.stringify(config))
    else localStorage.removeItem(STORAGE_MODELO)
  } catch {
    // armazenamento indisponível: a configuração vale só nesta aba
  }
}

/** Painel para escolher provedor, modelo e informar a própria chave de API. */
function ModeloConfig({ provedores, provider, model, apiKey, lembrar, onChange, onClose }) {
  const [mostrarChave, setMostrarChave] = useState(false)
  const atual = provedores.find((p) => p.id === provider)
  const campo =
    'w-full rounded-lg border border-dp-line bg-dp-night-950 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-dp-sky-400 focus:outline-none'

  return (
    <motion.div
      initial={{ opacity: 0, transform: 'translateY(-6px)' }}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      exit={{ opacity: 0, transform: 'translateY(-6px)' }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className="border-b border-dp-line bg-dp-night-950/60 px-4 py-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] tracking-widest text-white/45 uppercase">Provedor</span>
          <select value={provider ?? ''} onChange={(e) => onChange({ provider: e.target.value, model: '' })} className={`${campo} cursor-pointer`}>
            {provedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] tracking-widest text-white/45 uppercase">Modelo</span>
          <input
            list="dp-modelos"
            value={model}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder={atual?.model ?? 'nome do modelo'}
            spellCheck={false}
            className={`${campo} font-mono`}
          />
          <datalist id="dp-modelos">
            {atual?.sugestoes?.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>
      </div>

      {atual?.aceitaChave ? (
        <label className="mt-3 flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-widest text-white/45 uppercase">
            <KeyRound className="size-3" /> Chave da API · {atual.label}
          </span>
          <div className="relative">
            <input
              type={mostrarChave ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => onChange({ apiKey: e.target.value })}
              placeholder={atual.disponivel ? 'Opcional — o servidor já tem uma chave' : 'Cole sua chave de API'}
              autoComplete="off"
              spellCheck={false}
              className={`${campo} pr-10 font-mono`}
            />
            <button
              type="button"
              onClick={() => setMostrarChave(!mostrarChave)}
              aria-label={mostrarChave ? 'Ocultar chave' : 'Mostrar chave'}
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1 text-white/50 hover:text-white"
            >
              {mostrarChave ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>
      ) : (
        <p className="mt-3 text-xs text-white/50">
          O Ollama roda no servidor configurado pelo administrador ({atual?.disponivel ? 'disponível' : `falta ${atual?.configurar} no .env`}) e não precisa de chave.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-white/65">
          <input type="checkbox" checked={lembrar} onChange={(e) => onChange({ lembrar: e.target.checked })} className="accent-dp-signal-500" />
          Lembrar neste navegador
        </label>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-full bg-dp-signal-500 px-4 py-1.5 text-xs font-bold text-dp-night-950 hover:bg-dp-signal-300">
          Pronto
        </button>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-white/40">
        A chave é enviada ao servidor do site apenas para chamar a API do provedor escolhido e não é salva no servidor. Trocar de provedor ou de modelo começa uma conversa nova.
      </p>
    </motion.div>
  )
}

export function PlanoDeVooChat() {
  const [history, setHistory] = useState([]) // histórico no formato nativo do provedor
  const [provedores, setProvedores] = useState([])
  const [provider, setProvider] = useState(null)
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [lembrar, setLembrar] = useState(false)
  const [configAberta, setConfigAberta] = useState(false)
  const [display, setDisplay] = useState([{ role: 'assistant', text: saudacao }])
  const [input, setInput] = useState('')
  const [anexos, setAnexos] = useState([]) // { block, preview }
  const [carregando, setCarregando] = useState(false)
  const [gerandoPlano, setGerandoPlano] = useState(false)
  const [desenho, setDesenho] = useState(null) // { instrucoes } quando o editor está aberto
  const [plano, setPlano] = useState(null)
  const [exemplo, setExemplo] = useState(false)
  const [lerRespostas, setLerRespostas] = useState(false)
  const [feitos, setFeitos] = useState(new Set())
  const fileRef = useRef(null)
  const listRef = useRef(null)
  const sendRef = useRef(null)
  const resultadoRef = useRef(null)

  const ditado = useDitado((texto) => sendRef.current?.(texto))

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [display, carregando])

  useEffect(() => () => pararFala(), [])

  useEffect(() => {
    fetch('/api/provedores')
      .then((r) => r.json())
      .then((data) => {
        const lista = data.provedores ?? []
        setProvedores(lista)
        const salvo = carregarConfig()
        const valido = salvo && lista.some((p) => p.id === salvo.provider)
        const escolhido = valido ? salvo.provider : data.padrao
        setProvider(escolhido)
        if (valido) {
          setModel(salvo.model ?? '')
          setApiKey(salvo.apiKey ?? '')
          setLembrar(true)
        }
        const atual = lista.find((p) => p.id === escolhido)
        if (atual && !atual.disponivel && !(valido && salvo.apiKey)) setConfigAberta(true)
      })
      .catch(() => {
        // servidor indisponível: o erro aparece ao enviar a primeira mensagem
      })
  }, [])

  useEffect(() => {
    if (provider) salvarConfig(lembrar ? { provider, model, apiKey } : null)
  }, [provider, model, apiKey, lembrar])

  // Em telas estreitas o resultado fica abaixo do chat: leva o piloto até a planta gerada.
  useEffect(() => {
    if (plano && window.innerWidth < 1024) resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [plano])

  function marcar(...ids) {
    setFeitos((prev) => new Set([...prev, ...ids]))
  }

  async function enviarConteudo(mensagem, bubble, { ehDesenho = false } = {}) {
    setDisplay((d) => [...d.filter((m) => !m.retry), bubble])
    setCarregando(true)
    setGerandoPlano(ehDesenho)

    try {
      const res = await fetch('/api/plano-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model: model.trim() || undefined, apiKey: apiKey.trim() || undefined, history, mensagem }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`)

      setHistory(data.history)
      if (data.text) {
        setDisplay((d) => [...d, { role: 'assistant', text: data.text }])
        if (lerRespostas) falar(data.text)
      }
      if (data.desenho) {
        setDesenho({ instrucoes: data.desenho.instrucoes })
        marcar('tipo', 'local', 'periodo')
      }
      if (data.plano) {
        setPlano(data.plano)
        setExemplo(false)
        setDesenho(null)
        marcar('tipo', 'local', 'periodo', 'desenho', 'plano')
      }
    } catch (err) {
      const retry = () => enviarConteudo(mensagem, bubble, { ehDesenho })
      setDisplay((d) => [
        ...d,
        {
          role: 'assistant',
          erro: true,
          text: `Não consegui falar com o copiloto: ${err.message === 'Failed to fetch' ? 'servidor indisponível (rode `npm run dev:server`).' : err.message}`,
          retry,
        },
      ])
    } finally {
      setCarregando(false)
      setGerandoPlano(false)
    }
  }

  function enviar(textoOverride) {
    const texto = (textoOverride ?? input).trim()
    if ((!texto && anexos.length === 0) || carregando) return
    const mensagem = { text: texto || 'Foto do local do voo.', images: anexos.map((a) => a.block) }
    if (anexos.length) marcar('foto')
    enviarConteudo(mensagem, { role: 'user', text: texto, images: anexos.map((a) => a.preview) })
    setInput('')
    setAnexos([])
  }
  useEffect(() => {
    sendRef.current = enviar
  })

  function enviarDesenho(block, descricao) {
    const texto = `Desenho do mapa do local (vista de cima). ${legendaDesenho}${descricao ? `\nDetalhes: ${descricao}` : ''}`
    marcar('desenho')
    setDesenho(null)
    enviarConteudo({ text: texto, images: [block] }, {
      role: 'user',
      text: descricao || 'Desenho do mapa do local',
      images: [imagePartToDataUrl(block)],
    }, { ehDesenho: true })
  }

  async function anexar(e) {
    const files = [...(e.target.files ?? [])].slice(0, 3)
    e.target.value = ''
    for (const file of files) {
      try {
        const block = await fileToImageBlock(file)
        setAnexos((a) => [...a, { block, preview: imagePartToDataUrl(block) }])
      } catch {
        // imagem ilegível: ignora
      }
    }
  }

  function reiniciar() {
    pararFala()
    setHistory([])
    setDisplay([{ role: 'assistant', text: saudacao }])
    setPlano(null)
    setExemplo(false)
    setDesenho(null)
    setFeitos(new Set())
  }

  const provedorAtual = provedores.find((p) => p.id === provider)

  // Cada provedor/modelo tem seu formato de histórico: trocar começa uma conversa nova.
  function mudarConfig(mudancas) {
    const trocaModelo =
      ('provider' in mudancas && mudancas.provider !== provider) || ('model' in mudancas && mudancas.model !== model)
    if (trocaModelo && history.length > 0) reiniciar()
    if ('provider' in mudancas) {
      if (mudancas.provider !== provider) setApiKey('')
      setProvider(mudancas.provider)
    }
    if ('model' in mudancas) setModel(mudancas.model)
    if ('apiKey' in mudancas) setApiKey(mudancas.apiKey)
    if ('lembrar' in mudancas) setLembrar(mudancas.lembrar)
  }

  const modeloEfetivo = model.trim() || provedorAtual?.model
  const pronto = Boolean(provedorAtual && (provedorAtual.disponivel || (provedorAtual.aceitaChave && apiKey.trim())))

  const ultimaResposta = [...display].reverse().find((m) => m.role === 'assistant' && !m.erro)?.text ?? ''
  const chips = history.length === 0 ? tiposDeVoo : /manh[ãa]|tarde|noite|hor[áa]rio|per[íi]odo/i.test(ultimaResposta) ? periodos : []

  return (
    <main className="min-h-svh bg-dp-night-950 pt-16">
      <Container className="max-w-[1400px] py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-xs tracking-[0.25em] text-dp-sky-400 uppercase">Plano de voo com IA</p>
            <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">Converse e monte seu plano.</h1>
            <p className="mt-2 max-w-[640px] text-white/60">
              Conte o tipo de voo, descreva o local e o horário, envie uma foto e desenhe o mapa. O copiloto gera a planta baixa e 3 cenas animadas.
            </p>
          </div>
          <div className="flex gap-2">
            {!plano && (
              <button
                type="button"
                onClick={() => {
                  setPlano(demoPlano)
                  setExemplo(true)
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-dp-sky-400 hover:text-dp-sky-400"
              >
                <Sparkles className="size-4" /> Ver exemplo
              </button>
            )}
            <button
              type="button"
              onClick={reiniciar}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-dp-sky-400 hover:text-dp-sky-400"
            >
              <RotateCcw className="size-4" /> Recomeçar
            </button>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          {/* Chat */}
          <section aria-label="Conversa com o copiloto" className="flex h-[calc(100svh-7rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-dp-line bg-dp-night-900 lg:sticky lg:top-20">
            <div className="flex items-center justify-between border-b border-dp-line px-4 py-3">
              <button
                type="button"
                onClick={() => setConfigAberta(!configAberta)}
                aria-expanded={configAberta}
                className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <span className={`size-2 shrink-0 rounded-full ${pronto ? 'bg-dp-go-500' : 'bg-dp-warn-500'}`} />
                <Settings2 className="size-4 shrink-0 text-white/60" />
                <span className="truncate">{provedorAtual ? `${provedorAtual.label} · ${modeloEfetivo}` : 'Modelo de IA'}</span>
                {!pronto && provedorAtual && <span className="shrink-0 text-xs font-normal text-dp-warn-500">informe a chave</span>}
              </button>
              {sinteseSuportada && (
                <button
                  type="button"
                  onClick={() => {
                    if (lerRespostas) pararFala()
                    setLerRespostas(!lerRespostas)
                  }}
                  aria-pressed={lerRespostas}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    lerRespostas ? 'bg-dp-sky-400/15 text-dp-sky-200' : 'text-white/55 hover:bg-white/10'
                  }`}
                >
                  {lerRespostas ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
                  Ler respostas
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {configAberta && provedores.length > 0 && (
                <ModeloConfig
                  provedores={provedores}
                  provider={provider}
                  model={model}
                  apiKey={apiKey}
                  lembrar={lembrar}
                  onChange={mudarConfig}
                  onClose={() => setConfigAberta(false)}
                />
              )}
            </AnimatePresence>

            <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              {display.map((msg, i) => (
                <Bubble key={i} msg={msg} />
              ))}
              {carregando && (
                <div className="flex items-center gap-2 pl-10 text-sm text-white/55">
                  <Loader2 className="size-4 animate-spin text-dp-sky-400" />
                  {gerandoPlano ? 'Desenhando a planta baixa e as cenas… pode levar um minuto.' : 'Copiloto pensando…'}
                </div>
              )}
            </div>

            {chips.length > 0 && !carregando && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                {chips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => enviar(c)}
                    className="cursor-pointer rounded-full border border-dp-line px-3 py-1.5 text-xs text-white/75 transition-colors hover:border-dp-sky-400 hover:text-dp-sky-200"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {anexos.length > 0 && (
              <div className="flex gap-2 px-4 pb-2">
                {anexos.map((a, i) => (
                  <div key={i} className="relative">
                    <img src={a.preview} alt="Anexo" className="size-14 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setAnexos((arr) => arr.filter((_, j) => j !== i))}
                      aria-label="Remover anexo"
                      className="absolute -top-1.5 -right-1.5 cursor-pointer rounded-full bg-dp-night-950 p-0.5 text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                enviar()
              }}
              className="flex items-end gap-1.5 border-t border-dp-line p-3"
            >
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={anexar} />
              <button type="button" onClick={() => fileRef.current?.click()} title="Enviar foto do local" className="cursor-pointer rounded-full p-2.5 text-white/65 transition-colors hover:bg-white/10 hover:text-white">
                <ImagePlus className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setDesenho((d) => d ?? { instrucoes: '' })}
                title="Desenhar mapa do local"
                className="cursor-pointer rounded-full p-2.5 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
              >
                <MapIcon className="size-5" />
              </button>
              <textarea
                value={ditado.ouvindo ? ditado.parcial || 'Ouvindo…' : input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    enviar()
                  }
                }}
                rows={1}
                readOnly={ditado.ouvindo}
                placeholder="Digite ou fale…"
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-dp-line bg-dp-night-950 px-4 py-2.5 text-[15px] text-white placeholder:text-white/35 focus:border-dp-sky-400 focus:outline-none"
              />
              {ditado.suportado && (
                <button
                  type="button"
                  onClick={() => (ditado.ouvindo ? ditado.parar() : ditado.iniciar())}
                  title={ditado.ouvindo ? 'Parar ditado' : 'Falar'}
                  className={`relative cursor-pointer rounded-full p-2.5 transition-colors ${ditado.ouvindo ? 'bg-dp-stop-500 text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
                >
                  {ditado.ouvindo ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                </button>
              )}
              <button
                type="submit"
                disabled={carregando || (!input.trim() && anexos.length === 0)}
                aria-label="Enviar"
                className="cursor-pointer rounded-full bg-dp-signal-500 p-2.5 text-dp-night-950 transition-[background-color,transform,opacity] duration-150 hover:bg-dp-signal-300 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="size-5" />
              </button>
            </form>
          </section>

          {/* Resultado */}
          <section ref={resultadoRef} aria-label="Planta baixa e cenas" className="scroll-mt-20">
            {plano ? (
              <Resultado plano={plano} exemplo={exemplo} />
            ) : (
              <div className="dp-grid rounded-2xl border border-dashed border-dp-line p-6 sm:p-8">
                <p className="mb-5 font-mono text-[11px] tracking-[0.2em] text-white/45 uppercase">Etapas do plano</p>
                <ol className="space-y-3">
                  {etapas.map((etapa, i) => {
                    const ok = feitos.has(etapa.id)
                    return (
                      <li key={etapa.id} className="flex items-center gap-3">
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold transition-colors duration-200 ${
                            ok ? 'bg-dp-go-500 text-dp-night-950' : 'bg-dp-night-800 text-white/55'
                          }`}
                        >
                          {ok ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                        </span>
                        <span className={ok ? 'text-white' : 'text-white/60'}>{etapa.label}</span>
                      </li>
                    )
                  })}
                </ol>
                <p className="mt-6 text-sm text-white/45">
                  A planta baixa em estilo CAD e as 3 cenas com o drone voando aparecem aqui assim que o copiloto receber o desenho do local.
                </p>
              </div>
            )}
          </section>
        </div>
      </Container>
      <AnimatePresence>
        {desenho && (
          <motion.div
            key="desenho"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-dp-night-950/80 p-3 backdrop-blur-sm sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Desenhar mapa do local"
          >
            <motion.div
              initial={{ opacity: 0, transform: 'scale(0.96)' }}
              animate={{ opacity: 1, transform: 'scale(1)' }}
              exit={{ opacity: 0, transform: 'scale(0.96)' }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="w-full max-w-[920px]"
            >
              <SketchPad instrucoes={desenho.instrucoes} onSend={enviarDesenho} onClose={() => setDesenho(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
