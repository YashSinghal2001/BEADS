import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 font-button font-medium tracking-wide rounded-full transition-all duration-300 ease-lux focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-50 disabled:pointer-events-none'

const variants = {
  primary:
    'bg-ink text-cream shadow-soft hover:bg-graphite hover:shadow-card',
  gold: 'bg-gold text-white shadow-soft hover:bg-gold-deep hover:shadow-glow',
  outline:
    'border border-ink/20 text-ink bg-white/40 backdrop-blur hover:border-gold hover:text-gold-deep',
  ghost: 'text-ink hover:bg-ink/5',
  light: 'bg-white text-ink shadow-soft hover:shadow-card',
}

const sizes = {
  sm: 'text-xs px-4 py-2',
  md: 'text-sm px-6 py-3',
  lg: 'text-base px-8 py-4',
}

const Button = forwardRef(function Button(
  { as, to, href, variant = 'primary', size = 'md', className = '', children, ...props },
  ref,
) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`

  const motionProps = {
    whileHover: { scale: 1.03 },
    whileTap: { scale: 0.97 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  }

  if (to) {
    return (
      <motion.div {...motionProps} className="inline-flex">
        <Link ref={ref} to={to} className={classes} {...props}>
          {children}
        </Link>
      </motion.div>
    )
  }

  if (href) {
    return (
      <motion.a ref={ref} href={href} className={classes} {...motionProps} {...props}>
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button ref={ref} className={classes} {...motionProps} {...props}>
      {children}
    </motion.button>
  )
})

export default Button
