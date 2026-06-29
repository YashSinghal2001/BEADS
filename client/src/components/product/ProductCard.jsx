import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '../ui/Icon'
import { Badge } from '../ui/Primitives'
import { Rating } from '../ui/Controls'
import { formatINR } from '../../lib/format'
import { useCartStore } from '../../store/useCartStore'
import { useWishlistStore } from '../../store/useWishlistStore'

function useCardActions(product) {
  const addItem = useCartStore((s) => s.addItem)
  const wished = useWishlistStore((s) => s.items.some((it) => it.id === product.id))
  const toggleWish = useWishlistStore((s) => s.toggle)

  const add = async (e) => {
    e?.preventDefault()
    if (!product.inStock) return
    try {
      await addItem(product, { qty: 1 })
    } catch {
      /* store surfaces auth/network errors via toast */
    }
  }
  const wish = async (e) => {
    e?.preventDefault()
    try {
      await toggleWish(product)
    } catch {
      /* store surfaces errors via toast */
    }
  }
  return { add, wish, wished }
}

export default function ProductCard({ product, view = 'grid', index = 0 }) {
  if (view === 'list') return <ProductRow product={product} index={index} />
  return <ProductTile product={product} />
}

function ProductTile({ product }) {
  const { name, slug, price, compareAt, rating, reviews, image, badge, colors, inStock } = product
  const { add, wish, wished } = useCardActions(product)
  const discount = compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0

  return (
    <motion.article
      whileHover="hover"
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-soft transition-shadow duration-500 ease-lux hover:shadow-card"
    >
      <Link to={`/product/${slug}`} className="relative block overflow-hidden">
        <div className="relative aspect-[4/5] overflow-hidden bg-sand/40">
          <motion.img
            src={image}
            alt={name}
            loading="lazy"
            variants={{ hover: { scale: 1.06 } }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full object-cover"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {badge && <Badge tone={badge === 'New' ? 'success' : 'gold'}>{badge}</Badge>}
            {discount > 0 && <Badge tone="dark">-{discount}%</Badge>}
            {!inStock && <Badge tone="sand">Sold out</Badge>}
          </div>

          <WishButton wished={wished} onClick={wish} />

          <motion.div
            variants={{ hover: { y: 0, opacity: 1 } }}
            initial={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-3 bottom-3"
          >
            <button
              disabled={!inStock}
              onClick={add}
              className="w-full rounded-full bg-ink/90 py-2.5 font-button text-xs font-medium uppercase tracking-wider text-cream backdrop-blur transition-colors hover:bg-ink disabled:bg-graphite/50"
            >
              {inStock ? 'Quick Add' : 'Out of Stock'}
            </button>
          </motion.div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5">
          <Rating value={rating} size={13} />
          <span className="text-xs text-graphite/50">({reviews})</span>
        </div>
        <Link to={`/product/${slug}`} className="mt-1.5">
          <h3 className="font-body text-[15px] font-medium leading-snug text-ink transition-colors duration-300 group-hover:text-gold-deep">
            {name}
          </h3>
        </Link>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold text-ink">{formatINR(price)}</span>
            {compareAt && (
              <span className="text-sm text-graphite/40 line-through">{formatINR(compareAt)}</span>
            )}
          </div>
          <div className="flex -space-x-1">
            {colors?.slice(0, 3).map((c, i) => (
              <span
                key={i}
                className="h-4 w-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function ProductRow({ product }) {
  const { name, slug, price, compareAt, rating, reviews, image, badge, material, inStock } = product
  const { add, wish, wished } = useCardActions(product)
  const discount = compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0

  return (
    <motion.article className="group flex gap-4 overflow-hidden rounded-3xl bg-white p-3 shadow-soft transition-shadow duration-500 hover:shadow-card sm:gap-5">
      <Link
        to={`/product/${slug}`}
        className="relative block aspect-square w-28 shrink-0 overflow-hidden rounded-2xl bg-sand/40 sm:w-40"
      >
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {badge && (
          <div className="absolute left-2 top-2">
            <Badge tone={badge === 'New' ? 'success' : 'gold'}>{badge}</Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col py-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-graphite/45">{material}</p>
            <Link to={`/product/${slug}`}>
              <h3 className="mt-0.5 font-display text-lg font-semibold text-ink group-hover:text-gold-deep">
                {name}
              </h3>
            </Link>
          </div>
          <WishButton wished={wished} onClick={wish} inline />
        </div>

        <div className="mt-1.5 flex items-center gap-1.5">
          <Rating value={rating} size={14} />
          <span className="text-xs text-graphite/50">{rating} ({reviews})</span>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-ink">{formatINR(price)}</span>
            {compareAt && (
              <span className="text-sm text-graphite/40 line-through">{formatINR(compareAt)}</span>
            )}
            {discount > 0 && <Badge tone="dark">-{discount}%</Badge>}
          </div>
          <button
            disabled={!inStock}
            onClick={add}
            className="rounded-full bg-ink px-5 py-2.5 font-button text-xs font-medium uppercase tracking-wider text-cream transition-colors hover:bg-graphite disabled:bg-graphite/40"
          >
            {inStock ? 'Add to cart' : 'Sold out'}
          </button>
        </div>
      </div>
    </motion.article>
  )
}

function WishButton({ wished, onClick, inline = false }) {
  return (
    <motion.button
      aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={onClick}
      whileTap={{ scale: 0.8 }}
      variants={inline ? undefined : { hover: { opacity: 1, y: 0 } }}
      initial={inline ? undefined : { opacity: 0, y: -8 }}
      className={`grid h-9 w-9 place-items-center rounded-full shadow-soft backdrop-blur transition-colors ${
        inline ? 'bg-sand/60' : 'absolute right-3 top-3 bg-white/90'
      } ${wished ? 'text-red-500' : 'text-ink hover:text-gold-deep'}`}
    >
      <motion.span
        key={wished ? 'on' : 'off'}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      >
        <Icon name="heart" size={17} className={wished ? '[&_path]:fill-red-500' : ''} />
      </motion.span>
    </motion.button>
  )
}
