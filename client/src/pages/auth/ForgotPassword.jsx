import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import AuthLayout, { Field } from '../../components/auth/AuthLayout'
import Button from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from '../../store/useToastStore'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})

export default function ForgotPassword() {
  const navigate = useNavigate()
  const forgotPassword = useAuthStore((s) => s.forgotPassword)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched' })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await forgotPassword({ email: data.email })
      setSent(true)
    } catch {
      // backend always returns success to avoid leaking accounts; show sent anyway
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={sent ? 'Check your inbox' : 'Forgot password?'}
      subtitle={
        sent
          ? `We've sent a reset link and a 6-digit code to ${getValues('email')}.`
          : "No worries — enter your email and we'll send you a reset code."
      }
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-gold-deep hover:underline">
          <Icon name="chevronLeft" size={16} /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-forest/5 p-4 text-forest">
            <Icon name="checkCircle" size={22} />
            <p className="text-sm font-medium">Reset instructions sent successfully.</p>
          </div>
          <Button variant="gold" size="lg" className="w-full" onClick={() => navigate('/reset-password')}>
            Enter reset code
          </Button>
          <button onClick={() => setSent(false)} className="w-full text-center text-sm text-graphite/60 hover:text-ink">
            Didn't get it? Try again
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Email" icon="mail" type="email" placeholder="your@email.com" register={register('email')} error={errors.email?.message} />
          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset code'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
