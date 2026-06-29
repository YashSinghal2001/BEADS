import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import Button from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { toast } from '../../store/useToastStore'
import { useAuthStore } from '../../store/useAuthStore'

const LENGTH = 6

export default function VerifyOtp() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const email = state?.email || 'your email'
  const verifyOtp = useAuthStore((s) => s.verifyOtp)
  const [digits, setDigits] = useState(Array(LENGTH).fill(''))
  const [seconds, setSeconds] = useState(30)
  const [loading, setLoading] = useState(false)
  const inputs = useRef([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  const setAt = (i, val) => {
    setDigits((d) => {
      const next = [...d]
      next[i] = val
      return next
    })
  }

  const onChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '')
    if (!val) return setAt(i, '')
    setAt(i, val[val.length - 1])
    if (i < LENGTH - 1) inputs.current[i + 1]?.focus()
  }

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus()
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < LENGTH - 1) inputs.current[i + 1]?.focus()
  }

  const onPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    if (!text) return
    e.preventDefault()
    const next = Array(LENGTH).fill('')
    text.split('').forEach((c, idx) => (next[idx] = c))
    setDigits(next)
    inputs.current[Math.min(text.length, LENGTH - 1)]?.focus()
  }

  const code = digits.join('')
  const complete = code.length === LENGTH

  const verify = async (e) => {
    e.preventDefault()
    if (!complete) return
    setLoading(true)
    try {
      await verifyOtp({ email, otp: code })
      toast.success('Email verified successfully!')
      navigate('/account')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  const resend = () => {
    setSeconds(30)
    toast.info('A new code has been sent')
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email}.`}
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-gold-deep hover:underline">
          <Icon name="chevronLeft" size={16} /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={verify}>
        <div className="flex justify-between gap-2" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              value={d}
              onChange={(e) => onChange(i, e)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              className={`h-14 w-full rounded-xl border bg-white text-center font-display text-2xl font-semibold text-ink outline-none transition-colors ${
                d ? 'border-gold' : 'border-ink/12 focus:border-gold'
              }`}
            />
          ))}
        </div>

        <Button type="submit" variant="gold" size="lg" className="mt-6 w-full" disabled={!complete || loading}>
          {loading ? 'Verifying…' : 'Verify'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-graphite/70">
        Didn't receive the code?{' '}
        {seconds > 0 ? (
          <span className="text-graphite/45">Resend in {seconds}s</span>
        ) : (
          <button onClick={resend} className="font-semibold text-gold-deep hover:underline">
            Resend code
          </button>
        )}
      </p>
    </AuthLayout>
  )
}
