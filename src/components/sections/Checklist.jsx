import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Check, ExternalLink, RotateCcw } from 'lucide-react'
import { Container } from '@/components/Container'
import { postFlightItems, preFlightStages, verdicts } from '@/data/content'

const STORAGE_KEY = 'dronepilot-checklist-v1'
const EASE_OUT = [0.23, 1, 0.32, 1]

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return { checked: new Set(parsed.checked ?? []), indoor: Boolean(parsed.indoor) }
  } catch {
    return null
  }
}

function saveState(checked, indoor) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ checked: [...checked], indoor }))
  } catch {
    // armazenamento indisponível (aba anônima, bloqueado) — o checklist segue funcionando
  }
}

const verdictStyles = {
  go: { ring: '#3DDC84', chip: 'bg-dp-go-500 text-dp-night-950' },
  restricted: { ring: '#FFC233', chip: 'bg-dp-warn-500 text-dp-night-950' },
  stop: { ring: '#FF4D5E', chip: 'bg-dp-stop-500 text-white' },
}

function CheckItem({ item, checked, onToggle }) {
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className="group flex w-full cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-dp-ink/5"
      >
        <span
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-[background-color,border-color] duration-150 ${
            checked ? 'border-dp-ink bg-dp-ink' : 'border-dp-ink/30 bg-white'
          }`}
        >
          <AnimatePresence initial={false}>
            {checked && (
              <motion.span
                initial={{ opacity: 0, transform: 'scale(0.6)' }}
                animate={{ opacity: 1, transform: 'scale(1)' }}
                exit={{ opacity: 0, transform: 'scale(0.6)' }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
              >
                <Check className="size-3.5 text-white" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className={`flex-1 text-[15px] leading-snug transition-colors duration-150 ${checked ? 'text-dp-ink/45 line-through decoration-dp-ink/25' : 'text-dp-ink'}`}>
          {item.label}
        </span>
        {item.critical && (
          <span className="mt-0.5 shrink-0 rounded-full bg-dp-stop-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-dp-stop-500 uppercase">
            Crítico
          </span>
        )}
      </button>
    </li>
  )
}

function ProgressRing({ value, color }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 120 120" className="size-32 -rotate-90" aria-hidden="true">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="9" />
      <motion.circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={false}
        animate={{ strokeDashoffset: c * (1 - value), stroke: color }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
      />
    </svg>
  )
}

export function Checklist() {
  const [tab, setTab] = useState('pre')
  const [checked, setChecked] = useState(() => loadState()?.checked ?? new Set())
  const [indoor, setIndoor] = useState(() => loadState()?.indoor ?? false)

  useEffect(() => saveState(checked, indoor), [checked, indoor])

  const stages = useMemo(() => preFlightStages.filter((s) => !s.optional || indoor), [indoor])
  const items = tab === 'pre' ? stages.flatMap((s) => s.items) : postFlightItems
  const done = items.filter((i) => checked.has(i.id)).length
  const progress = items.length ? done / items.length : 0
  const criticalPending = items.filter((i) => i.critical && !checked.has(i.id))

  const verdictKey = criticalPending.length ? 'stop' : done < items.length ? 'restricted' : 'go'
  const verdict = verdicts[verdictKey]
  const style = verdictStyles[verdictKey]

  function toggle(id) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function reset() {
    setChecked((prev) => {
      const next = new Set(prev)
      items.forEach((i) => next.delete(i.id))
      return next
    })
  }

  return (
    <section id="checklist" className="bg-dp-paper">
      <Container className="py-16 sm:py-24">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 font-mono text-xs tracking-[0.25em] text-dp-ink/50 uppercase">Checklist interativo</p>
            <h2 className="font-heading text-4xl font-bold text-dp-ink sm:text-5xl">Antes de tirar do chão.</h2>
            <p className="mt-3 max-w-[560px] text-dp-ink/65">
              Marque cada item por etapa. Pendências críticas resultam em <strong>NÃO DECOLAR</strong>. Seu progresso fica salvo neste navegador.
            </p>
          </div>

          <div role="tablist" aria-label="Tipo de checklist" className="inline-flex self-start rounded-full bg-dp-ink/8 p-1 md:self-auto">
            {[
              ['pre', 'Pré-voo'],
              ['pos', 'Pós-voo'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className="relative cursor-pointer rounded-full px-5 py-2 text-sm font-semibold"
              >
                {tab === key && (
                  <motion.span
                    layoutId="checklist-tab"
                    className="absolute inset-0 rounded-full bg-dp-ink"
                    transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                  />
                )}
                <span className={`relative transition-colors duration-150 ${tab === key ? 'text-white' : 'text-dp-ink/70'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Painel de status */}
          <aside className="self-start rounded-2xl bg-dp-ink p-6 text-white lg:sticky lg:top-24">
            <div className="flex items-center gap-5">
              <div className="relative">
                <ProgressRing value={progress} color={style.ring} />
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-3xl font-bold tabular-nums">{Math.round(progress * 100)}%</span>
                  <span className="font-mono text-[10px] text-white/45">
                    {done}/{items.length}
                  </span>
                </span>
              </div>
              <div className="min-w-0">
                <p className="mb-2 font-mono text-[10px] tracking-[0.2em] text-white/45 uppercase">Resultado</p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={verdictKey}
                    initial={{ opacity: 0, transform: 'translateY(4px)' }}
                    animate={{ opacity: 1, transform: 'translateY(0px)' }}
                    exit={{ opacity: 0, transform: 'translateY(-4px)' }}
                    transition={{ duration: 0.18, ease: EASE_OUT }}
                    className={`inline-block rounded-md px-2.5 py-1.5 font-heading text-[17px] leading-tight font-bold tracking-wide ${style.chip}`}
                  >
                    {tab === 'pos' && verdictKey === 'go' ? 'PÓS-VOO CONCLUÍDO' : tab === 'pos' ? 'PÓS-VOO PENDENTE' : verdict.label}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {tab === 'pre' && <p className="mt-5 text-sm text-white/65">{verdict.description}</p>}

            {tab === 'pre' && criticalPending.length > 0 && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-dp-stop-500">
                  <AlertTriangle className="size-3.5" /> {criticalPending.length} pendência{criticalPending.length > 1 ? 's' : ''} crítica
                  {criticalPending.length > 1 ? 's' : ''}
                </p>
                <ul className="space-y-1 text-[13px] text-white/60">
                  {criticalPending.slice(0, 4).map((i) => (
                    <li key={i.id}>· {i.label}</li>
                  ))}
                  {criticalPending.length > 4 && <li className="text-white/40">+ {criticalPending.length - 4} outras</li>}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5">
              {tab === 'pre' && (
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                  <span>Voo em ambiente fechado</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={indoor}
                    onClick={() => setIndoor(!indoor)}
                    className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200 ${indoor ? 'bg-dp-signal-500' : 'bg-white/20'}`}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform duration-200"
                      style={{ transform: indoor ? 'translateX(20px)' : 'translateX(0px)', transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
                    />
                  </button>
                </label>
              )}
              <button
                type="button"
                onClick={reset}
                className="inline-flex cursor-pointer items-center gap-2 self-start text-sm text-white/55 transition-colors hover:text-white"
              >
                <RotateCcw className="size-3.5" /> Limpar marcações
              </button>
            </div>
          </aside>

          {/* Etapas */}
          {tab === 'pre' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence initial={false}>
                {stages.map((stage) => {
                  const stageDone = stage.items.filter((i) => checked.has(i.id)).length
                  const complete = stageDone === stage.items.length
                  return (
                    <motion.article
                      key={stage.id}
                      layout
                      initial={{ opacity: 0, transform: 'scale(0.97)' }}
                      animate={{ opacity: 1, transform: 'scale(1)' }}
                      exit={{ opacity: 0, transform: 'scale(0.97)' }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className="rounded-2xl border border-dp-ink/10 bg-white p-5"
                    >
                      <header className="mb-3 flex items-center gap-3">
                        <span
                          className={`flex size-9 items-center justify-center rounded-lg font-heading text-lg font-bold transition-colors duration-200 ${
                            complete ? 'bg-dp-go-500 text-dp-night-950' : 'bg-dp-ink text-white'
                          }`}
                        >
                          {complete ? <Check className="size-5" strokeWidth={3} /> : stage.letter}
                        </span>
                        <h3 className="font-heading flex-1 text-2xl font-bold text-dp-ink">{stage.title}</h3>
                        <span className="font-mono text-xs text-dp-ink/45">
                          {stageDone}/{stage.items.length}
                        </span>
                      </header>
                      <ul className="-mx-2">
                        {stage.items.map((item) => (
                          <CheckItem key={item.id} item={item} checked={checked.has(item.id)} onToggle={() => toggle(item.id)} />
                        ))}
                      </ul>
                      {(stage.note || stage.link) && (
                        <footer className="mt-3 border-t border-dp-ink/8 pt-3 text-[13px] leading-relaxed text-dp-ink/55">
                          {stage.note}
                          {stage.link && (
                            <a
                              href={stage.link.href}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 flex items-center gap-1.5 font-semibold text-dp-ink underline decoration-dp-signal-500 decoration-2 underline-offset-4"
                            >
                              {stage.link.label} <ExternalLink className="size-3.5" />
                            </a>
                          )}
                        </footer>
                      )}
                    </motion.article>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <article className="self-start rounded-2xl border border-dp-ink/10 bg-white p-5">
              <header className="mb-3 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-dp-ink font-heading text-lg font-bold text-white">P</span>
                <h3 className="font-heading flex-1 text-2xl font-bold text-dp-ink">Pós-voo</h3>
                <span className="font-mono text-xs text-dp-ink/45">
                  {done}/{items.length}
                </span>
              </header>
              <ul className="-mx-2 grid md:grid-cols-2">
                {postFlightItems.map((item) => (
                  <CheckItem key={item.id} item={item} checked={checked.has(item.id)} onToggle={() => toggle(item.id)} />
                ))}
              </ul>
            </article>
          )}
        </div>
      </Container>
    </section>
  )
}
