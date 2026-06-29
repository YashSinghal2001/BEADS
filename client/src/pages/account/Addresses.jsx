import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Primitives'
import Button from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Field } from '../../components/auth/AuthLayout'
import { EmptyState } from '../../components/ui/Controls'
import { useProfileStore } from '../../store/useProfileStore'

const schema = z.object({
  fullName: z.string().min(2, 'Enter a name'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone'),
  addressLine1: z.string().min(3, 'Enter address'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'Enter city'),
  state: z.string().min(2, 'Enter state'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Enter a valid pincode'),
})

export default function Addresses() {
  const addresses = useProfileStore((s) => s.addresses)
  const fetchAddresses = useProfileStore((s) => s.fetchAddresses)
  const addAddress = useProfileStore((s) => s.addAddress)
  const updateAddress = useProfileStore((s) => s.updateAddress)
  const deleteAddress = useProfileStore((s) => s.deleteAddress)
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched' })

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const makeDefault = (a) => updateAddress(a._id, { ...a, isDefault: true })

  const onSubmit = async (data) => {
    try {
      await addAddress(data)
      reset()
      setOpen(false)
    } catch {
      /* toast in store */
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-ink">Addresses</h2>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
          <Icon name="plus" size={16} /> Add new
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState icon="mapPin" title="No saved addresses" message="Add an address for faster checkout." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {addresses.map((a) => (
              <motion.div
                key={a._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="rounded-3xl bg-white p-5 shadow-soft"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-button text-sm font-semibold text-ink">
                    <Icon name="mapPin" size={16} className="text-gold-deep" /> {a.city}
                  </span>
                  {a.isDefault && <Badge tone="success">Default</Badge>}
                </div>
                <p className="text-sm font-medium text-ink">{a.fullName}</p>
                <p className="mt-1 text-sm leading-relaxed text-graphite/70">
                  {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}
                  <br />
                  {a.city}, {a.state} — {a.pincode}
                  <br />
                  {a.phone}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 border-t border-ink/8 pt-3 text-sm">
                  {!a.isDefault && (
                    <button className="font-medium text-graphite/70 hover:text-ink" onClick={() => makeDefault(a)}>
                      Set as default
                    </button>
                  )}
                  <button className="ml-auto font-medium text-graphite/60 hover:text-red-500" onClick={() => deleteAddress(a._id)}>
                    Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add address">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Field label="Full name" placeholder="Aarohi Mehta" register={register('fullName')} error={errors.fullName?.message} />
          <Field label="Address line 1" placeholder="Flat / House no, Street" register={register('addressLine1')} error={errors.addressLine1?.message} />
          <Field label="Address line 2" placeholder="Area, Landmark" register={register('addressLine2')} error={errors.addressLine2?.message} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" placeholder="Mumbai" register={register('city')} error={errors.city?.message} />
            <Field label="State" placeholder="Maharashtra" register={register('state')} error={errors.state?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pincode" placeholder="400050" register={register('pincode')} error={errors.pincode?.message} />
            <Field label="Phone" type="tel" placeholder="9876543210" register={register('phone')} error={errors.phone?.message} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={isSubmitting}>Save address</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
