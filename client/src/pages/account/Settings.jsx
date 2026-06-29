import { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import { toast } from '../../store/useToastStore'

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-forest' : 'bg-sand'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${checked ? 'right-1' : 'left-1'}`}
      />
    </button>
  )
}

const initial = [
  { id: 'orderUpdates', label: 'Order updates', desc: 'Shipping, delivery and refund alerts', on: true },
  { id: 'promotions', label: 'Promotions & offers', desc: 'Sales, new drops and coupons', on: true },
  { id: 'backInStock', label: 'Back in stock', desc: 'When wishlisted items return', on: false },
  { id: 'newsletter', label: 'Newsletter', desc: 'Maker tips and tutorials', on: true },
]

export default function Settings() {
  const [prefs, setPrefs] = useState(initial)
  const [theme, setTheme] = useState('Light')

  const toggle = (id) => setPrefs((p) => p.map((x) => (x.id === id ? { ...x, on: !x.on } : x)))

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-semibold text-ink">Settings</h2>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="mb-4 font-button text-sm font-semibold uppercase tracking-wider text-graphite/60">
          Notifications
        </h3>
        <div className="divide-y divide-ink/8">
          {prefs.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3.5">
              <div className="pr-4">
                <p className="text-sm font-medium text-ink">{p.label}</p>
                <p className="text-xs text-graphite/55">{p.desc}</p>
              </div>
              <Toggle checked={p.on} onChange={() => toggle(p.id)} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="mb-4 font-button text-sm font-semibold uppercase tracking-wider text-graphite/60">
          Preferences
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Appearance</p>
          <div className="flex rounded-full border border-ink/12 bg-cream p-1">
            {['Light', 'System'].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  theme === t ? 'bg-ink text-cream' : 'text-graphite/70'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="gold" onClick={() => toast.success('Settings saved')}>
            Save preferences
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-red-100 bg-red-50/40 p-6">
        <h3 className="font-button text-sm font-semibold uppercase tracking-wider text-red-500">Danger zone</h3>
        <p className="mt-2 text-sm text-graphite/70">
          Deleting your account is permanent and removes all your orders, addresses and saved items.
        </p>
        <button className="mt-4 rounded-full border border-red-300 px-5 py-2.5 font-button text-sm font-medium text-red-500 transition-colors hover:bg-red-500 hover:text-white">
          Delete account
        </button>
      </div>
    </div>
  )
}
