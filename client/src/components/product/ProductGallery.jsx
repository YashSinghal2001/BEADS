import { useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Thumbs, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'
import { motion } from 'framer-motion'
import { Icon } from '../ui/Icon'
import { Lightbox } from '../ui/Modal'

export default function ProductGallery({ images = [], video, name, badge }) {
  const [thumbs, setThumbs] = useState(null)
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [lbIndex, setLbIndex] = useState(0)
  const [zoom, setZoom] = useState(null) // {x,y} %
  const mainRef = useRef(null)

  const slides = video ? [{ type: 'video', src: video }, ...images.map((src) => ({ type: 'image', src }))] : images.map((src) => ({ type: 'image', src }))

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoom({ x, y })
  }

  const openLightbox = (i) => {
    setLbIndex(i)
    setLightbox(true)
  }

  return (
    <div className="lg:sticky lg:top-24">
      <Swiper
        modules={[Thumbs, Navigation]}
        thumbs={{ swiper: thumbs && !thumbs.destroyed ? thumbs : null }}
        navigation={{ prevEl: '.gal-prev', nextEl: '.gal-next' }}
        onSlideChange={(s) => setActive(s.activeIndex)}
        className="relative overflow-hidden rounded-3xl bg-white shadow-soft"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            {slide.type === 'video' ? (
              <div className="relative aspect-square bg-ink">
                <video
                  src={slide.src}
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                  poster={images[0]}
                />
              </div>
            ) : (
              <div
                className="group relative aspect-square cursor-zoom-in overflow-hidden bg-sand/40"
                onMouseMove={onMove}
                onMouseLeave={() => setZoom(null)}
                onClick={() => openLightbox(video ? i - 1 : i)}
                ref={i === 0 ? mainRef : null}
              >
                <img
                  src={slide.src}
                  alt={`${name} view ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-200"
                  style={
                    zoom && i === active
                      ? { transform: 'scale(1.9)', transformOrigin: `${zoom.x}% ${zoom.y}%` }
                      : undefined
                  }
                />
                <button
                  aria-label="View fullscreen"
                  onClick={(e) => {
                    e.stopPropagation()
                    openLightbox(video ? i - 1 : i)
                  }}
                  className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-ink opacity-0 shadow-soft backdrop-blur transition-opacity group-hover:opacity-100"
                >
                  <Icon name="expand" size={18} />
                </button>
              </div>
            )}
          </SwiperSlide>
        ))}

        {badge && (
          <div className="absolute left-4 top-4 z-10 rounded-full bg-gold px-3 py-1 font-button text-[11px] font-medium uppercase tracking-wider text-white">
            {badge}
          </div>
        )}

        {/* nav arrows */}
        <button className="gal-prev absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-soft backdrop-blur transition hover:bg-white">
          <Icon name="chevronLeft" size={20} />
        </button>
        <button className="gal-next absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-soft backdrop-blur transition hover:bg-white">
          <Icon name="chevronRight" size={20} />
        </button>
      </Swiper>

      {/* Thumbnails */}
      <Swiper
        modules={[Thumbs]}
        onSwiper={setThumbs}
        slidesPerView={video ? 5 : 4}
        spaceBetween={10}
        watchSlidesProgress
        className="mt-3"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i} className="!h-auto">
            <button
              className={`relative aspect-square w-full overflow-hidden rounded-xl border-2 transition-colors ${
                active === i ? 'border-gold' : 'border-transparent hover:border-ink/15'
              }`}
            >
              <img
                src={slide.type === 'video' ? images[0] : slide.src}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
              />
              {slide.type === 'video' && (
                <span className="absolute inset-0 grid place-items-center bg-ink/40 text-white">
                  <Icon name="play" size={20} className="[&_path]:fill-white" />
                </span>
              )}
            </button>
          </SwiperSlide>
        ))}
      </Swiper>

      <Lightbox
        open={lightbox}
        images={images}
        index={lbIndex}
        onClose={() => setLightbox(false)}
        onIndex={setLbIndex}
      />
    </div>
  )
}
