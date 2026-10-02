import { Container } from '@/components/Container'
import { Logo } from '@/components/DroneGlyph'
import { hero, navLinks } from '@/data/content'

export function Footer() {
  return (
    <footer className="border-t border-dp-line bg-dp-night-950">
      <Container className="py-12 sm:py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-[420px]">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Copiloto virtual de planejamento, segurança operacional, fotografia e cinematografia aérea. {hero.disclaimer}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] tracking-[0.2em] text-white/35 uppercase">Navegação</span>
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-white/65 transition-colors hover:text-dp-sky-400">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <p className="mt-10 border-t border-dp-line pt-6 font-mono text-[11px] text-white/35">
          DroneCopiloto AI · v0.1.0 · Não alegamos consultar aplicativos, sensores, autorizações ou dados ao vivo.
        </p>
      </Container>
    </footer>
  )
}
