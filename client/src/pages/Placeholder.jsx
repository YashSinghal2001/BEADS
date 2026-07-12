import { motion } from 'framer-motion'
import { Container } from '../components/ui/Primitives'
import Button from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import Seo from '../components/Seo'

export default function Placeholder({ title, note, eyebrow = 'Page not found' }) {
  return (
    <section className="section">
      <Seo title={title} noindex />
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-xl rounded-[2rem] bg-white/70 p-10 text-center shadow-soft backdrop-blur md:p-16"
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold/10 text-gold-deep">
            <Icon name="sparkle" size={26} />
          </span>
          <p className="eyebrow mt-6">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-graphite/70">
            {note ||
              "The page you're looking for doesn't exist. Let's get you back on track."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button to="/" variant="primary">
              Back home
            </Button>
            <Button to="/shop" variant="outline">
              Browse shop
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
