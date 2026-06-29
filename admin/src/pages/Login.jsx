import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button, Field, Icon } from '../components/ui.jsx'
import { useAuth } from '../store/auth.js'
import { toast } from '../lib.js'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuth((s) => s.login)
  const loading = useAuth((s) => s.loading)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(form)
      toast.success('Welcome back')
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl bg-panel p-8 shadow-card"
      >
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold text-white font-display text-xl font-semibold">Y</span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Admin Console</h1>
          <p className="text-sm text-graphite/60">Sign in to manage YS Creations</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@yscreations.com" />
          <Field label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-500">
              <Icon name="alert" size={15} /> {error}
            </p>
          )}
          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-5 text-center text-xs text-graphite/45">Authorised personnel only · activity is logged</p>
      </motion.div>
    </div>
  )
}
