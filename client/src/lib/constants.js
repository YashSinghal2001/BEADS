/* Static UI taxonomy & marketing content (not server data). */

export const COLOR_OPTIONS = [
  { name: 'Blush', hex: '#F8D7DD' },
  { name: 'Cream', hex: '#F8F4EF' },
  { name: 'Sand', hex: '#EADBC8' },
  { name: 'Gold', hex: '#D4A373' },
  { name: 'Caramel', hex: '#B07F4F' },
  { name: 'Ink', hex: '#2C2C2C' },
  { name: 'Forest', hex: '#2D6A4F' },
  { name: 'Ivory', hex: '#FBF7F0' },
]

export const colorHex = (name) =>
  COLOR_OPTIONS.find((c) => c.name?.toLowerCase() === String(name).toLowerCase())?.hex || '#D4A373'

export const MATERIALS = ['Acrylic', 'Pearl', 'Glass', 'Resin', 'Alloy', 'Mixed']

export const SIZES = ['6mm', '8mm', '10mm', '12mm']

export const PRICE_BOUNDS = { min: 0, max: 2000 }

export const FREE_SHIPPING_THRESHOLD = 999

/* sort values map 1:1 to the backend product query `sort` enum */
export const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'new', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Best Selling' },
]

/* Map product flags → the single display badge the UI shows. */
export function badgeFromFlags(p = {}) {
  if (p.newArrival) return 'New'
  if (p.bestSeller) return 'Best Seller'
  if (p.trending) return 'Limited'
  if (p.featured) return 'Featured'
  return null
}

/* Default highlights / FAQs (presentation copy not stored per-product). */
export const defaultHighlights = [
  'Hand-inspected for colour & size consistency',
  'Premium, fade-resistant finish',
  'Nickel-free & skin-friendly materials',
  'Ships within 24 hours',
]

export const buildFaqs = (material = 'beads', isKit = false) => [
  {
    q: 'Are these suitable for bracelets and necklaces?',
    a: 'Yes — the hole size (1.2mm) fits standard elastic, tiger tail, and beading wire used for bracelets, necklaces and earrings.',
  },
  {
    q: 'Will the colour fade over time?',
    a: `No. We use a premium fade-resistant finish on our ${String(material).toLowerCase()} products. Keep pieces away from harsh chemicals and prolonged water exposure.`,
  },
  {
    q: 'How many pieces come in a pack?',
    a: isKit
      ? 'This is a complete kit with all components listed in the specifications.'
      : 'Each pack contains approximately 50 beads. Slight variation is normal for handmade batches.',
  },
  {
    q: 'Do you offer bulk pricing for small businesses?',
    a: 'Yes. Reach out via the Contact page for wholesale and bulk-order pricing.',
  },
]

export const testimonials = [
  { id: 't1', name: 'Aarohi Mehta', role: 'Instagram Seller · @aarohimakes', quote: 'The pearl quality is unreal for the price. My customers constantly ask where I source my beads — YS Creations is my secret.', rating: 5 },
  { id: 't2', name: 'Priya Nair', role: 'DIY Artist', quote: 'Beautiful packaging, fast shipping, and the colours are exactly as shown. The bow beads are my absolute favourite.', rating: 5 },
  { id: 't3', name: 'Sneha Kapoor', role: 'Etsy Shop Owner', quote: 'I run a small jewelry business and consistency matters. Every batch is perfect. This is luxury craft supply done right.', rating: 5 },
  { id: 't4', name: 'Riya Sharma', role: 'Fashion Blogger', quote: 'I styled a whole reel around the gold charm collection and it blew up. The finish photographs like fine jewelry.', rating: 5 },
  { id: 't5', name: 'Komal Gupta', role: 'Boutique Owner', quote: 'The DIY kits are a hit at my in-store workshops. Everything is organised, premium and ready to create with.', rating: 5 },
  { id: 't6', name: 'Aditi Jain', role: 'Hobbyist Maker', quote: 'As a beginner I was nervous, but the starter bundle had everything and the tutorials made my first bracelet effortless.', rating: 5 },
]
