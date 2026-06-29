import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AuthLayout, { PasswordField } from '../../components/auth/AuthLayout'
import Button from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { toast } from '../../store/useToastStore'
import { useAuthStore } from '../../store/useAuthStore'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

function strength(pw = '') {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), mode: 'onChange' })

  const pw = watch('password') || ''
  const score = strength(pw)
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-gold', 'bg-forest']

  const onSubmit = async (data) => {
    const email = params.get('email')
    const token = params.get('token')
    if (!email || !token) {
      toast.error('This reset link is invalid or incomplete')
      return
    }
    setLoading(true)
    try {
      await resetPassword({ email, token, password: data.password, confirm: data.confirm })
      toast.success('Password reset! You can now sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset link is invalid or expired')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-gold-deep hover:underline">
          <Icon name="chevronLeft" size={16} /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <PasswordField label="New password" register={register('password')} error={errors.password?.message} />
          {pw && (
            <div className="mt-2">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? colors[score] : 'bg-sand'}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-graphite/60">{labels[score]}</p>
            </div>
          )}
        </div>

        <PasswordField label="Confirm new password" register={register('confirm')} error={errors.confirm?.message} />

        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Reset password'}
        </Button>
      </form>
    </AuthLayout>
  )
}
