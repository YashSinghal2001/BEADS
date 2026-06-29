import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AuthLayout, { Field, PasswordField, GoogleButton, Divider } from '../../components/auth/AuthLayout'
import Button from '../../components/ui/Button'
import { toast } from '../../store/useToastStore'
import { useAuthStore } from '../../store/useAuthStore'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched' })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await login(data)
      toast.success('Welcome back!')
      navigate(location.state?.from || '/account')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your account."
      footer={
        <>
          New to YS Creations?{' '}
          <Link to="/register" className="font-semibold text-gold-deep hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field
          label="Email"
          icon="mail"
          type="email"
          placeholder="your@email.com"
          register={register('email')}
          error={errors.email?.message}
        />
        <PasswordField label="Password" register={register('password')} error={errors.password?.message} />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-graphite/70">
            <input type="checkbox" className="accent-gold" /> Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-gold-deep hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="my-5">
        <Divider />
      </div>
      <GoogleButton />
    </AuthLayout>
  )
}
