import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { Icon } from '../ui/Icon'
import ProductCard from './ProductCard'

export default function ProductCarousel({ title, eyebrow, products = [], idBase = 'pc' }) {
  if (!products.length) return null
  return (
    <section>
      <div className="mb-6 flex items-end justify-between">
        <div>
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h2 className="font-display text-2xl font-semibold text-ink md:text-3xl">{title}</h2>
        </div>
        <div className="flex gap-2">
          <button
            className={`${idBase}-prev grid h-10 w-10 place-items-center rounded-full border border-ink/12 bg-white text-ink transition hover:border-gold/50`}
            aria-label="Previous"
          >
            <Icon name="chevronLeft" size={18} />
          </button>
          <button
            className={`${idBase}-next grid h-10 w-10 place-items-center rounded-full border border-ink/12 bg-white text-ink transition hover:border-gold/50`}
            aria-label="Next"
          >
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </div>

      <Swiper
        modules={[Navigation]}
        navigation={{ prevEl: `.${idBase}-prev`, nextEl: `.${idBase}-next` }}
        slidesPerView={1.4}
        spaceBetween={16}
        breakpoints={{
          480: { slidesPerView: 2.2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
        }}
        className="!overflow-visible"
      >
        {products.map((p) => (
          <SwiperSlide key={p.id} className="!h-auto">
            <ProductCard product={p} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
