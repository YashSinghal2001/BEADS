import { motion } from 'framer-motion'

/* ----------------------------- Container ----------------------------- */
export function Container({ className = '', children }) {
  return <div className={`container-lux ${className}`}>{children}</div>
}

/* ------------------------- Reveal on scroll -------------------------- */
const revealVariants = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      delay: i * 0.08,
    },
  }),
}

export function Reveal({ children, delay = 0, className = '', as = 'div' }) {
  const MotionTag = motion[as] || motion.div
  return (
    <MotionTag
      className={className}
      variants={revealVariants}
      custom={delay}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </MotionTag>
  )
}

/* Stagger container for lists */
export function StaggerGroup({ children, className = '', stagger = 0.08 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div className={className} variants={revealVariants}>
      {children}
    </motion.div>
  )
}

/* --------------------------- SectionHeading -------------------------- */
export function SectionHeading({ eyebrow, title, subtitle, align = 'center', className = '' }) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left'
  return (
    <div className={`${alignment} max-w-2xl ${className}`}>
      {eyebrow && (
        <Reveal>
          <p className="eyebrow mb-3">{eyebrow}</p>
        </Reveal>
      )}
      <Reveal delay={1}>
        <h2 className="text-3xl font-semibold leading-tight md:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={2}>
          <p className="mt-4 text-base leading-relaxed text-graphite/70">{subtitle}</p>
        </Reveal>
      )}
    </div>
  )
}

/* ------------------------------ Badge -------------------------------- */
export function Badge({ children, tone = 'gold', className = '' }) {
  const tones = {
    gold: 'bg-gold/15 text-gold-deep',
    dark: 'bg-ink text-cream',
    success: 'bg-forest/15 text-forest',
    sand: 'bg-sand text-graphite',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-button text-[11px] font-medium uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
