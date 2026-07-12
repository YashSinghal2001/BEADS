# YS Creations — Premium Beads eCommerce

A premium, luxury eCommerce platform for handmade beads & jewelry-making supplies.
Built as a MERN stack application (MongoDB, Express, React, Node) with a strong
focus on premium UI/UX, animations, and conversion.

> **Status:** Phase 5 (admin CMS) complete — a separate role-based admin
> application (dashboard, product/order/customer/coupon/content management,
> activity audit log) on top of the full commerce backend. Storefront, backend,
> commerce engine and admin console are all in place.

---

## Tech stack

| Layer        | Choice                                                        |
| ------------ | ------------------------------------------------------------- |
| Frontend     | React 18 + Vite                                               |
| Styling      | Tailwind CSS (custom brand theme)                             |
| Animation    | Framer Motion                                                 |
| Routing      | React Router                                                  |
| State        | Zustand (Phase 2)                                             |
| Data fetch   | Axios (Phase 3)                                               |
| Forms        | React Hook Form + Zod (Phase 2/3)                             |
| Backend      | Node + Express + MongoDB/Mongoose (Phase 3)                   |
| Auth         | JWT + refresh tokens (Phase 3)                                |
| Payments     | Razorpay (Phase 4)                                            |
| Shipping     | Shiprocket (Phase 4)                                          |
| Media        | Cloudinary (Phase 3/4)                                        |

## Design system

| Token        | Value      | Usage              |
| ------------ | ---------- | ------------------ |
| `cream`      | `#F8F4EF`  | Primary background |
| `sand`       | `#EADBC8`  | Secondary surfaces |
| `gold`       | `#D4A373`  | Accent / CTAs      |
| `ink`        | `#2C2C2C`  | Dark / headings    |
| `graphite`   | `#3A3A3A`  | Body text          |
| `forest`     | `#2D6A4F`  | Success            |

Fonts: **Playfair Display** (headings), **Inter** (body), **Poppins** (buttons).

## Getting started

```bash
cd client
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Project structure

```
client/
├── index.html                 # Google Fonts + meta/SEO
├── tailwind.config.js          # brand colors, fonts, animations
├── src/
│   ├── components/
│   │   ├── ui/                  # Button, Icon, Drawer, Modal/Lightbox, Rating,
│   │   │                       #   QuantityStepper, RangeSlider, Pagination, Toast…
│   │   ├── layout/             # Navbar (live cart/wishlist counts), Footer, Layout
│   │   ├── product/            # ProductCard, Gallery, Info tabs, Reviews, Carousel
│   │   ├── shop/               # FilterPanel, ShopControls (sort/view/chips)
│   │   ├── auth/               # AuthLayout + form fields
│   │   ├── account/            # DashboardLayout
│   │   └── sections/           # Home: Hero, Categories, Featured, Story
│   ├── store/                  # Zustand: cart, wishlist, recentlyViewed,
│   │                           #   filters (URL-sync), preferences, toasts
│   ├── data/                   # catalog.js + account.js mock data (→ API in Phase 3)
│   ├── pages/                  # Home, Shop, ProductDetail, Cart, Wishlist,
│   │                           #   auth/*, account/*
│   ├── App.jsx                 # lazy routes + page transitions
│   └── index.css               # design tokens, glass/lux utilities
```

## What's built

**Phase 1 — foundation**

- Brand design system (colors, fonts, glassmorphism, soft shadows, lux spacing).
- Premium animated **Home page** (hero, categories, featured, story, testimonials,
  Instagram feed, newsletter), sticky glass navbar + mega footer.

**Phase 2 — shopping experience**

- **Shop**: sticky filter sidebar + mobile drawer, search, sort, grid/list toggle,
  price slider, colour/material/availability/rating filters, filter chips,
  pagination, skeleton loading, full **URL state sync**.
- **Product Detail**: Swiper gallery with hover-zoom + fullscreen lightbox + video,
  variant selection, quantity, add-to-cart/buy-now/wishlist, specs/shipping/FAQ
  tabs, reviews with rating breakdown + write-a-review, related & recently-viewed.
- **Cart**: quantity controls, remove, save-for-later, coupons, free-shipping
  progress, tax/shipping, order summary, recommendations.
- **Wishlist**: add/remove animations, move-to-cart, availability, empty states.
- **Auth**: Login, Register, Forgot/Reset password, OTP verification — React Hook
  Form + Zod, premium split-screen layout.
- **Dashboard**: Overview, Orders, Wishlist, Addresses, Returns, Notifications,
  Profile, Settings.
- **Zustand stores** (cart, wishlist, recently-viewed, filters, preferences) with
  localStorage persistence; global toast system; lazy-loaded routes (code split).

## Backend (`server/`)

Production Express + MongoDB/Mongoose API (Phase 3).

```bash
cd server
cp .env.example .env       # set MONGODB_URI + JWT secrets (min 10 chars)
npm install
npm run seed               # admin + categories + products + coupons
npm run dev                # http://localhost:5000  (health: /health, api: /api)
npm run check              # syntax-check all source files
npm run test:smoke         # end-to-end test on in-memory MongoDB
```

```
server/src/
├── config/        # env (zod-validated), db, cloudinary
├── utils/         # ApiError, ApiResponse, asyncHandler, token, logger, pagination
├── middleware/    # auth (JWT/RBAC), validate (zod), error, rateLimit, sanitize, upload
├── models/        # User, Category, Product, Review, Cart, Wishlist, Coupon, Order
├── validators/    # zod schemas per module
├── services/      # token, cloudinary, email, payment, shipping, search, analytics, pricing
├── controllers/   # one per module
├── routes/        # one per module + index.js → mounts /api/*
├── jobs/          # seed, releaseReservedStock
├── app.js         # express app (helmet, cors whitelist, compression, sanitize, rate limit)
└── server.js      # entry: connect DB + listen + graceful shutdown
```

Security: JWT access + refresh-token **rotation** with reuse detection (hashed at
rest), httpOnly cookies, bcrypt hashing, Helmet, CORS whitelist, rate limiting,
zod request validation, NoSQL-injection/XSS sanitization, and role-based access.

API base: `/api` — `auth, users, categories, products, wishlist, cart, reviews,
orders, coupons, uploads, analytics`. Standard envelope:
`{ success, message, data, meta }`. Cloudinary/Razorpay/Shiprocket are modular and
stay inert until their keys are set.

## Admin console (`admin/`)

A separate premium admin application (React + Vite + Tailwind) for operations.

```bash
cd admin
npm install
npm run dev      # http://localhost:5174  (proxies /api → :5000)
npm run build
```

Sign in with an admin-capable account (the seeded `SEED_ADMIN_EMAIL`). Features:

- **RBAC** — roles `super_admin / admin / manager / support / warehouse` with a
  permission matrix; nav and actions are gated per permission. All admin
  mutations are written to an **activity audit log**.
- **Dashboard** — revenue chart, order-status donut, conversion / payment-success
  / abandonment / AOV / CLV / delivery KPIs, low-stock alerts, recent orders.
- **Product CMS** — list/search, create/edit (variant builder, SEO, personalization),
  duplicate, archive, bulk edit, CSV import/export.
- **Orders** — queue + filters, detail with timeline, status transitions, refunds,
  invoice / packing-slip PDF download.
- **Customer CRM** — segments, profiles with CLV & order history, internal notes,
  role / block / wholesale tier management.
- **Coupons** — create/edit, usage analytics. **Content** — banners, testimonials,
  FAQs (full CRUD). **Activity** — full audit trail.

## Roadmap
- **Phase 2** — Shop (filters/sort/pagination), Product Detail (gallery/zoom/variants/
  reviews), Cart, wishlist + Zustand state.
- **Phase 3** — Express + MongoDB backend, schemas, JWT auth, product/cart/order APIs,
  Cloudinary uploads; wire frontend to real data.
- **Phase 4** — Checkout + Razorpay, Shiprocket, coupons, admin dashboard.
- **Phase 5** — SEO/structured data, performance, advanced features (recommendations,
  loyalty, flash sales), deployment (Vercel + Render + MongoDB Atlas).

> Razorpay, Shiprocket, and Cloudinary require API keys; their code is structured
> for integration but stays inert until credentials are provided (`client/.env.example`).
