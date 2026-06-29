/*
 * Dummy media system — realistic stock photography & video placeholders.
 *
 * Sources (free, commercial-use stock libraries — NOT AI generated):
 *   • Pexels   → https://images.pexels.com  /  https://videos.pexels.com
 *   • Unsplash → https://images.unsplash.com
 *   • Pixabay  → https://cdn.pixabay.com
 *
 * All helpers return ready-to-use, sized URLs so components stay clean.
 * Pexels image IDs below are verified, on-theme (beads / jewelry / craft)
 * photographs and serve as the primary, most reliable source.
 */

/* --------------------------- Pexels helpers -------------------------- */
const pexels = (id, w = 800, h = 1000) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`

const unsplash = (id, w = 1200, h = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`

const pixabay = (path) => `https://cdn.pixabay.com/photo/${path}`

/* ---------------------- Curated bead / craft photos ------------------ */
/* Verified Pexels photo IDs (beads, charms, jewelry-making, kits). */
export const BEAD_PHOTOS = [
  14820550, 1590159, 36931458, 18609428, 9671928, 18609429, 10601643,
  7585704, 7585692, 30139741, 10403920, 20618740, 32794029, 27705056,
  18609437, 1331705, 20618742, 32568146, 11944293, 1331700, 37123292,
  7585691, 11591685, 32405949,
]

/* Photos that read well as "making / workshop / lifestyle" scenes. */
export const CRAFT_PHOTOS = [7585704, 7585692, 7585691, 18609437, 27705056, 10601643, 32405949]

/* Photos that read well as finished jewelry / necklaces. */
export const JEWELRY_PHOTOS = [14820550, 30139741, 20618742, 32568146, 11591685, 20618740]

/* ----------------------------- Generators ---------------------------- */
/** A product image, cycled deterministically from the curated set. */
export const productImage = (i = 0, w = 800, h = 1000) =>
  pexels(BEAD_PHOTOS[((i % BEAD_PHOTOS.length) + BEAD_PHOTOS.length) % BEAD_PHOTOS.length], w, h)

/** Four-image gallery for a product. */
export const productGallery = (i = 0, w = 800, h = 1000) =>
  [i, i + 5, i + 11, i + 17].map((n) => productImage(n, w, h))

/** A square category card / banner image. */
export const categoryImage = (i = 0, size = 800) => pexels(BEAD_PHOTOS[i % BEAD_PHOTOS.length], size, size)

/** A wide gallery image (about page, lookbook). */
export const galleryImage = (i = 0, w = 800, h = 800) => pexels(BEAD_PHOTOS[i % BEAD_PHOTOS.length], w, h)

/* ----------------------- Per-category banner art --------------------- */
/* Maps the 8 storefront categories → an on-theme hero/banner photo. */
export const CATEGORY_MEDIA = {
  'acrylic-beads': pexels(36931458, 1200, 800),
  'bow-beads': pexels(18609428, 1200, 800),
  'flower-beads': pexels(1590159, 1200, 800),
  'pearl-beads': pexels(14820550, 1200, 800),
  'glass-beads': pexels(1331700, 1200, 800),
  'spacer-beads': pexels(10403920, 1200, 800),
  charms: pexels(20618742, 1200, 800),
  'diy-kits': pexels(7585692, 1200, 800),
}

export const categoryBanner = (slug, i = 0) =>
  CATEGORY_MEDIA[slug] || pexels(BEAD_PHOTOS[i % BEAD_PHOTOS.length], 1200, 800)

/* ------------------------------- Heroes ------------------------------ */
export const HERO_IMAGES = {
  categories: pexels(1331705, 1600, 900),
  about: pexels(7585704, 1600, 1000),
  contact: pexels(18609437, 1600, 900),
  story: pexels(7585691, 1000, 800),
  workshop: pexels(7585692, 1000, 800),
}

/* About-page editorial gallery. */
export const ABOUT_GALLERY = [
  pexels(7585704, 700, 800),
  pexels(1331705, 700, 800),
  pexels(36931458, 700, 800),
  pexels(10601643, 700, 800),
  pexels(20618742, 700, 800),
  pexels(11591685, 700, 800),
]

/* --------------------------------- Video ----------------------------- */
/*
 * Hero / ambient background videos (muted, looping). Each entry pairs an
 * MP4 with a poster image so the section never appears empty if the video
 * is blocked or slow. Sourced from Pexels Video, Coverr & Pixabay Video.
 */
export const HERO_VIDEOS = {
  craft: {
    src: 'https://videos.pexels.com/video-files/7585448/7585448-uhd_2560_1440_25fps.mp4',
    poster: pexels(7585704, 1600, 900),
  },
  workshop: {
    src: 'https://cdn.coverr.co/videos/coverr-making-handmade-jewelry-1568/1080p.mp4',
    poster: pexels(7585692, 1600, 900),
  },
}

/* ------------------------------ Avatars ------------------------------ */
/* Initial-based avatar fallback (used where we don't have a real photo). */
export const avatarFor = (name = 'YS') =>
  (name || 'YS')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export default {
  BEAD_PHOTOS,
  productImage,
  productGallery,
  categoryImage,
  galleryImage,
  categoryBanner,
  CATEGORY_MEDIA,
  HERO_IMAGES,
  ABOUT_GALLERY,
  HERO_VIDEOS,
  avatarFor,
}
