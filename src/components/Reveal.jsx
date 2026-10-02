import { motion } from 'motion/react'

export function Reveal({ children, delay = 0, from = 'up', className }) {
  const initial = {
    up: { opacity: 0, y: 28 },
    down: { opacity: 0, y: -28 },
    left: { opacity: 0, x: -32 },
    right: { opacity: 0, x: 32 },
    fade: { opacity: 0 },
  }[from]

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
