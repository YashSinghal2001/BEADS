import Hero from '../components/sections/Hero'
import { Categories, PromiseStrip } from '../components/sections/Categories'
import FeaturedProducts from '../components/sections/FeaturedProducts'
import {
  BrandStory,
  InstagramFeed,
  Newsletter,
  Testimonials,
} from '../components/sections/Story'

export default function Home() {
  return (
    <>
      <Hero />
      <PromiseStrip />
      <Categories />
      <FeaturedProducts />
      <BrandStory />
      <Testimonials />
      <InstagramFeed />
      <Newsletter />
    </>
  )
}
