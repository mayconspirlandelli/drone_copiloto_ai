import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * Transição entre sections ligada ao scroll: a section vai aparecendo aos poucos
 * (opacidade, deslocamento e escala) conforme o usuário rola a página, e volta a
 * sumir se ele rolar para cima.
 *
 * `bg` recebe a mesma classe de fundo da section para que a "laje" atrás dela
 * fique sempre sólida — assim só o conteúdo aparece, sem piscar o fundo da página.
 */
export function SectionTransition({ children, bg, className, from = 'up' }) {
  const ref = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  // 0 quando o topo da section está a 95% da viewport (quase entrando)
  // 1 quando o topo chega a 45% da viewport (totalmente revelada)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.95', 'start 0.45'],
  })

  const progress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    mass: 0.35,
    restDelta: 0.001,
  })

  const opacity = useTransform(progress, [0, 0.6, 1], [0, 0.85, 1])
  const y = useTransform(progress, [0, 1], [from === 'up' ? 80 : 0, 0])
  const scale = useTransform(progress, [0, 1], [0.97, 1])

  if (prefersReducedMotion) {
    return <div className={cn(bg, className)}>{children}</div>
  }

  return (
    <div ref={ref} className={cn(bg, className)}>
      <motion.div style={{ opacity, y, scale, transformOrigin: 'center top', willChange: 'transform, opacity' }}>
        {children}
      </motion.div>
    </div>
  )
}
