/* Seed dataset for YS Creations — mirrors the frontend catalog. */

const img = (seed, w = 800, h = 1000) => ({
  url: `https://picsum.photos/seed/ysc-${seed}/${w}/${h}`,
  publicId: '',
  alt: '',
})

export const categories = [
  { name: 'Acrylic Beads', description: 'Lightweight & vibrant acrylic beads.', featured: true, order: 1, image: img('acrylic', 700, 700) },
  { name: 'Bow Beads', description: 'Sweet feminine bow beads.', featured: true, order: 2, image: img('bow', 700, 700) },
  { name: 'Pearl Beads', description: 'Timeless elegant pearls.', featured: true, order: 3, image: img('pearl', 700, 700) },
  { name: 'Glass Beads', description: 'Luminous & rich glass beads.', featured: true, order: 4, image: img('glass', 700, 700) },
  { name: 'Flower Beads', description: 'Blooming floral beads.', featured: false, order: 5, image: img('flower', 700, 700) },
  { name: 'Spacer Beads', description: 'The finishing touch.', featured: false, order: 6, image: img('spacer', 700, 700) },
  { name: 'Charms', description: 'Tiny statement charms.', featured: true, order: 7, image: img('charms', 700, 700) },
  { name: 'Jewelry Kits', description: 'Everything you need to begin.', featured: false, order: 8, image: img('kits', 700, 700) },
]

// [title, categoryName, mrp, salePrice, rating, reviews, material, flags, stock]
const rows = [
  ['Iridescent Acrylic Mix — Blush', 'Acrylic Beads', 499, 349, 4.9, 214, 'Acrylic', { bestSeller: true }, 120],
  ['Freshwater Pearl Strand — Ivory', 'Pearl Beads', 899, 899, 5.0, 98, 'Pearl', { newArrival: true, featured: true }, 60],
  ['Satin Bow Beads — Caramel', 'Bow Beads', 320, 279, 4.8, 156, 'Acrylic', {}, 90],
  ['Murano-Style Glass Beads — Amber', 'Glass Beads', 799, 649, 4.9, 73, 'Glass', { trending: true }, 40],
  ['Daisy Flower Beads — Cream', 'Flower Beads', 299, 299, 4.7, 188, 'Resin', { bestSeller: true }, 110],
  ['Gold-Tone Spacer Set', 'Spacer Beads', 249, 199, 4.8, 241, 'Alloy', {}, 0],
  ['Celestial Charm Collection', 'Charms', 560, 459, 4.9, 132, 'Alloy', { newArrival: true }, 70],
  ['Beginner Bracelet Making Kit', 'Jewelry Kits', 1499, 1199, 5.0, 64, 'Mixed', { featured: true }, 35],
  ['Matte Acrylic Rounds — Sand', 'Acrylic Beads', 310, 259, 4.6, 142, 'Acrylic', {}, 98],
  ['Baroque Pearl Drops — Champagne', 'Pearl Beads', 920, 749, 4.9, 87, 'Pearl', { trending: true }, 30],
  ['Velvet Bow Charms — Blush', 'Bow Beads', 329, 329, 4.7, 64, 'Resin', {}, 51],
  ['Crackle Glass Beads — Forest', 'Glass Beads', 520, 429, 4.8, 56, 'Glass', {}, 42],
  ['Rose Flower Beads — Caramel', 'Flower Beads', 420, 349, 4.8, 121, 'Resin', { bestSeller: true }, 80],
  ['Antique Spacer Rings — Gold', 'Spacer Beads', 229, 229, 4.7, 173, 'Alloy', {}, 145],
  ['Heart Locket Charms — Ink', 'Charms', 460, 389, 4.9, 95, 'Alloy', { newArrival: true }, 64],
  ['Deluxe Necklace Making Kit', 'Jewelry Kits', 1899, 1499, 5.0, 41, 'Mixed', { featured: true }, 21],
  ['Pastel Acrylic Hearts — Mix', 'Acrylic Beads', 349, 289, 4.6, 209, 'Acrylic', {}, 130],
  ['Round Shell Pearls — Ivory', 'Pearl Beads', 690, 559, 4.8, 110, 'Pearl', {}, 87],
  ['Mini Bow Beads — Gold', 'Bow Beads', 249, 249, 4.7, 78, 'Acrylic', { newArrival: true }, 36],
  ['Faceted Glass Cubes — Amber', 'Glass Beads', 560, 479, 4.8, 64, 'Glass', {}, 0],
  ['Cherry Blossom Beads — Blush', 'Flower Beads', 380, 319, 4.9, 156, 'Resin', { bestSeller: true }, 96],
  ['Textured Spacer Tubes — Caramel', 'Spacer Beads', 220, 179, 4.6, 132, 'Alloy', {}, 126],
  ['Star & Moon Charm Set — Gold', 'Charms', 499, 419, 4.9, 88, 'Alloy', { trending: true }, 56],
  ['Earring Making Starter Kit', 'Jewelry Kits', 1290, 999, 4.9, 73, 'Mixed', { featured: true }, 47],
]

export function buildProducts(categoryMap) {
  return rows.map((r, i) => {
    const [title, catName, mrp, salePrice, rating, reviews, material, flags, stock] = r
    const seed = `p${i + 1}`
    return {
      title,
      category: categoryMap[catName],
      mrp,
      salePrice,
      averageRating: rating,
      totalReviews: reviews,
      soldCount: Math.round((reviews || 0) * 8 + Math.random() * 200),
      stock,
      tags: [material.toLowerCase(), catName.toLowerCase().replace(/\s+/g, '-'), 'handmade'],
      brand: 'YS Creations',
      shortDescription: `Premium ${material.toLowerCase()} beads, hand-inspected for quality.`,
      description: `The ${title} brings a refined, premium finish to every handmade piece. Hand-inspected for consistency in colour, size and sheen.`,
      images: [img(seed), img(`${seed}-2`), img(`${seed}-3`), img(`${seed}-4`)],
      variants: [
        { color: 'Gold', size: '8mm', sku: `YSC-${seed}-G8`, stock: Math.round(stock / 2), price: null },
        { color: 'Cream', size: '10mm', sku: `YSC-${seed}-C10`, stock: Math.round(stock / 2), price: null },
      ],
      specifications: {
        material,
        weight: 40,
        finish: ['Glossy', 'Matte', 'Iridescent'][i % 3],
        packageContents: catName === 'Jewelry Kits' ? '1 kit' : '50 beads',
        dimensions: { length: 8, width: 8, height: 8, unit: 'mm' },
      },
      seo: {
        metaTitle: `${title} | YS Creations`,
        metaDescription: `Buy ${title} — premium handmade beads & jewelry supplies.`,
        metaKeywords: [material, catName, 'beads', 'jewelry making'],
      },
      ...flags,
      isActive: true,
    }
  })
}

export const coupons = [
  { code: 'WELCOME10', description: '10% off your first order', type: 'percent', amount: 10, minimumPurchase: 0, maximumDiscount: 300, active: true },
  { code: 'YS200', description: '₹200 off over ₹1499', type: 'flat', amount: 200, minimumPurchase: 1499, active: true },
  { code: 'FREESHIP', description: 'Free shipping', type: 'shipping', amount: 0, minimumPurchase: 0, active: true },
]

