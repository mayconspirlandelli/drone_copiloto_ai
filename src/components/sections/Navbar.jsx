import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Container } from '@/components/Container'
import { Logo } from '@/components/DroneGlyph'
import { navLinks } from '@/data/content'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Container className="flex items-center justify-between gap-6 py-4">
      <a href="#top" aria-label="DroneCopiloto AI — início">
        <Logo />
      </a>

      <nav className="hidden items-center gap-7 md:flex">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-[15px] font-medium text-white/75 transition-colors hover:text-dp-sky-400"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <a
        href="#checklist"
        className="hidden whitespace-nowrap rounded-full bg-dp-signal-500 px-5 py-2.5 text-sm font-bold text-dp-night-950 transition-[background-color,transform] duration-150 hover:bg-dp-signal-300 active:scale-[0.97] md:inline-block"
      >
        Iniciar checklist
      </a>

      <button
        type="button"
        className="flex cursor-pointer items-center text-white md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {mobileOpen && (
        <div className="absolute top-full right-0 left-0 z-50 border-t border-white/10 bg-dp-night-950/98 backdrop-blur-sm md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-[17px] font-medium text-white transition-colors hover:bg-white/10 hover:text-dp-sky-400"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#checklist"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-full bg-dp-signal-500 px-6 py-3 text-center text-sm font-bold text-dp-night-950"
            >
              Iniciar checklist
            </a>
          </Container>
        </div>
      )}
    </Container>
  )
}
