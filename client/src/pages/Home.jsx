import Seo from '../components/Seo'
import Hero from '../components/sections/Hero'
import { Categories, PromiseStrip } from '../components/sections/Categories'
import FeaturedProducts from '../components/sections/FeaturedProducts'
import {
  BestSellers,
  DIYBundle,
  TrendingCollections,
  TrustStats,
  VideoShowcase,
} from '../components/sections/HomeSections'
import {
  BrandStory,
  InstagramFeed,
  Newsletter,
  Testimonials,
} from '../components/sections/Story'

export default function Home() {
  return (
    <>
      <Seo path="/" />
      {/* 1 — Hero */}
      <Hero />
      <PromiseStrip />
      {/* 2 — Trust stats */}
      <TrustStats />
      {/* 3 — Shop by category */}
      <Categories />
      {/* 4 — Featured products */}
      <FeaturedProducts />
      {/* 5 — Trending collections */}
      <TrendingCollections />
      {/* 6 — Best sellers */}
      <BestSellers />
      {/* 7 — DIY bundle */}
      <DIYBundle />
      {/* 8 — Our story */}
      <BrandStory />
      {/* 9 — Testimonials */}
      <Testimonials />
      {/* 10 — Instagram gallery */}
      <InstagramFeed />
      {/* 11 — Video showcase */}
      <VideoShowcase />
      {/* 12 — Newsletter */}
      <Newsletter />
    </>
  )
}
