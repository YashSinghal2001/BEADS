import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '../ui/Icon'

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-var(--header-h))] lg:grid-cols-2">
      {/* Visual side */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="https://picsum.photos/seed/ysc-auth/1000/1400"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-ink/80 via-ink/40 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-cream">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-white">
              <span className="font-display text-lg font-semibold">Y</span>
            </span>
            <span className="font-display text-xl font-semibold">YS Creations</span>
          </Link>
          <div>
            <Icon name="quote" size={40} className="text-gold" />
            <p className="mt-4 max-w-md font-display text-2xl leading-snug">
              "The quality and consistency is unmatched — YS Creations is the secret behind my best-selling pieces."
            </p>
            <p className="mt-4 text-sm text-cream/70">Aarohi M. · Instagram Seller</p>
          </div>
          <div className="flex gap-6 text-sm text-cream/70">
            <span className="flex items-center gap-2"><Icon name="shield" size={16} className="text-gold" /> Secure</span>
            <span className="flex items-center gap-2"><Icon name="truck" size={16} className="text-gold" /> Fast shipping</span>
            <span className="flex items-center gap-2"><Icon name="star" size={16} className="text-gold" /> 4.9 rated</span>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-white">
              <span className="font-display text-lg font-semibold">Y</span>
            </span>
            <span className="font-display text-xl font-semibold text-ink">YS Creations</span>
          </Link>

          <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-graphite/70">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-graphite/70">{footer}</div>}
        </motion.div>
      </div>
    </div>
  )
}

/* ----------------------------- Fields -------------------------------- */
export function Field({ label, icon, error, register, type = 'text', placeholder, ...rest }) {
  return (
    <div>
      {label && <label className="mb-1.5 block font-button text-sm font-medium text-ink">{label}</label>}
      <div className="relative">
        {icon && (
          <Icon name={icon} size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-graphite/45" />
        )}
        <input
          type={type}
          placeholder={placeholder}
          {...register}
          {...rest}
          className={`w-full rounded-xl border bg-white py-3 ${icon ? 'pl-11' : 'pl-4'} pr-4 text-sm outline-none transition-colors ${
            error ? 'border-red-300 focus:border-red-400' : 'border-ink/12 focus:border-gold'
          }`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function PasswordField({ label, error, register, placeholder = '••••••••', ...rest }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      {label && <label className="mb-1.5 block font-button text-sm font-medium text-ink">{label}</label>}
      <div className="relative">
        <Icon name="lock" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-graphite/45" />
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          {...register}
          {...rest}
          className={`w-full rounded-xl border bg-white py-3 pl-11 pr-11 text-sm outline-none transition-colors ${
            error ? 'border-red-300 focus:border-red-400' : 'border-ink/12 focus:border-gold'
          }`}
        />
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-graphite/50 hover:text-ink"
        >
          <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function GoogleButton({ children = 'Continue with Google' }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white py-3 font-button text-sm font-medium text-ink transition-colors hover:bg-cream"
    >
      <Icon name="google" size={18} />
      {children}
    </button>
  )
}

export function Divider({ label = 'or' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-ink/10" />
      <span className="text-xs uppercase tracking-wider text-graphite/40">{label}</span>
      <span className="h-px flex-1 bg-ink/10" />
    </div>
  )
}
