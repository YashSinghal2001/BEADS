import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Container } from '../components/ui/Primitives'
import { Icon } from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Rating, QuantityStepper, EmptyState } from '../components/ui/Controls'
import { Skeleton, LineSkeleton } from '../components/ui/Skeleton'
import ProductGallery from '../components/product/ProductGallery'
import { ProductTabs, Reviews } from '../components/product/ProductInfo'
import ProductCarousel from '../components/product/ProductCarousel'
import { formatINR } from '../lib/format'
import { colorHex } from '../lib/constants'
import { useProductStore } from '../store/useProductStore'
import { useCartStore } from '../store/useCartStore'
import { useWishlistStore } from '../store/useWishlistStore'
import { useRecentlyViewedStore } from '../store/useRecentlyViewedStore'
import { toast } from '../store/useToastStore'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const fetchProduct = useProductStore((s) => s.fetchProduct)
  const fetchRelated = useProductStore((s) => s.fetchRelated)
  const addItem = useCartStore((s) => s.addItem)
  const toggleWish = useWishlistStore((s) => s.toggle)
  const addRecent = useRecentlyViewedStore((s) => s.add)
  const recent = useRecentlyViewedStore((s) => s.items)

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [size, setSize] = useState(null)
  const [color, setColor] = useState(null)
  const [qty, setQty] = useState(1)

  const wished = useWishlistStore((s) => (product ? s.items.some((it) => it.id === product.id) : false))

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    window.scrollTo({ top: 0 })
    fetchProduct(slug)
      .then((p) => {
        if (!active) return
        setProduct(p)
        setSize(p.variants.size[0] || null)
        setColor(p.variants.color[0] || null)
        setQty(1)
        addRecent(p)
        return fetchRelated(slug)
      })
      .then((r) => active && r && setRelated(r))
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [slug, fetchProduct, fetchRelated, addRecent])

  if (loading) return <ProductDetailSkeleton />

  if (notFound || !product) {
    return (
      <Container>
        <EmptyState
          icon="empty"
          title="Product not found"
          message="This product may have been moved or is no longer available."
          action={<Button to="/shop" variant="gold">Back to shop</Button>}
        />
      </Container>
    )
  }

  const variant = { size, color }
  const discount = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0

  const handleAdd = async () => {
    if (!product.inStock) return
    try {
      await addItem(product, { variant, qty })
    } catch {
      /* toast handled in store */
    }
  }
  const handleBuyNow = async () => {
    if (!product.inStock) return
    try {
      await addItem(product, { variant, qty })
      navigate('/cart')
    } catch {
      /* not signed in → store toasts + we stay */
    }
  }
  const handleWish = async () => {
    try {
      await toggleWish(product)
    } catch {
      /* toast handled in store */
    }
  }

  const recentlyViewed = recent.filter((it) => it.id !== product.id)

  return (
    <div className="pb-20 pt-6">
      <Container>
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-graphite/60">
          <Link to="/" className="hover:text-ink">Home</Link>
          <Icon name="chevronRight" size={14} />
          <Link to="/shop" className="hover:text-ink">Shop</Link>
          {product.categorySlug && (
            <>
              <Icon name="chevronRight" size={14} />
              <Link to={`/category/${product.categorySlug}`} className="hover:text-ink">
                {product.categoryName}
              </Link>
            </>
          )}
          <Icon name="chevronRight" size={14} />
          <span className="truncate text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images} video={product.video} name={product.name} badge={product.badge} />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-xs uppercase tracking-[0.2em] text-gold-deep">
              {product.categoryName || 'Beads'} · {product.material}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink md:text-4xl">{product.name}</h1>

            <div className="mt-3 flex items-center gap-3">
              <Rating value={product.rating} size={17} />
              <span className="text-sm text-graphite/60">{product.rating} · {product.reviews} reviews</span>
            </div>

            <div className="mt-5 flex items-end gap-3">
              <span className="font-display text-3xl font-semibold text-ink">{formatINR(product.price)}</span>
              {product.compareAt && (
                <span className="pb-1 text-lg text-graphite/40 line-through">{formatINR(product.compareAt)}</span>
              )}
              {discount > 0 && (
                <span className="mb-1.5 rounded-full bg-forest/15 px-2.5 py-1 text-xs font-semibold text-forest">Save {discount}%</span>
              )}
            </div>
            <p className="mt-1 text-xs text-graphite/50">Inclusive of all taxes</p>

            <div className="mt-5 flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${product.inStock ? 'bg-forest' : 'bg-red-400'}`} />
              <span className={product.inStock ? 'text-forest' : 'text-red-500'}>
                {product.inStock ? 'In stock — ready to ship' : 'Currently out of stock'}
              </span>
            </div>

            {/* Colour */}
            {product.variants.color.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 font-button text-sm font-semibold text-ink">
                  Colour: <span className="font-normal text-graphite/70">{color}</span>
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.color.map((cName) => {
                    const active = color === cName
                    return (
                      <button
                        key={cName}
                        onClick={() => setColor(cName)}
                        title={cName}
                        aria-label={cName}
                        className={`grid h-10 w-10 place-items-center rounded-full border-2 transition-all ${
                          active ? 'border-gold scale-105' : 'border-transparent hover:border-ink/15'
                        }`}
                      >
                        <span className="h-7 w-7 rounded-full border border-ink/10 shadow-inner" style={{ backgroundColor: colorHex(cName) }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Size */}
            {product.variants.size.length > 1 && (
              <div className="mt-6">
                <p className="mb-2 font-button text-sm font-semibold text-ink">
                  Bead size: <span className="font-normal text-graphite/70">{size}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.size.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-14 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                        size === s ? 'border-gold bg-gold/10 text-gold-deep' : 'border-ink/15 text-graphite hover:border-ink/30'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-7 flex items-center gap-4">
              <QuantityStepper value={qty} onChange={setQty} />
              <span className="text-sm text-graphite/50">{formatINR(product.price * qty)} total</span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" size="lg" className="flex-1" onClick={handleAdd} disabled={!product.inStock}>
                <Icon name="cart" size={18} />
                Add to cart
              </Button>
              <Button variant="gold" size="lg" className="flex-1" onClick={handleBuyNow} disabled={!product.inStock}>
                Buy now
              </Button>
              <button
                onClick={handleWish}
                aria-label="Add to wishlist"
                className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border transition-colors ${
                  wished ? 'border-red-200 bg-red-50 text-red-500' : 'border-ink/15 text-ink hover:border-gold/50'
                }`}
              >
                <Icon name="heart" size={20} className={wished ? '[&_path]:fill-red-500' : ''} />
              </button>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3 rounded-2xl bg-white/60 p-4 backdrop-blur">
              {[
                ['truck', 'Free shipping', 'Over ₹999'],
                ['refresh', '7-day returns', 'Easy & free'],
                ['shield', 'Secure', 'Safe checkout'],
              ].map(([icon, t, d]) => (
                <div key={t} className="text-center">
                  <Icon name={icon} size={20} className="mx-auto text-gold-deep" />
                  <p className="mt-1.5 text-xs font-semibold text-ink">{t}</p>
                  <p className="text-[11px] text-graphite/55">{d}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mt-14 space-y-8">
          <ProductTabs product={product} />
          <Reviews product={product} />
        </div>

        <div className="mt-16">
          <ProductCarousel eyebrow="You may also like" title="Related products" products={related} idBase="related" />
        </div>

        {recentlyViewed.length > 0 && (
          <div className="mt-16">
            <ProductCarousel eyebrow="Pick up where you left off" title="Recently viewed" products={recentlyViewed} idBase="recent" />
          </div>
        )}
      </Container>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="pb-20 pt-6">
      <Container>
        <Skeleton className="mb-6 h-4 w-64" />
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-40" />
            <div className="pt-4"><LineSkeleton lines={3} /></div>
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </Container>
    </div>
  )
}
