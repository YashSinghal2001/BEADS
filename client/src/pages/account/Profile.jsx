import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Field } from '../../components/auth/AuthLayout'
import Button from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { useAuthStore } from '../../store/useAuthStore'
import { useProfileStore } from '../../store/useProfileStore'

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit number').or(z.literal('')),
})

export default function Profile() {
  const user = useAuthStore((s) => s.user) || {}
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name || '', phone: user.phone || '' },
    mode: 'onTouched',
  })

  const onSubmit = async (data) => {
    try {
      await updateProfile(data)
    } catch {
      /* toast handled in store */
    }
  }

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-semibold text-ink">Profile</h2>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex items-center gap-5">
          <div className="relative">
            {user.avatar?.url ? (
              <img src={user.avatar.url} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-full bg-sand font-display text-2xl font-semibold text-gold-deep">
                {(user.name || 'Y').charAt(0)}
              </span>
            )}
            <button className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-ink text-cream shadow-soft hover:bg-graphite">
              <Icon name="edit" size={15} />
            </button>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-ink">{user.name}</p>
            <p className="text-sm text-graphite/60">Member since {joined}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="mb-5 font-button text-sm font-semibold uppercase tracking-wider text-graphite/60">
          Personal details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" icon="user" register={register('name')} error={errors.name?.message} />
          <Field label="Email" icon="mail" type="email" value={user.email || ''} disabled readOnly />
          <Field label="Phone" icon="phone" type="tel" register={register('phone')} error={errors.phone?.message} />
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="gold" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
