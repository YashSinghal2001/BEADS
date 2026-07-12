/*
 * Premium homepage demo content.
 *
 * These records are shaped EXACTLY like the API-normalised data the existing
 * UI already consumes (see api/mappers.js). They act as a graceful fallback
 * so the storefront looks fully populated when the backend is not running or
 * has not been seeded yet — WITHOUT overriding real API data when it exists.
 *
 * All imagery is sourced through the existing media helpers, so the look &
 * feel stays consistent with the rest of the premium design system.
 */
import {
  productImage,
  productGallery,
  categoryImage,
  categoryBanner,
  galleryImage,
  HERO_IMAGES,
  HERO_VIDEOS,
} from './media.js'

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/* ------------------------------- Products ---------------------------- */
/* mediaIndex cycles the curated Pexels bead/craft photo set in media.js. */
const P = [
  {
    name: 'Pastel Acrylic Beads Mix',
    price: 299,
    compareAt: 449,
    rating: 4.9,
    reviews: 412,
    material: 'Acrylic',
    category: 'acrylic-beads',
    categoryName: 'Acrylic Beads',
    badge: 'Best Seller',
    groups: ['best-sellers', 'trending'],
    colors: ['#F8D7DD', '#EADBC8', '#FBF7F0'],
    soldCount: 3120,
    mediaIndex: 2,
  },
  {
    name: 'Luxury Pearl Collection',
    price: 399,
    compareAt: 599,
    rating: 4.8,
    reviews: 356,
    material: 'Pearl',
    category: 'pearl-beads',
    categoryName: 'Pearl Beads',
    badge: 'Best Seller',
    groups: ['best-sellers', 'trending'],
    colors: ['#FBF7F0', '#EADBC8', '#D4A373'],
    soldCount: 2870,
    mediaIndex: 0,
  },
  {
    name: 'Korean Bow Beads Set',
    price: 249,
    compareAt: 349,
    rating: 4.9,
    reviews: 289,
    material: 'Acrylic',
    category: 'bow-beads',
    categoryName: 'Bow Beads',
    badge: 'New',
    groups: ['new', 'trending'],
    colors: ['#F8D7DD', '#FBF7F0', '#EADBC8'],
    soldCount: 1980,
    mediaIndex: 3,
  },
  {
    name: 'Crystal Glass Beads',
    price: 349,
    compareAt: 499,
    rating: 4.7,
    reviews: 244,
    material: 'Glass',
    category: 'glass-beads',
    categoryName: 'Glass Beads',
    badge: 'Best Seller',
    groups: ['best-sellers'],
    colors: ['#2D6A4F', '#FBF7F0', '#D4A373'],
    soldCount: 2210,
    mediaIndex: 19,
  },
  {
    name: 'Gold Charm Collection',
    price: 199,
    compareAt: 299,
    rating: 4.9,
    reviews: 521,
    material: 'Alloy',
    category: 'charms',
    categoryName: 'Charms & Pendants',
    badge: 'Best Seller',
    groups: ['best-sellers', 'trending'],
    colors: ['#D4A373', '#B07F4F', '#FBF7F0'],
    soldCount: 4050,
    mediaIndex: 16,
  },
  {
    name: 'Flower Beads Pack',
    price: 279,
    compareAt: 399,
    rating: 4.8,
    reviews: 198,
    material: 'Resin',
    category: 'flower-beads',
    categoryName: 'Flower Beads',
    badge: 'New',
    groups: ['new'],
    colors: ['#F8D7DD', '#EADBC8', '#2D6A4F'],
    soldCount: 1540,
    mediaIndex: 1,
  },
  {
    name: 'DIY Bracelet Kit',
    price: 599,
    compareAt: 799,
    rating: 5.0,
    reviews: 176,
    material: 'Mixed',
    category: 'diy-kits',
    categoryName: 'DIY Jewelry Kits',
    badge: 'Best Seller',
    groups: ['best-sellers', 'trending'],
    colors: ['#D4A373', '#F8D7DD', '#FBF7F0'],
    soldCount: 1330,
    mediaIndex: 8,
  },
  {
    name: 'Jewelry Starter Bundle',
    price: 899,
    compareAt: 1299,
    rating: 4.9,
    reviews: 143,
    material: 'Mixed',
    category: 'diy-kits',
    categoryName: 'DIY Jewelry Kits',
    badge: 'Limited',
    groups: ['limited', 'best-sellers'],
    colors: ['#EADBC8', '#D4A373', '#B07F4F'],
    soldCount: 980,
    mediaIndex: 7,
  },
  {
    name: 'Baroque Pearl Strand',
    price: 449,
    compareAt: 649,
    rating: 4.8,
    reviews: 132,
    material: 'Pearl',
    category: 'pearl-beads',
    categoryName: 'Pearl Beads',
    badge: 'New',
    groups: ['new', 'trending'],
    colors: ['#FBF7F0', '#EADBC8'],
    soldCount: 760,
    mediaIndex: 5,
  },
  {
    name: 'Millefiori Glass Mix',
    price: 379,
    compareAt: 549,
    rating: 4.7,
    reviews: 118,
    material: 'Glass',
    category: 'glass-beads',
    categoryName: 'Glass Beads',
    badge: 'Limited',
    groups: ['limited'],
    colors: ['#2D6A4F', '#D4A373', '#F8D7DD'],
    soldCount: 640,
    mediaIndex: 11,
  },
  {
    name: 'Celestial Charm Set',
    price: 229,
    compareAt: 329,
    rating: 4.9,
    reviews: 267,
    material: 'Alloy',
    category: 'charms',
    categoryName: 'Charms & Pendants',
    badge: 'New',
    groups: ['new', 'trending'],
    colors: ['#D4A373', '#B07F4F'],
    soldCount: 1420,
    mediaIndex: 17,
  },
  {
    name: 'Seed Bead Spacer Pack',
    price: 179,
    compareAt: 259,
    rating: 4.8,
    reviews: 203,
    material: 'Mixed',
    category: 'spacer-beads',
    categoryName: 'Spacer Beads',
    badge: 'Best Seller',
    groups: ['best-sellers'],
    colors: ['#D4A373', '#EADBC8', '#FBF7F0'],
    soldCount: 1890,
    mediaIndex: 10,
  },
]

const now = Date.now()

export const DEMO_PRODUCTS = P.map((p, i) => {
  const slug = slugify(p.name)
  const image = productImage(p.mediaIndex, 800, 1000)
  return {
    id: `demo-${slug}`,
    _id: `demo-${slug}`,
    name: p.name,
    title: p.name,
    slug,
    price: p.price,
    compareAt: p.compareAt,
    rating: p.rating,
    reviews: p.reviews,
    image,
    images: productGallery(p.mediaIndex, 800, 1000),
    material: p.material,
    colorNames: [],
    colors: p.colors,
    badge: p.badge,
    groups: p.groups,
    inStock: true,
    category: p.category,
    categoryName: p.categoryName,
    categorySlug: p.category,
    soldCount: p.soldCount,
    createdAt: new Date(now - i * 86400000).toISOString(),
  }
})

/* Featured = first 8 (matches the Featured Products brief). */
export const DEMO_FEATURED = DEMO_PRODUCTS.slice(0, 8)

/* Curated groups for the Best Sellers tabbed carousel. */
export const bestSellerTabs = () => [
  { key: 'best-sellers', label: 'Best Sellers' },
  { key: 'new', label: 'New Arrivals' },
  { key: 'trending', label: 'Trending' },
  { key: 'limited', label: 'Limited Edition' },
]

export const productsByGroup = (group, all = DEMO_PRODUCTS) =>
  all.filter((p) => p.groups?.includes(group))

/* ------------------------------ Categories --------------------------- */
/* Six luxury category cards for the "Shop by Category" section. */
const C = [
  { name: 'Acrylic Beads', slug: 'acrylic-beads', tagline: 'Lightweight & vibrant', count: 148, mediaIndex: 2 },
  { name: 'Pearl Beads', slug: 'pearl-beads', tagline: 'Timeless elegance', count: 132, mediaIndex: 0 },
  { name: 'Bow Beads', slug: 'bow-beads', tagline: 'Sweet & feminine', count: 96, mediaIndex: 3 },
  { name: 'Glass Beads', slug: 'glass-beads', tagline: 'Luminous & rich', count: 110, mediaIndex: 19 },
  { name: 'Charms & Pendants', slug: 'charms', tagline: 'Tiny statements', count: 124, mediaIndex: 16 },
  { name: 'DIY Jewelry Kits', slug: 'diy-kits', tagline: 'Everything to begin', count: 45, mediaIndex: 8 },
]

export const DEMO_CATEGORIES = C.map((c) => ({
  id: `demo-cat-${c.slug}`,
  name: c.name,
  slug: c.slug,
  tagline: c.tagline,
  count: c.count,
  image: categoryImage(c.mediaIndex, 800),
}))

/* ------------------------------ Trust stats -------------------------- */
export const TRUST_STATS = [
  { icon: 'heart', value: '12K+', label: 'Happy Makers' },
  { icon: 'package', value: '800+', label: 'Products' },
  { icon: 'star', value: '4.9★', label: 'Average Rating' },
  { icon: 'truck', value: '50K+', label: 'Orders Delivered' },
]

/* -------------------------- Collections ------------------------------ */
export const TRENDING_COLLECTIONS = [
  {
    title: 'Wedding Collection',
    blurb: 'Lustrous pearls & gold accents for the big day.',
    slug: 'wedding',
    to: '/category/pearl-beads',
    accent: '#FBF7F0',
    image: categoryBanner('pearl-beads', 0),
  },
  {
    title: 'Pastel Collection',
    blurb: 'Soft, dreamy tones curated for Korean-style pieces.',
    slug: 'pastel',
    to: '/category/bow-beads',
    accent: '#F8D7DD',
    image: categoryBanner('bow-beads', 3),
  },
  {
    title: 'DIY Kits',
    blurb: 'Everything you need to start making, beautifully boxed.',
    slug: 'diy-kits',
    to: '/category/diy-kits',
    accent: '#EADBC8',
    image: categoryBanner('diy-kits', 8),
  },
  {
    title: 'Best Sellers',
    blurb: 'The pieces our makers can’t stop reordering.',
    slug: 'best-sellers',
    to: '/shop?sort=popular',
    accent: '#D4A373',
    image: categoryBanner('charms', 16),
  },
]

/* ---------------------- Collections (/collections) -------------------- */
/* Six curated, themed edits — distinct from the raw product taxonomy on
 * /categories. `type: 'category'` collections pull from a single storefront
 * category; `type: 'badge'` collections pull products carrying that badge
 * (see badgeFromFlags in lib/constants.js). */
export const COLLECTIONS = [
  {
    slug: 'wedding',
    title: 'Wedding Collection',
    tagline: 'Lustrous & timeless',
    description:
      'Lustrous pearls and gold-tone accents for bridal jewelry, favours and the big day itself.',
    type: 'category',
    filter: 'pearl-beads',
    to: '/category/pearl-beads',
    accent: '#FBF7F0',
    image: categoryBanner('pearl-beads', 0),
  },
  {
    slug: 'pastel',
    title: 'Pastel Collection',
    tagline: 'Soft & dreamy',
    description:
      'Soft, dreamy tones and playful bow shapes curated for Korean-style, everyday-wear pieces.',
    type: 'category',
    filter: 'bow-beads',
    to: '/category/bow-beads',
    accent: '#F8D7DD',
    image: categoryBanner('bow-beads', 3),
  },
  {
    slug: 'diy-kits',
    title: 'DIY Kits',
    tagline: 'Everything to begin',
    description:
      'Complete, beautifully boxed kits with beads, findings, tools and a step-by-step guide.',
    type: 'category',
    filter: 'diy-kits',
    to: '/category/diy-kits',
    accent: '#EADBC8',
    image: categoryBanner('diy-kits', 8),
  },
  {
    slug: 'best-sellers',
    title: 'Best Sellers',
    tagline: 'Maker favourites',
    description: 'The pieces our community can’t stop reordering — proven, five-star favourites.',
    type: 'badge',
    filter: 'Best Seller',
    to: '/shop?sort=popular',
    accent: '#D4A373',
    image: categoryBanner('charms', 16),
  },
  {
    slug: 'new-arrivals',
    title: 'New Arrivals',
    tagline: 'Fresh this season',
    description: 'The latest drops from our studio — new colours, shapes and finishes every month.',
    type: 'badge',
    filter: 'New',
    to: '/shop?sort=new',
    accent: '#2D6A4F',
    image: categoryBanner('new-arrivals', 5),
  },
  {
    slug: 'limited-edition',
    title: 'Limited Edition',
    tagline: 'While supplies last',
    description: 'Small-batch colourways and finishes — once they sell out, they’re gone for good.',
    type: 'badge',
    filter: 'Limited',
    to: '/shop',
    accent: '#B07F4F',
    image: categoryBanner('limited-edition', 11),
  },
]

/* ------------------------------ DIY bundle --------------------------- */
export const DIY_BUNDLE = {
  eyebrow: 'Build & Save',
  title: 'Create Your Own Bracelet Kit',
  description:
    'Everything you need to start making in one beautifully packaged box — mix, match and make it yours.',
  price: 999,
  compareAt: 1499,
  cta: 'Build Your Kit',
  image: HERO_IMAGES.workshop,
  includes: [
    ['sparkle', '200 premium beads'],
    ['tag', 'Gold charms'],
    ['refresh', 'Elastic strings'],
    ['sliders', 'Jewelry tools'],
    ['gift', 'Gift packaging'],
  ],
}

/* ------------------------------ Video cards -------------------------- */
/* Poster images use the media helpers; the craft/workshop clips play in a
 * modal. Cards without a dedicated clip reuse the workshop clip so the play
 * experience always works. */
export const VIDEO_CARDS = [
  {
    title: 'Beads Pouring',
    caption: 'Pastel acrylics, slow-motion',
    poster: galleryImage(2, 800, 1000),
    src: HERO_VIDEOS.craft.src,
  },
  {
    title: 'Bracelet Making',
    caption: 'Handmade, close-up',
    poster: galleryImage(7, 800, 1000),
    src: HERO_VIDEOS.workshop.src,
  },
  {
    title: 'Jewelry Sparkle',
    caption: 'Pearls in golden light',
    poster: galleryImage(0, 800, 1000),
    src: HERO_VIDEOS.craft.src,
  },
  {
    title: 'Unboxing',
    caption: 'The YS Creations kit',
    poster: galleryImage(8, 800, 1000),
    src: HERO_VIDEOS.workshop.src,
  },
  {
    title: 'Workspace',
    caption: 'Behind the craft table',
    poster: galleryImage(6, 800, 1000),
    src: HERO_VIDEOS.workshop.src,
  },
]

/* --------------------------- Instagram gallery ----------------------- */
/* 12 aesthetic square tiles for the Pinterest-style community grid. */
export const INSTAGRAM_TILES = Array.from({ length: 12 }, (_, i) => galleryImage(i, 400, 400))

/* ------------------------------ Hero badges -------------------------- */
export const HERO_BADGES = [
  { icon: 'star', text: '4.9/5 Average Rating', pos: 'top-left' },
  { icon: 'truck', text: 'Free Shipping over ₹999', pos: 'top-right' },
  { icon: 'sparkle', text: 'Premium Quality', pos: 'bottom-left' },
  { icon: 'heart', text: 'Handmade With Love', pos: 'bottom-right' },
]

export const HERO_IMAGE = productImage(0, 900, 1100)
