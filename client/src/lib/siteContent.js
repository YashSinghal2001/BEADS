/*
 * Static storefront content (taxonomy + marketing copy) used by the
 * Categories, About, Contact, FAQ and Policy pages. This is presentation
 * content — product/category records still come from the API.
 */
import { categoryBanner, categoryImage } from './media.js'

/* ----------------------------- Categories ---------------------------- */
export const STORE_CATEGORIES = [
  {
    slug: 'acrylic-beads',
    name: 'Acrylic Beads',
    tagline: 'Lightweight & vibrant',
    description:
      'Bright, lightweight and endlessly versatile — our acrylic beads come in candy-pastel and bold jewel tones, perfect for everyday bracelets and statement pieces.',
    count: 13,
    featured: true,
    accent: '#F8D7DD',
    imgIndex: 2,
  },
  {
    slug: 'bow-beads',
    name: 'Bow Beads',
    tagline: 'Sweet & feminine',
    description:
      'Dainty bow-shaped beads that add a playful, feminine charm to any creation. A maker-favourite for layered bracelets and phone charms.',
    count: 12,
    featured: true,
    accent: '#EADBC8',
    imgIndex: 3,
  },
  {
    slug: 'flower-beads',
    name: 'Flower Beads',
    tagline: 'Blooming florals',
    description:
      'Delicate daisies, roses and cherry blossoms moulded in resin and acrylic. Bring a little garden into every design.',
    count: 12,
    featured: false,
    accent: '#F8D7DD',
    imgIndex: 1,
  },
  {
    slug: 'pearl-beads',
    name: 'Pearl Beads',
    tagline: 'Timeless elegance',
    description:
      'Lustrous freshwater-style and shell pearls in classic ivory, champagne and baroque shapes. The foundation of elevated, timeless jewelry.',
    count: 13,
    featured: true,
    accent: '#FBF7F0',
    imgIndex: 0,
  },
  {
    slug: 'glass-beads',
    name: 'Glass Beads',
    tagline: 'Luminous & rich',
    description:
      'Hand-finished Murano-style, crackle and faceted glass beads that catch the light beautifully. Rich colour with a premium weight and feel.',
    count: 13,
    featured: true,
    accent: '#2D6A4F',
    imgIndex: 19,
  },
  {
    slug: 'spacer-beads',
    name: 'Spacer Beads',
    tagline: 'The finishing touch',
    description:
      'Gold-tone and antique spacer rings, tubes and seed beads that bring rhythm and polish to your strands. The detail that sets a piece apart.',
    count: 12,
    featured: false,
    accent: '#D4A373',
    imgIndex: 10,
  },
  {
    slug: 'charms',
    name: 'Charms',
    tagline: 'Tiny statements',
    description:
      'Celestial, heart and locket charms in nickel-free alloy. Add personality and a focal point to bracelets, necklaces and anklets.',
    count: 13,
    featured: true,
    accent: '#B07F4F',
    imgIndex: 16,
  },
  {
    slug: 'diy-kits',
    name: 'DIY Kits',
    tagline: 'Everything to begin',
    description:
      'Complete, curated kits with beads, findings, tools and step-by-step guides. The easiest way to start — or gift — the craft of jewelry making.',
    count: 12,
    featured: true,
    accent: '#EADBC8',
    imgIndex: 8,
  },
]

export const categoryCardImage = (cat) => categoryImage(cat.imgIndex, 800)
export const categoryHeroImage = (cat) => categoryBanner(cat.slug, cat.imgIndex)

/* ----------------------- About: timeline & values ------------------- */
export const ABOUT_VALUES = [
  ['sparkle', 'Handmade quality', 'Every batch is hand-inspected for colour, size and finish before it ships.'],
  ['leaf', 'Ethical sourcing', 'Responsible, traceable supply chains and nickel-free, skin-friendly materials.'],
  ['truck', 'Fast shipping', 'Most orders are dispatched within 24 hours, with tracking on every parcel.'],
  ['shield', 'Customer support', 'A real maker-led team, here to help you create with confidence.'],
]

export const ABOUT_TIMELINE = [
  ['2020', 'The beginning', 'YS Creations starts at a single craft table — a handmade bracelet business run from home.'],
  ['2021', 'First collection', 'Our debut acrylic & pearl collection sells out in days. The studio is born.'],
  ['2023', 'Growth', 'We expand to 800+ products and ship across India, partnering with trusted artisans worldwide.'],
  ['2025', 'Community', 'A 12,000-strong community of makers, sellers and hobbyists creating #MadeWithYS every day.'],
]

export const ABOUT_STATS = [
  ['12,000+', 'Happy customers'],
  ['800+', 'Curated products'],
  ['4.9', 'Average rating'],
  ['5 yrs', 'Crafting excellence'],
]

/* ----------------------------- Contact ------------------------------ */
export const BUSINESS_INFO = {
  email: 'hello@yscreations.in',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  whatsappLink: 'https://wa.me/919876543210',
  instagram: '@yscreations',
  instagramLink: 'https://instagram.com/yscreations',
  address: 'YS Creations Studio, 24 Linking Road, Bandra West, Mumbai 400050, India',
  hours: 'Mon–Sat · 10:00 AM – 7:00 PM IST',
  mapEmbed:
    'https://www.google.com/maps?q=Linking+Road,+Bandra+West,+Mumbai&output=embed',
}

export const CONTACT_SUBJECTS = [
  'General enquiry',
  'Order support',
  'Wholesale / bulk order',
  'Product question',
  'Returns & refunds',
  'Collaboration',
]

/* ------------------------------- FAQs -------------------------------- */
export const FAQ_GROUPS = [
  {
    category: 'Shipping',
    icon: 'truck',
    items: [
      ['How long does delivery take?', 'Orders are dispatched within 24 hours and typically arrive in 3–6 business days across India. Metro cities are usually faster.'],
      ['Do you offer free shipping?', 'Yes — shipping is free on all orders over ₹999. Below that, a flat ₹49 is added at checkout.'],
      ['Will I get a tracking number?', 'Absolutely. As soon as your order ships, we email and SMS you a tracking link you can follow on the Track Order page.'],
      ['Do you ship internationally?', 'We currently ship within India only, but international shipping is on our roadmap — join our newsletter to hear first.'],
      ['What if my parcel is delayed?', 'Delays are rare, but if your order hasn’t moved in 48 hours, reach out and we’ll chase the courier on your behalf.'],
    ],
  },
  {
    category: 'Returns',
    icon: 'refresh',
    items: [
      ['What is your return policy?', 'Unopened packs can be returned within 7 days of delivery for a full refund or exchange. See our Return Policy for details.'],
      ['How do I start a return?', 'Head to your account’s Orders page, open the order and tap “Return / Exchange”. We’ll arrange a pickup where available.'],
      ['Are opened bead packs returnable?', 'For hygiene and quality reasons, opened or partially used packs can only be returned if they arrived faulty or incorrect.'],
      ['When will I get my refund?', 'Refunds are processed within 5–7 business days of us receiving the returned item, back to your original payment method.'],
    ],
  },
  {
    category: 'Products',
    icon: 'sparkle',
    items: [
      ['Are your beads suitable for bracelets and necklaces?', 'Yes — our standard 1.2mm hole fits elastic, tiger-tail and most beading wire used for bracelets, necklaces and earrings.'],
      ['Will the colours fade?', 'We use a premium fade-resistant finish. Keep your pieces away from harsh chemicals and prolonged water exposure for best results.'],
      ['How many beads come in a pack?', 'Most packs contain approximately 50 beads. Kits list their full contents in the product specifications.'],
      ['Are the materials skin-friendly?', 'All our findings are nickel-free and skin-friendly, suitable for sensitive skin.'],
      ['Do colours match the photos exactly?', 'We colour-correct every photo, but slight variation is natural for handmade batches and across screens.'],
    ],
  },
  {
    category: 'Payment',
    icon: 'creditCard',
    items: [
      ['What payment methods do you accept?', 'We accept UPI, all major debit/credit cards, net banking and popular wallets via our secure Razorpay gateway.'],
      ['Is Cash on Delivery available?', 'Yes, COD is available on most orders under ₹5,000. A small handling fee may apply.'],
      ['Is it safe to pay on your site?', 'Completely. Payments are processed by Razorpay over an encrypted connection — we never store your card details.'],
      ['Can I use a coupon code?', 'Yes, enter your code in the cart or at checkout. Try WELCOME10 for 10% off your first order.'],
    ],
  },
  {
    category: 'Wholesale',
    icon: 'package',
    items: [
      ['Do you offer wholesale pricing?', 'Yes — we support small businesses with tiered wholesale pricing. Contact us with your requirements to get a quote.'],
      ['What is the minimum order for wholesale?', 'Wholesale tiers typically start at ₹10,000 per order. Higher tiers unlock better per-unit pricing.'],
      ['Can I get a GST invoice?', 'Of course. Add your business name and GSTIN to your profile and we’ll issue a GST-compliant invoice automatically.'],
      ['Do you do custom or bulk colours?', 'For larger orders we can source custom colours and finishes. Reach out via the Contact page to discuss.'],
    ],
  },
]

/* ------------------------------ Policies ----------------------------- */
const updated = 'Last updated: January 2026'

export const POLICIES = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    eyebrow: 'Your data, respected',
    intro:
      'YS Creations (“we”, “us”) is committed to protecting your privacy. This policy explains what information we collect, how we use it, and the choices you have.',
    updated,
    sections: [
      ['Information we collect', 'We collect information you provide when you create an account, place an order, or contact us — such as your name, email, phone number, shipping address and order history. We also collect limited technical data (device, browser, IP) to keep the site secure and working well.'],
      ['How we use your information', 'Your information is used to process and deliver orders, provide customer support, send order updates, prevent fraud, and — only with your consent — share offers and new-collection news. We never sell your personal data.'],
      ['Payments', 'All payments are processed by our payment partner (Razorpay). We do not store your full card details on our servers. Card data is handled by PCI-DSS compliant providers.'],
      ['Cookies', 'We use essential cookies to keep you signed in and remember your cart, plus optional analytics cookies to understand how the site is used. You can control cookies through your browser settings.'],
      ['Data retention & security', 'We retain your data only as long as needed to provide our services and meet legal obligations. We protect it with encryption, access controls and regular security reviews.'],
      ['Your rights', 'You can access, correct or delete your personal data, and opt out of marketing at any time, by updating your account or emailing hello@yscreations.in.'],
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms & Conditions',
    eyebrow: 'The fine print',
    intro:
      'By accessing or purchasing from YS Creations, you agree to these terms. Please read them carefully.',
    updated,
    sections: [
      ['Use of our website', 'You agree to use this site lawfully and not to misuse it, attempt to disrupt it, or infringe our intellectual property. All content, imagery and designs are owned by YS Creations.'],
      ['Orders & acceptance', 'Placing an order is an offer to buy. We may accept or decline any order — for example if an item is out of stock or a pricing error occurs. You’ll be refunded in full if we cannot fulfil an accepted order.'],
      ['Pricing', 'All prices are in Indian Rupees (₹) and include applicable taxes unless stated otherwise. We may change prices at any time, but changes won’t affect orders already confirmed.'],
      ['Product descriptions', 'We work hard to describe and photograph products accurately. As our items are handmade, slight variations in colour, size and finish are normal and not considered defects.'],
      ['Limitation of liability', 'To the fullest extent permitted by law, YS Creations is not liable for indirect or consequential losses arising from the use of our products or website.'],
      ['Governing law', 'These terms are governed by the laws of India, and any disputes are subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.'],
    ],
  },
  shipping: {
    slug: 'shipping',
    title: 'Shipping Policy',
    eyebrow: 'Getting it to you',
    intro:
      'Everything you need to know about how, when and where we ship your handmade beads.',
    updated,
    sections: [
      ['Processing time', 'Orders are processed and dispatched within 24 hours on business days. Orders placed on weekends or holidays ship the next working day.'],
      ['Delivery time', 'Standard delivery takes 3–6 business days across India. Remote pin codes may take a little longer. You’ll receive tracking as soon as your order ships.'],
      ['Shipping charges', 'Shipping is free on orders over ₹999. For orders below ₹999, a flat shipping fee of ₹49 applies, calculated at checkout.'],
      ['Order tracking', 'Every order ships with a tracking link sent via email and SMS. You can also track your order any time on our Track Order page.'],
      ['Delivery issues', 'If a parcel is marked delivered but you haven’t received it, or arrives damaged, contact us within 48 hours and we’ll make it right.'],
      ['Serviceable areas', 'We currently ship across India. International shipping is not yet available but is coming soon.'],
    ],
  },
  returns: {
    slug: 'returns',
    title: 'Return Policy',
    eyebrow: 'Not quite right?',
    intro:
      'We want you to love what you make. If something isn’t right, here’s how returns and exchanges work.',
    updated,
    sections: [
      ['7-day returns', 'You may return unopened, unused items in their original packaging within 7 days of delivery for a refund or exchange.'],
      ['Non-returnable items', 'For hygiene and quality reasons, opened or partially used bead packs and custom/personalised items cannot be returned unless they arrived faulty or incorrect.'],
      ['How to return', 'Open the order in your account, tap “Return / Exchange” and select your reason. Where available, we’ll arrange a courier pickup; otherwise we’ll share a return address.'],
      ['Faulty or wrong items', 'If you received a damaged, defective or incorrect item, let us know within 48 hours with a photo and we’ll arrange a free replacement or full refund.'],
      ['Exchanges', 'Prefer a different colour or size? Choose “Exchange” when starting your return and we’ll ship the replacement once we receive the original.'],
    ],
  },
  refund: {
    slug: 'refund',
    title: 'Refund Policy',
    eyebrow: 'Money matters',
    intro:
      'How and when refunds are issued once a return is approved.',
    updated,
    sections: [
      ['Refund timeline', 'Once we receive and inspect your returned item, refunds are processed within 5–7 business days to your original payment method.'],
      ['Refund method', 'Card, UPI and net-banking payments are refunded to the original source. COD orders are refunded via bank transfer or store credit, as you prefer.'],
      ['Partial refunds', 'Partial refunds may apply where only part of an order is returned, or where an item is returned outside the stated conditions.'],
      ['Shipping costs', 'Original shipping charges are non-refundable unless the return is due to our error (a faulty, damaged or incorrect item).'],
      ['Store credit', 'You can choose to receive your refund as store credit — issued instantly once your return is approved, with no waiting period.'],
      ['Cancellations', 'Orders cancelled before dispatch are refunded in full. Once shipped, the standard return process applies.'],
    ],
  },
}

export const POLICY_LIST = [
  ['privacy', 'Privacy Policy', '/privacy'],
  ['terms', 'Terms & Conditions', '/terms'],
  ['shipping', 'Shipping Policy', '/shipping'],
  ['returns', 'Return Policy', '/returns'],
  ['refund', 'Refund Policy', '/refund'],
]
