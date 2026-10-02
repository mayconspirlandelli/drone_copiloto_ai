import { Ban, ExternalLink, ScanSearch } from 'lucide-react'
import { Container } from '@/components/Container'
import { Reveal } from '@/components/Reveal'
import { analiseImagem, fontesOficiais, nuncaRecomendar, tiposDeOrientacao } from '@/data/content'

const toneStyles = {
  sky: 'bg-dp-sky-400 text-dp-night-950',
  stop: 'bg-dp-stop-500 text-white',
  warn: 'bg-dp-warn-500 text-dp-night-950',
  go: 'bg-dp-go-500 text-dp-night-950',
}

export function Seguranca() {
  return (
    <section id="seguranca" className="bg-dp-night-900">
      <Container className="py-16 sm:py-24">
        <p className="mb-3 font-mono text-xs tracking-[0.25em] text-dp-sky-400 uppercase">Segurança operacional</p>
        <h2 className="font-heading mb-3 text-4xl font-bold text-white sm:text-5xl">Segurança prevalece sobre a captura.</h2>
        <p className="mb-10 max-w-[620px] text-white/60">
          Quando houver risco relevante, o copiloto propõe uma alternativa de captura mais segura — e deixa claro de onde vem cada orientação.
        </p>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div className="h-full rounded-2xl border border-dp-stop-500/30 bg-dp-stop-500/5 p-6">
              <h3 className="font-heading mb-4 text-2xl font-bold text-white">Nunca recomendamos</h3>
              <ul className="space-y-3">
                {nuncaRecomendar.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/80">
                    <Ban className="mt-0.5 size-4 shrink-0 text-dp-stop-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="h-full rounded-2xl border border-dp-line bg-dp-night-950 p-6">
              <h3 className="font-heading mb-4 text-2xl font-bold text-white">Cada orientação tem uma origem</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {tiposDeOrientacao.map(({ tag, tone, text }) => (
                  <div key={tag} className="rounded-xl bg-dp-night-800 p-4">
                    <span className={`mb-2 inline-block rounded px-2 py-0.5 font-mono text-[10.5px] font-semibold tracking-wider uppercase ${toneStyles[tone]}`}>
                      {tag}
                    </span>
                    <p className="text-sm leading-relaxed text-white/65">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Reveal delay={0.04}>
            <div className="h-full rounded-2xl border border-dp-line bg-dp-night-950 p-6">
              <h3 className="font-heading mb-4 flex items-center gap-2 text-2xl font-bold text-white">
                <ScanSearch className="size-5 text-dp-sky-400" /> Análise de imagem do local
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {analiseImagem.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-white/70">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-dp-sky-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="h-full rounded-2xl border border-dp-line bg-dp-night-950 p-6">
              <h3 className="font-heading mb-1 text-2xl font-bold text-white">Fontes oficiais</h3>
              <p className="mb-4 text-sm text-white/50">Para normas atuais, consulte sempre a fonte — o copiloto informa data e incertezas.</p>
              <ul className="divide-y divide-dp-line">
                {fontesOficiais.map(({ label, description, href }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-4 py-3">
                      <span>
                        <span className="block font-semibold text-white transition-colors group-hover:text-dp-sky-400">{label}</span>
                        <span className="block text-xs text-white/45">{description}</span>
                      </span>
                      <ExternalLink className="size-4 shrink-0 text-white/40 transition-colors group-hover:text-dp-sky-400" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
