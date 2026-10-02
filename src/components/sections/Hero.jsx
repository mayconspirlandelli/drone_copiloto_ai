import { motion, useReducedMotion } from 'motion/react'
import { ArrowDown, MessageSquare, ShieldAlert } from 'lucide-react'
import { Container } from '@/components/Container'
import { DroneTop } from '@/components/DroneGlyph'
import { hero } from '@/data/content'

const EASE_OUT = [0.23, 1, 0.32, 1]

const telemetry = [
  { k: 'ALT', v: '40 m' },
  { k: 'VEL', v: '2 m/s' },
  { k: 'GIMBAL', v: '−25°' },
  { k: 'MODO', v: 'ORBIT' },
]

function HudRadar() {
  const reduce = useReducedMotion()

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      <svg viewBox="-200 -200 400 400" className="absolute inset-0 size-full" aria-hidden="true">
        {[60, 110, 160].map((r) => (
          <circle key={r} r={r} fill="none" stroke="#5CC8FF" strokeOpacity="0.16" strokeDasharray="2 6" />
        ))}
        <line x1="-190" y1="0" x2="190" y2="0" stroke="#5CC8FF" strokeOpacity="0.12" />
        <line x1="0" y1="-190" x2="0" y2="190" stroke="#5CC8FF" strokeOpacity="0.12" />
        <circle r="60" fill="none" stroke="#5CC8FF" strokeWidth="1.5" className="dp-ping" />

        {/* Órbita de exemplo em torno do sujeito */}
        <circle r="110" fill="none" stroke="#FF8A1F" strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="6 6" />
        <rect x="-16" y="-12" width="32" height="24" rx="3" fill="#1E2C4A" stroke="#B8E6FF" strokeOpacity="0.5" />
        <text y="34" textAnchor="middle" className="fill-white/50 font-mono text-[10px] tracking-widest">
          SUJEITO
        </text>

        <motion.g
          initial={false}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
        >
          {/* círculo invisível centraliza a bounding box na origem para a rotação */}
          <circle r="130" fill="none" />
          <g transform="translate(0 -110)">
            {/* campo de visão apontando para o sujeito */}
            <path d="M0 0 L -26 62 A 66 66 0 0 0 26 62 Z" fill="#5CC8FF" fillOpacity="0.14" />
            <DroneTop scale={1.4} />
          </g>
        </motion.g>
      </svg>

      <div className="absolute top-2 left-0 rounded-md border border-dp-line bg-dp-night-900/80 px-3 py-2 font-mono text-[11px] text-dp-sky-200 backdrop-blur-sm">
        <span className="mr-1.5 inline-block size-2 rounded-full bg-dp-stop-500 align-middle" /> REC · 4K 24
      </div>

      <dl className="absolute right-0 bottom-0 grid grid-cols-2 gap-x-5 gap-y-1.5 rounded-md border border-dp-line bg-dp-night-900/80 px-4 py-3 font-mono text-[11px] backdrop-blur-sm">
        {telemetry.map(({ k, v }) => (
          <div key={k} className="flex items-baseline gap-2">
            <dt className="text-white/40">{k}</dt>
            <dd className="text-dp-sky-200">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function Hero() {
  return (
    <div className="dp-grid relative overflow-hidden">
      <Container className="grid min-h-[calc(100svh-4rem)] items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-10">
        <div>
          <motion.p
            initial={{ opacity: 0, transform: 'translateY(12px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="mb-5 font-mono text-xs tracking-[0.25em] text-dp-sky-400 uppercase"
          >
            {hero.eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, transform: 'translateY(16px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: 0.7, delay: 0.06, ease: EASE_OUT }}
            className="font-heading mb-6 text-5xl leading-[0.95] font-bold text-white sm:text-6xl lg:text-[76px]"
          >
            {hero.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, transform: 'translateY(16px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE_OUT }}
            className="mb-8 max-w-[560px] text-lg leading-relaxed text-white/70"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="/plano-de-voo"
              className="inline-flex items-center gap-2 rounded-full bg-dp-signal-500 px-6 py-3 text-sm font-bold text-dp-night-950 transition-[background-color,transform] duration-150 hover:bg-dp-signal-300 active:scale-[0.97]"
            >
              Criar plano com IA <MessageSquare className="size-4" />
            </a>
            <a
              href="#plano-de-voo"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-dp-sky-400 hover:text-dp-sky-400"
            >
              Ver exemplo <ArrowDown className="size-4" />
            </a>
          </motion.div>

          <p className="flex items-start gap-2 text-sm text-white/50">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-dp-warn-500" />
            {hero.disclaimer}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, transform: 'scale(0.96)' }}
          animate={{ opacity: 1, transform: 'scale(1)' }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT }}
        >
          <HudRadar />
        </motion.div>
      </Container>

      <div className="border-y border-dp-line/70 bg-dp-night-900/60">
        <Container className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 font-mono text-[11px] tracking-[0.15em] text-white/45 uppercase">
          <span className="text-dp-sky-400">Entende →</span>
          {hero.intents.map((intent) => (
            <span key={intent}>{intent}</span>
          ))}
        </Container>
      </div>
    </div>
  )
}
