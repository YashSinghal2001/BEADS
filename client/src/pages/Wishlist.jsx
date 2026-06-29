import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Container } from '../components/ui/Primitives'
import { Icon } from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { EmptyState } from '../components/ui/Controls'
import { Rating } from '../components/ui/Controls'
import { useWishlistStore } from '../store/useWishlistStore'
import { useCartStore } from '../store/useCartStore'
import { formatINR } from '../lib/format'

export default function Wishlist({ embedded = false }) {
  const items = useWishlistStore((s) => s.items)
  const remove = useWishlistStore((s) => s.remove)
  const clear = useWishlistStore((s) => s.clear)
  const fetchWishlist = useWishlistStore((s) => s.fetch)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  const moveToCart = async (product) => {
    try {
      await addItem(product, { qty: 1 })
      remove(product.id)
    } catch {
      /* store surfaces errors via toast */
    }
  }

  const Wrapper = embedded ? 'div' : 'div'

  const content =
    items.length === 0 ? (
      <EmptyState
        icon="heart"
        title="Your wishlist is empty"
        message="Tap the heart on any product to save it here for later."
        action={
          <Button to="/shop" variant="gold" size="lg">
            Explore products
          </Button>
        }
      />
    ) : (
      <>
        {!embedded && (
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="eyebrow mb-2">Saved items</p>
              <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
                Wishlist <span className="text-graphite/40">({items.length})</span>
              </h1>
            </div>
            <button onClick={clear} className="text-sm font-medium text-graphite/60 hover:text-red-500">
              Clear all
            </button>
          </div>
        )}

        <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
                className="group flex gap-4 rounded-3xl bg-white p-3 shadow-soft"
              >
                <Link to={`/product/${item.slug}`} className="relative block aspect-square w-28 shrink-0 overflow-hidden rounded-2xl bg-sand/40">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {!item.inStock && (
                    <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-[10px] font-medium uppercase tracking-wider text-cream">
                      Sold out
                    </span>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-1">
                    <Link to={`/product/${item.slug}`} className="min-w-0">
                      <h3 className="truncate font-body text-sm font-medium text-ink hover:text-gold-deep">{item.name}</h3>
                    </Link>
                    <button
                      aria-label="Remove from wishlist"
                      onClick={() => {
                        remove(item.id)
                        toast.info('Removed from wishlist')
                      }}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-graphite/40 hover:bg-ink/5 hover:text-red-500"
                    >
                      <Icon name="close" size={15} />
                    </button>
                  </div>

                  <Rating value={item.rating} size={12} className="mt-1" />

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-base font-semibold text-ink">{formatINR(item.price)}</span>
                    {item.compareAt && (
                      <span className="text-xs text-graphite/40 line-through">{formatINR(item.compareAt)}</span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-1.5 text-xs">
                    <span className={`h-1.5 w-1.5 rounded-full ${item.inStock ? 'bg-forest' : 'bg-red-400'}`} />
                    <span className={item.inStock ? 'text-forest' : 'text-red-500'}>
                      {item.inStock ? 'In stock' : 'Out of stock'}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={item.inStock ? 'primary' : 'outline'}
                    className="mt-auto w-full"
                    disabled={!item.inStock}
                    onClick={() => moveToCart(item)}
                  >
                    <Icon name="cart" size={15} />
                    {item.inStock ? 'Move to cart' : 'Notify me'}
                  </Button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </>
    )

  if (embedded) return <Wrapper>{content}</Wrapper>

  return (
    <div className="pb-20 pt-8">
      <Container>{content}</Container>
    </div>
  )
}
