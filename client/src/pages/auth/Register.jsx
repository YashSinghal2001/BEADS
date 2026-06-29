import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AuthLayout, { Field, PasswordField, GoogleButton, Divider } from '../../components/auth/AuthLayout'
import Button from '../../components/ui/Button'
import { toast } from '../../store/useToastStore'
import { useAuthStore } from '../../store/useAuthStore'

const schema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    phone: z
      .string()
      .min(10, 'Enter a valid 10-digit number')
      .regex(/^[0-9]{10}$/, 'Enter a valid 10-digit number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: 'Please accept the terms' }) }),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

export default function Register() {
  const navigate = useNavigate()
  const registerUser = useAuthStore((s) => s.register)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched' })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      })
      toast.success('Account created! Verify your email to continue.')
      navigate('/verify-otp', { state: { email: data.email } })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join 12,000+ makers and get 10% off your first order."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-gold-deep hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full name" icon="user" placeholder="Aarohi Mehta" register={register('name')} error={errors.name?.message} />
        <Field label="Email" icon="mail" type="email" placeholder="your@email.com" register={register('email')} error={errors.email?.message} />
        <Field label="Phone" icon="phone" type="tel" placeholder="9876543210" register={register('phone')} error={errors.phone?.message} />
        <PasswordField label="Password" register={register('password')} error={errors.password?.message} />
        <PasswordField label="Confirm password" register={register('confirm')} error={errors.confirm?.message} />

        <label className="flex items-start gap-2 text-sm text-graphite/70">
          <input type="checkbox" className="mt-0.5 accent-gold" {...register('terms')} />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="text-gold-deep hover:underline">Terms</Link> &{' '}
            <Link to="/privacy" className="text-gold-deep hover:underline">Privacy Policy</Link>
          </span>
        </label>
        {errors.terms && <p className="-mt-2 text-xs text-red-500">{errors.terms.message}</p>}

        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <div className="my-5">
        <Divider />
      </div>
      <GoogleButton children="Sign up with Google" />
    </AuthLayout>
  )
}
