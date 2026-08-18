# YS CREATIONS — COMPLETE PRODUCTION STATUS AUDIT

**Date:** 2026-08-18
**Auditor role:** CTO / Full-Stack Architect / DevOps / Security / QA / eCommerce PM
**Method:** Full static inspection of every route, controller, service, model, middleware, validator, store, page and workflow in `client/`, `admin/`, `server/`, `.github/` — plus **live verification** of the production URLs (API health, CORS, DNS, deployed bundle contents, catalog contents, webhook auth behavior). No code was modified. Claims marked **LIVE-VERIFIED** were actually checked against production on 2026-08-18; anything not checkable from here is marked **NOT VERIFIED**.
**Codebase:** ~18,500 LOC of source (server ≈ 7.5k, client ≈ 9k, admin ≈ 2.5k). Two commits: `b9b257f` (initial), `b09c4a7` (phase 2 production improvements).

> This report supersedes the 2026-07-12 audit. Every prior finding was re-verified against the current code; several were fixed (e.g. mass-assignment is now mitigated by Zod stripping, the confirmation screen bug was never real), several persist (webhook secret, email stub, `markOrderPaid` race, orderNumber collisions), and several **new, worse findings** were discovered (broken cart matching, fake Track-Order page, empty production catalog, apex DNS dead).

---

## ⚡ PROJECT STATUS

```text
PROJECT STATUS

Overall: 56/100

Launch Status:
🔴 NOT READY

Completed:            ~55%
Partially Completed:  ~25%
Pending:              ~8%
Broken:               ~12%

Launch Blockers:  9
High Priority:    8
Medium Priority:  12
Low Priority:     10
```

**One-paragraph summary:** The engineering foundation is genuinely good — a real order state machine, atomic inventory reservation with compensating rollback, refresh-token rotation with reuse detection, RBAC, webhook idempotency, Zod validation everywhere. The API is deployed and healthy, both frontends are live on Vercel, CORS is correct. But the store **cannot launch today**: the production database contains **zero products/categories/content** (the live site renders demo data that 404s on click), the **apex domain doesn't resolve**, the cart has a **product-matching bug that corrupts multi-item carts**, **no email is ever sent in production** (OTP and every transactional mail silently vanish), the **Track Order page and Contact form fabricate results**, Shiprocket shipping is **unreachable from the admin UI**, and two payment-integrity risks (webhook secret status, verify/webhook double-processing race) remain open. All of these are fixable in days, not weeks — but each one, alone, is disqualifying for taking real customer money.

---

# 1. MASTER FEATURE INVENTORY

Legend: ✅ DONE · 🟡 PARTIALLY DONE · 🔴 BROKEN · ⏳ PENDING · ⚠️ BLOCKED · 🧪 NEEDS REAL-WORLD TEST

### Auth & Account

| Area | Feature | Status | Evidence | What remains |
|---|---|---|---|---|
| Auth | Customer registration | ✅ | `auth.controller.js:18-50`, smoke-tested in CI | Works; user is logged in immediately (verification optional) |
| Auth | Login / logout | ✅ | `auth.controller.js:53-77` | — |
| Auth | Refresh-token rotation + reuse detection | ✅ 🧪 | `token.service.js:41-67` | Cross-site cookie risk on Safari (see §8.7) — needs real-device test |
| Auth | Registration OTP verify | 🔴 | `auth.controller.js:91-106` works, but **no email is ever delivered in prod** (`email.service.js:82-87`) and the client "Resend code" button is fake (`VerifyOtp.jsx:80-83`, no resend endpoint exists) | Wire real email + add `POST /auth/resend-otp` |
| Auth | Forgot / reset password | 🔴 | Server flow correct (`auth.controller.js:109-147`, hashed tokens, no user enumeration) — but reset email is never sent in prod | Blocked on email transport |
| Auth | Session bootstrap on refresh cookie | ✅ | `useAuthStore.js:91-102`, `axios.js:40-79` refresh queue | — |
| Account | Profile view/update, change password | ✅ | `user.controller.js:7-33`, `Profile.jsx`, `Settings.jsx` | — |
| Account | Addresses CRUD + default handling | ✅ | `user.controller.js:37-82`, `Addresses.jsx` | `updateAddress` body not schema-validated (minor) |
| Account | Notifications | 🟡 | Embedded array on User (`User.js:91`), listed in `Notifications.jsx` | Unbounded growth; no per-item read toggle; move to own collection |
| Account | Avatar upload | ⏳ | Endpoint exists (`upload.routes.js`, `/uploads/avatar`) — **no UI anywhere calls it** (`Profile.jsx` only displays `avatar.url`) | Build upload UI or drop endpoint |

### Catalog & Shopping

| Area | Feature | Status | Evidence | What remains |
|---|---|---|---|---|
| Products | Listing + filters + sort + pagination | ✅ | `product.controller.js:15-39`, `search.service.js`, indexed queries, `Shop.jsx`/`FilterPanel.jsx` | — |
| Products | Text search + autocomplete + suggestions | ✅ | Weighted `$text` index (`Product.js:162-165`), regex-escaped autocomplete (`search.service.js:69-82`) | — |
| Products | Product detail + gallery + video + related | ✅ | `ProductDetail.jsx`, `ProductGallery.jsx`, `getRelated` | Some spec fields are hardcoded filler ("Hole Size 1.2mm", "50 beads") — `mappers.js:81-88` |
| Products | Reviews (create/edit/delete, verified badge, helpful) | ✅ | `review.controller.js`, one-per-user index, `recalcProduct` denorm, real breakdown from fetched reviews (`ProductInfo.jsx:125-135`) | `markHelpful` is unauthenticated & unbounded |
| Products | Variants (size/color/SKU, per-variant price/stock) | 🟡 | Schema + price override honored (`cart.controller.js:16-22`) — but **variant stock is never reserved/decremented**; only top-level `stock` is (`inventory.service.js`) | Decide: enforce variant stock or remove the fields |
| Wishlist | Add/remove/clear, optimistic UI | ✅ | `wishlist.controller.js`, `useWishlistStore.js` | — |
| Cart | Add / update / remove / totals | 🔴 | **`addToCart` matches existing lines by variant key only — the product ID is ignored** (`cart.controller.js:108-112`). Adding a 2nd variant-less product increments the 1st product's quantity instead of adding a new line. `ProductCard.jsx:20` and `Wishlist.jsx:27` always send `variant: {}`, so any two "simple" products collide; even distinct products sharing a color/size collide | **Must fix before launch** — match on `(product, variantKey)` |
| Cart | Coupon apply/remove + revalidation | ✅ | `cart.controller.js:149-171`, revalidated on every cart build | Per-user limit only enforced at order time (minor UX) |
| Cart | Stock validation at add | 🟡 | Checked on add (`cart.controller.js:105`), **not** on quantity update (`:119-127`) | Enforced again at checkout via reservation, so low risk |
| Cart | Guest cart / guest checkout | ⏳ | Deliberately absent — `useCartStore.addItem` throws `AUTH_REQUIRED`; "Guest checkout is coming soon" (`Checkout.jsx:211`) | Post-launch conversion work |

### Checkout, Payments, Orders

| Area | Feature | Status | Evidence | What remains |
|---|---|---|---|---|
| Checkout | 6-step flow (info→address→shipping→review→payment→done) | ✅ | `Checkout.jsx`, persisted `useCheckoutStore` | Shipping-method step is cosmetic (server always computes ₹79/free) |
| Checkout | COD order placement | ✅ | `order.controller.js:127-133` reserve→commit→confirm; smoke-tested in CI | — |
| Checkout | Razorpay order + modal + verify | ✅ 🧪 | `createOrder` 5b, `payment.api.js:29-56`, `verifyPayment` HMAC (`payment.service.js:50-57`, timing-safe) | Never exercised against live gateway from this audit — needs real ₹1 test |
| Checkout | Duplicate-submission protection | 🟡 | Client `placing` flag disables button (`Checkout.jsx:33,395`) | No server-side idempotency key on `POST /orders` |
| Payments | Webhook (captured/failed/refund) + idempotency | 🟡 ⚠️ | Handler correct, replay-guarded by unique `(source,eventId)` (`WebhookEvent.js:18`, `webhook.controller.js:16-24`) — but **`RAZORPAY_WEBHOOK_SECRET` is commented out in the local `.env`** and its presence in Render **cannot be verified externally** (a missing secret and a bad signature both 401) | **Verify/set the secret + register the webhook URL in the Razorpay dashboard** |
| Payments | Verify-vs-webhook double processing | 🔴 | `markOrderPaid` guard is read-then-write, not atomic (`payment.controller.js:17-41`) — concurrent verify + webhook can both pass `status === 'captured'` check → **double `commitMany` (stock −2×), double loyalty** | Make it a conditional `Payment.updateOne({status:{$ne:'captured'}})` gate |
| Payments | `payment.authorized` treated as paid | 🟡 🧪 | `webhook.controller.js:48-50` marks orders paid on `authorized` too | If auto-capture is off in the Razorpay dashboard, orders confirm without captured money. Verify dashboard capture settings |
| Payments | Failed payment → retry | 🔴 | Endpoint exists (`POST /payments/:orderId/retry`) but **no UI anywhere calls it** (grep: only defined in `payment.api.js:5`) — and the cart was already emptied at order time. A customer whose payment fails has no recovery path; the order auto-cancels in 30 min | Build "Retry payment" on the order page, or don't clear the cart until paid |
| Payments | Payment timeout recovery | 🟡 | `recovery.js:13-36` releases stock + cancels pending Razorpay orders after 30 min (guards captured payments) — but if payment was captured at the gateway and *neither* verify nor webhook landed, **the customer is charged and the order still cancels**; `reconcilePayments` only logs, never queries Razorpay (`recovery.js:43-51`) | Reconcile against the Razorpay Orders API before cancelling |
| Payments | Refunds (admin) | 🟡 🧪 | `refundOrder` (`payment.controller.js:128-153`) calls the live refund API; webhook handles `refund.processed` | **`amount` is not validated** (negative/over-total passes through); admin UI offers full refund only; never tested against live gateway |
| Orders | Create with atomic stock reservation + rollback | ✅ | `inventory.service.js:27-37` (`$expr` conditional update — race-safe), compensating rollback (`order.controller.js:157-181`) restores stock/coupon/cart | — |
| Orders | Coupon claim (atomic, TOCTOU-safe) | ✅ | `order.controller.js:65-73` conditional `$inc` guarded by `usedCount < usageLimit` | Per-user count includes cancelled orders (minor) |
| Orders | Order number generation | 🔴 | `YSC-` + random 5-digit, **no collision retry** (`Order.js:113-118`). ~90k namespace → birthday-paradox: ≈1% of checkouts fail with a duplicate-key 500 at 1,000 orders, ~50% collision odds by ~350 orders **cumulatively**; each collision aborts a real checkout (rollback fires, customer sees an error) | Use a counter or larger random space + retry loop |
| Orders | Lifecycle state machine + timeline audit | ✅ | `order.service.js:6-52`, invalid transitions rejected (CI-tested) | — |
| Orders | Customer cancel / return | 🟡 | `order.controller.js:207-238` restocks correctly | **Cancelling a paid order does not trigger or flag a refund** — money is silently kept until an admin notices |
| Orders | Invoice PDF (customer + admin) | ✅ | `document.service.js:30-93` (pdfkit + QR), CI-tested | GSTIN must be real in prod env (`COMPANY_GSTIN`) |
| Orders | Reorder | ✅ | `order.controller.js:241-264` | — |
| Orders | Track-order page | 🔴 | **Entirely fake.** `TrackOrder.jsx:18-49` fabricates courier, AWB, status and ETA from a hash of whatever the visitor types. Publicly linked in the footer and sitemap | Remove it or wire to real order + Shiprocket tracking. Shipping fake tracking data to customers is a trust/legal problem |

### Admin Panel

| Area | Feature | Status | Evidence | What remains |
|---|---|---|---|---|
| Admin | Login + role gate + RBAC-aware UI | ✅ | `auth.js:18-49` (client), `requireAdmin`/`requirePermission` (server), `can(perm)` drives buttons | — |
| Admin | Dashboard (revenue, funnel, CLV, low stock, charts) | ✅ | `admin.controller.js:21-51`, `analytics.service.js`, `Dashboard.jsx` | — |
| Admin | Products CRUD + drafts + bulk + duplicate + CSV import/export | ✅ | `Products.jsx` (all wired), soft-delete archive, Zod-whitelisted bodies | Two admins editing concurrently = last-write-wins |
| Admin | Product image upload | 🔴 | **No upload UI** — the product form takes pasted URLs only (`Products.jsx:228`); `/uploads/images` + Cloudinary service are never called by any UI | Build the upload flow (endpoint already works) |
| Admin | Category management | ⏳ | Server CRUD routes exist (`category.routes.js`) — **admin UI has none** (`createCategory` defined in `api.js:109`, never used; no update/delete at all) | Categories only manageable via seed/API calls |
| Admin | Orders list + filter + detail + status update | 🟡 | `Orders.jsx` — list works for `admin`/`super_admin`/`manager`; **detail modal breaks for every role except exactly `admin`** because `GET /orders/:id` checks `role !== 'admin'` (`order.controller.js:200`) — even `super_admin` gets 403. List capped at 50 with no pagination UI | Fix authz to `isAdminRole()`; add pagination |
| Admin | Shipment creation (Shiprocket) | 🔴 | `api.shipOrder` exists (`api.js:116`) but **no button anywhere calls it**. Also latent bugs when it is called: transition `confirmed→shipped` is invalid (400 **after** the remote shipment was already created), and the payload lacks the required `pickup_location` field (`shipping.service.js:46-78`) | Wire UI, fix ordering, add pickup_location — then real-shipment test |
| Admin | Refunds | 🟡 | Button wired with `order.refund` permission (`Orders.jsx:125-126`) | Full-refund only; no amount input; unvalidated server-side |
| Admin | Customers CRM (list, search, segments, block, wholesale, notes) | ✅ | `Customers.jsx` + `customer.controller.js` | Search regex is not escaped (ReDoS/junk-match, `customer.controller.js:16`) |
| Admin | Role management privilege escalation | 🔴 | `updateCustomer` only guards granting `admin`/`super_admin` (`customer.controller.js:71-77`). **A `support` agent (has `customer.write`) can grant `manager`** — which carries product/coupon/content write. Privilege-escalation path | Restrict role changes to `super_admin` entirely |
| Admin | Coupons CRUD + analytics | ✅ | `Coupons.jsx`, `couponAnalytics` | — |
| Admin | Content CMS (banners/testimonials/FAQs) | ✅ | `Content.jsx` + dynamic `content.controller.js` | No Zod validation on content bodies (schema-bounded, low risk) |
| Admin | Review moderation | ⏳ | Server routes exist (`/reviews` admin list, `/reviews/:id/moderate`) — **no admin page uses them** | Build a Reviews page or moderate via API |
| Admin | Activity/audit log | 🟡 | Records mutations… **only on `/api/admin/*` routes** (`admin.routes.js:14`). Product/coupon/category/order-status mutations live on other routers and are **never audit-logged** | Attach `activityLog` to all admin-gated mutations |
| Admin | CSV exports | ✅ | Products CSV export/import round-trip (`adminProduct.controller.js:40-99`) | No customers/orders export |

### Platform

| Area | Feature | Status | Evidence | What remains |
|---|---|---|---|---|
| Shipping | Shiprocket API service (auth, create, AWB, pickup, label, track) | 🟡 ⚠️ | `shipping.service.js` is a real integration with token caching — but only `createShipment` is routed; AWB/pickup/label/track functions are **exported and never routed anywhere** | Route + UI + real test |
| Shipping | Shiprocket webhook → order status | ✅ 🧪 | `webhook.controller.js:72-111`, token-authenticated (**LIVE-VERIFIED: returns 401 without token → the token IS configured in production**) | Status-string mapping needs validation against real Shiprocket payloads |
| Email | All transactional email | 🔴 | `deliver()` is a stub: logs in dev, **does literally nothing in production** (`email.service.js:82-87` — `if (!config.isProd) log`; no transport). Templates + queue + retry exist and are well-built, but nothing sends | Wire Resend/SES/SMTP into the `deliver()` seam |
| Email | Queue durability | 🟡 | In-memory queue (`email.service.js:92-134`) — lost on every deploy/restart, duplicated if scaled to 2 instances | Move to BullMQ/Redis or an email provider's API with retries |
| Media | Cloudinary service (upload/delete/compression) | ✅ ⚠️ | `cloudinary.service.js` correct; **LIVE-VERIFIED: credentials configured in prod** (`features.cloudinary: true`) | Orphaned — no UI calls any upload endpoint (see Admin & Account) |
| Content | Contact form | 🔴 | **Fake.** Validates, then shows "Message sent!" and discards the message — "No backend endpoint — acknowledge optimistically" (`Contact.jsx:45-57`) | Add an endpoint/email hook or remove the form |
| SEO | Sitemap / robots / meta / JSON-LD | 🟡 | See §12 | Product URLs absent from sitemap; no SSR |
| Jobs | Recovery job (expired reservations, stuck payments) | 🟡 | Runs in-process every 10 min (`server.js:29-35`) | Single-instance only; reconcile is log-only |
| Seed | Seed data + admin bootstrap | 🟡 | `seed.js` — **`clearAll()` wipes products/categories/coupons/users unconditionally**; seed images are picsum placeholders | Dangerous against prod DB; never run it there. Rotate `SEED_ADMIN_PASSWORD` if defaults were ever used |
| Deployment | CI (build + syntax + smoke) | 🟡 | `.github/workflows/ci.yml` | Smoke test `exit(0)`s when Mongo can't download (false green, `smoke.js:33-38`); no lint gate; no CD |
| Deployment | Live infra | 🟡 | API + both frontends deployed and healthy (LIVE-VERIFIED) | **Apex DNS dead; production DB empty** (see §19) |
| Monitoring | Error tracking / uptime / log drain | ⏳ | Nothing (console logger only, `utils/logger.js`) | Sentry + UptimeRobot + log drain minimum |

---

# 2. CUSTOMER WEBSITE AUDIT

**Homepage** (`Home.jsx`, `Hero.jsx`, `Categories.jsx`, `FeaturedProducts.jsx`, `HomeSections.jsx`, `Story.jsx`): Complete and polished — hero, categories, featured carousel, story/values sections, CTAs, full footer (shop/company/support link columns, socials), Organization JSON-LD mounted in `Layout.jsx:30`. **However:** the homepage data layer silently falls back to `DEMO_CATEGORIES` / `DEMO_FEATURED` / `DEMO_PRODUCTS` when the API returns nothing (`useProductStore.js:32,68,81`, 468-line `homeContent.js`). Because the production DB is empty (LIVE-VERIFIED), **the live homepage is currently showing demo products whose links 404**. This fallback must be removed or the DB seeded before launch.

**Shop** (`Shop.jsx`, `FilterPanel.jsx`, `ShopControls.jsx`): Server-driven listing with search, category/tag/price/rating/stock filters, 6 sort options, pagination, skeletons, empty/error states. Category landing via `/category/:slug`. Solid. On live prod it correctly shows an empty state (no demo fallback on this path).

**Product page** (`ProductDetail.jsx`, `ProductGallery.jsx`, `ProductInfo.jsx`): Gallery w/ video support, price + MRP strike + discount %, stock status, quantity stepper, variant (size/color) selectors, add-to-cart + buy-now, wishlist toggle, related products, recently-viewed rail, real review list with computed rating breakdown, per-product JSON-LD Product schema with conditional `aggregateRating` (`ProductDetail.jsx:121`). Weaknesses: hardcoded filler specs (`mappers.js:83-88`) and highlights; add-to-cart feeds the broken server matching (below).

**Cart** (`Cart.jsx`, `useCartStore.js`): Optimistic add/update/remove with rollback, save-for-later (local), coupon box, free-shipping progress, price-drop `compareAt`, server-authoritative totals. **Blocked by the server-side `addToCart` matching bug** (`cart.controller.js:108-112`) — two variant-less products merge into one line. This will corrupt real carts within the first session of use.

**Checkout** (`Checkout.jsx`): Steps validated (address required to proceed), address add-inline, COD + Razorpay methods, `placing` double-submit guard, noindex. Confirmation correctly shows `orderNumber` (mapped to `order.id` in `mappers.js:177` — the previous audit's claim of an undefined here was wrong). Gaps: payment-failure path leaves the user with an emptied cart and no retry UI; client address form has no inline Zod validation (server 400s bubble up as toasts); express shipping is a disabled placeholder.

**Account** (`Overview/Orders/OrderDetail/Profile/Addresses/Notifications/Settings/Returns`): All implemented against real endpoints — order list w/ status filter, order detail w/ timeline, cancel/return actions, invoice download, reorder, address book, notifications. No "retry payment" anywhere (see blockers).

**Policies** (`Policy.jsx` + `siteContent.js`): Privacy, Terms, Shipping, Returns, Refund, plus FAQ and Contact pages all exist with real, coherent copy and are routed + in the sitemap. ✅ (Content is boilerplate-grade; have a human verify the legal text before launch.)

**Fake surfaces (must fix):** Track Order (fabricated tracking — `TrackOrder.jsx:18-49`), Contact form (discards messages — `Contact.jsx:50-57`), OTP resend (no-op — `VerifyOtp.jsx:80-83`), confirmation copy "A confirmation has been sent to your email" (`Checkout.jsx:420`) — false in production since no email sends.

---

# 3. ADMIN PANEL AUDIT

Covered feature-by-feature in the inventory. Summary of state:

- **Implemented & wired:** login/RBAC, dashboard analytics, products (full CRUD + bulk + duplicate + CSV both ways + draft/archive), orders list/detail/status/refund/invoice/packing-slip, customers CRM + segments, coupons + analytics, content CMS, activity log. UI is clean, permission-aware (`can()`), with its own refresh-queue axios client.
- **Broken:** order **detail** for any role ≠ `admin` (403 from `order.controller.js:200` — includes `super_admin`); role-change privilege escalation via support (`customer.controller.js:71-77`).
- **Orphaned server capability (no UI):** shipment creation (`shipOrder`), image/video upload, category CRUD, review moderation, partial-refund amounts.
- **Edge cases:** orders list hard-capped at 50 (“50 shown”), no optimistic-concurrency on product edits, status dropdown allows invalid transitions (server rejects with a toast — acceptable).
- **Production tested:** admin app is deployed and reachable (LIVE-VERIFIED, HTTP 200, correct CORS). Actual admin workflows against prod: **NOT VERIFIED**.

---

# 4. BACKEND AUDIT — API INVENTORY

All routes mount under `/api` behind `apiLimiter` (600 req/15 min/IP). Envelope `{success,message,data,meta}` and error handling (`error.middleware.js`) are consistent throughout: Zod→400, CastError→400, dup-key→409, JWT→401, stack traces suppressed in prod. `asyncHandler` everywhere. `/health` returns 503 when DB is down (LIVE-VERIFIED healthy).

| Method+Path | Auth | Role | Validation | Notes |
|---|---|---|---|---|
| POST /auth/register,login,refresh,verify-otp,forgot-password,reset-password | — | — | Zod + authLimiter (20/15min) | ✅ |
| POST /auth/logout | — | — | — | ✅ |
| GET/PATCH /users/profile, PATCH /users/password | Bearer | user | Zod | ✅ |
| /users/addresses CRUD | Bearer | user | Zod (add only; update unvalidated) | 🟡 |
| GET /users/notifications, PATCH …/read | Bearer | user | — | ✅ |
| GET /products, /products/:slug, /:slug/related, /search/* | optional | — | Zod query | ✅ `includeInactive` correctly admin-gated (`product.controller.js:19`) |
| POST/PATCH/DELETE /products*, PATCH /:id/stock | Bearer | **isAdmin (admin/super_admin/manager only)** | Zod (whitelisting via strip) | 🟡 warehouse excluded despite having `inventory.write` |
| GET /categories, /categories/:slug | — | — | — | ✅ |
| POST/PATCH/DELETE /categories | Bearer | isAdmin | Zod | ✅ in-use delete guard |
| /cart (7 endpoints) | Bearer | user | Zod | 🔴 add-matching bug |
| /wishlist (4) | Bearer | user | Zod param | ✅ |
| /reviews (7) | mixed | mixed | Zod | 🟡 `deleteReview` admin check is `role !== 'admin'`; `markHelpful` public unbounded |
| POST /orders | Bearer | user | Zod + writeLimiter | ✅ design; 🔴 orderNumber collisions |
| GET /orders, /orders/:id, /:id/invoice, POST /:id/reorder, PATCH /:id/cancel,/:id/return | Bearer | owner (or literal `admin`) | Zod | 🟡 authz string-match; payment doc (incl. `gatewaySignature`) populated to customer (`order.controller.js:198`) |
| GET /orders/admin/all, PATCH /:id/status, POST /:id/ship, GET /:id/label | Bearer | isAdmin | Zod | 🟡 ship latent-broken (transition + pickup_location) |
| GET /payments, POST /payments/verify, POST /payments/:orderId/retry | Bearer | owner | verify: Zod; retry: none | 🟡 retry param unvalidated, orphaned from UI |
| POST /coupons/validate | — | — | Zod | 🟡 public code-oracle (enumeration within rate limit) |
| /coupons admin CRUD | Bearer | isAdmin | Zod | ✅ |
| /uploads/avatar,/images,/video, GET /uploads/status | Bearer | user/isAdmin | multer type+size limits | ✅ endpoints; ⏳ zero UI consumers |
| /analytics/* (8) | Bearer | isAdmin | — | ✅ |
| /webhooks/razorpay, /webhooks/shiprocket | signature/token | — | in-controller | ✅ design; ⚠️ RZP secret unverified |
| /admin/* (me, dashboard, activity, coupons/analytics, products extras, customers, content, refund) | Bearer | requireAdmin + requirePermission | partial | ✅ structure; content bodies unvalidated |
| GET /banners,/testimonials,/faqs | — | — | — | ✅ |

**Dead/unused endpoints:** `POST /payments/:orderId/retry`, `POST /orders/:id/ship`, all three `/uploads/*`, `GET /reviews` (admin list), `PATCH /reviews/:id/moderate`, category PATCH/DELETE (no admin UI), duplicate legacy exports in `content.controller.js:26-50` (dead code). **Missing endpoints:** resend-OTP, contact-form submit, shipment AWB/pickup/label/track, newsletter.

**Race conditions found:** (1) `markOrderPaid` verify-vs-webhook (🔴, §9); (2) benign `User.exists→create` register race (lands as 409 via dup-key). Inventory and coupon races are correctly engineered away.

---

# 5. DATABASE AUDIT

Models: User, Product, Category, Cart, Wishlist, Order, Payment, Coupon, Review, Content (Banner/Testimonial/Faq), AdminActivity, WebhookEvent — all with sensible schemas and timestamps.

**Good:** compound + text indexes on Product match real query paths (`Product.js:162-171`); Order indexed on `user+createdAt`, `orderStatus`, `paymentStatus`; unique `(source,eventId)` webhook idempotency index; unique review per user/product; refresh tokens capped at 5; passwords/OTPs/reset tokens hashed; `availableStock` virtual consistent with the atomic pipeline updates; denormalized rating maintained by `recalcProduct`.

**Problems:**
1. 🔴 `orderNumber` — 90k random space, no retry (`Order.js:113-118`). Checkout-failing collisions are a certainty at modest volume.
2. 🟠 Unbounded embedded arrays: `User.notifications` (+1 per order forever), `adminNotes`, `tags` (`User.js:73-91`). 16 MB doc ceiling + every `findById` slows for loyal customers. Move notifications to a collection.
3. 🟡 Variant stock exists but is never part of inventory operations — sellable oversell at variant granularity if the business relies on it.
4. 🟡 `Cart` persists computed totals on **every read** (`buildCartResponse` saves each GET) — write amplification.
5. 🟡 `maxPoolSize: 10` (`db.js:14`) — fine at launch, undersized at 10k users.
6. 🟢 No transactions used; the compensating-actions pattern is a legitimate substitute at this scale and is implemented carefully.
7. 🟢 `WebhookEvent`/`AdminActivity` grow forever — add TTL indexes eventually.

---

# 6. AUTHENTICATION & SECURITY AUDIT

**Strong:** bcrypt cost 12; bearer-only API auth (deliberate CSRF-safe design, documented at `auth.middleware.js:6-10`); httpOnly refresh cookie scoped to `/api/auth`, `secure` + `SameSite=None` in prod; rotation with reuse-detection nuking all sessions; hashed OTP/reset tokens; no user enumeration on forgot-password; Helmet (CSP observed live on API); CORS strict whitelist w/ credentials (LIVE-VERIFIED allows exactly the two Vercel origins); NoSQL-operator key stripping; Zod validation strips unknown keys → mass assignment on validated routes is mitigated; multer type+size caps; timing-safe signature comparisons; rate limits global/auth/write; `.env` properly gitignored (verified: only `.env.example` tracked); error responses leak no stack in prod.

**Vulnerabilities:**

| Sev | Finding | Location |
|---|---|---|
| 🔴 | Webhook secret unset ⇒ all Razorpay webhooks rejected ⇒ paid-order auto-cancel path (status in prod NOT VERIFIED; local `.env` has it commented) | `payment.service.js:63-68`, `recovery.js:31` |
| 🟠 | `markOrderPaid` non-atomic double-processing | `payment.controller.js:17-41` |
| 🟠 | Privilege escalation: `support` can grant `manager` role | `customer.controller.js:71-77` |
| 🟠 | Authz split-brain: `isAdmin`(3 roles) vs `requireAdmin`(5 roles) vs literal `'admin'` string checks — causes both **denial** (super_admin 403 on order detail/invoice) and **policy drift** | `auth.middleware.js:54`, `rbac.middleware.js:4`, `order.controller.js:200,270`, `review.controller.js:63` |
| 🟠 | Refund amount unvalidated (negative/over-total forwarded to gateway) | `payment.controller.js:135` |
| 🟡 | Access tokens in `localStorage` (both apps) — XSS-exfiltratable; standard SPA tradeoff but admin deserves stricter CSP | `tokenStore.js`, `admin/api.js:3-20` |
| 🟡 | Unescaped user regex in customer search (ReDoS/inj.) | `customer.controller.js:16` |
| 🟡 | Password min 6 at register vs 8 at reset; no strength/breach check | `auth.validator.js:4,36` |
| 🟡 | Value-mangling sanitizer escapes `<`/`>` in ALL strings (corrupts legit content; false security) — the key-stripping half is the useful part | `sanitize.middleware.js:7-9` |
| 🟡 | Customer order response includes full Payment doc w/ `gatewaySignature` | `order.controller.js:198` |
| 🟡 | Seed admin defaults (`admin@yscreations.com` / known default password) — **verify prod admin was created with a rotated password**; test creds sit in `.env` comments (rotate them; never commit) | `env.js:40-41`, `seed.js:36-46` |
| 🟢 | Public `markHelpful`, public coupon validate oracle, `/uploads/status` info leak, `X-Powered-By` not explicitly disabled (Helmet covers), no CSP on the two Vercel frontends | various |

---

# 7. RAZORPAY PRODUCTION AUDIT

- Live keys on server: **configured** (LIVE-VERIFIED `features.razorpay: true`). **Test vs live mode: NOT VERIFIED** — local `.env` shows an `rzp_` key and the client `.env` carries an unused test key (the checkout key correctly comes from the server response, `payment.api.js:35`; `VITE_RAZORPAY_KEY_ID` is dead). **Confirm the Render key is `rzp_live_…`** before launch.
- Webhook endpoint: implemented + raw-body signature verification (`app.js:37-44`, `payment.service.js:63-68`) + replay idempotency. **Webhook secret in Render: NOT VERIFIABLE from outside** (missing secret and bad signature both 401 — LIVE-tested). Locally it is commented out. **Also confirm the webhook is actually registered in the Razorpay dashboard pointing at `https://ys-creations-api.onrender.com/api/webhooks/razorpay`.**
- Signature verification: correct HMAC construction, timing-safe. ✅
- Duplicate webhook protection: ✅ (unique event index). Verify-vs-webhook concurrency: 🔴 **can execute the paid-path twice** (the question the brief asked directly): `payment.status === 'captured'` guard is read-then-write; both callers load independent docs; `order.inventoryCommitted` guard has the same flaw. Consequence: double stock decrement, double loyalty award, duplicate timeline/emails.
- Payment capture: `payment.authorized` is treated as success (`webhook.controller.js:49`) — safe only if auto-capture is on in the dashboard. 🧪
- Failed payment: webhook + verify failure release reserved stock ✅; but customer-facing recovery is missing (no retry UI, cart already cleared) 🔴 UX.
- Timeout: 30-min auto-cancel ✅ mechanism, but no gateway reconciliation before cancelling ⇒ "browser closed after paying + webhook not delivered" ends in **charged customer, cancelled order, no refund, no alert** (reconcile only logs).
- Refunds: full+partial supported at API level, webhook handles `refund.processed`; amount unvalidated; admin UI full-only. 🧪 never fired against live gateway.
- Browser-closed-after-payment: covered **only** by the webhook ⇒ the webhook secret/registration is the single point of truth for money correctness.

```text
Razorpay Launch Status:
NOT READY
```
**Why:** (1) webhook secret + dashboard registration unverified — with it absent, every paid-but-unverified order auto-cancels after 30 minutes while the charge stands; (2) the double-processing race is real and costs inventory/loyalty; (3) no reconciliation against the gateway before auto-cancel; (4) no customer retry path. Items 1, 2 and 4 are each < half a day of work; do them, run a live ₹1 end-to-end (pay/close-browser/webhook/refund) matrix, then this flips to READY.

---

# 8. SHIPROCKET AUDIT

- Credentials configured in prod (LIVE-VERIFIED `features.shiprocket: true`); webhook token enforced (LIVE-VERIFIED 401).
- Integration code quality is good (token cache, error mapping) — but **the feature is unreachable**: no admin UI calls `shipOrder`; AWB assignment, courier selection, pickup scheduling, label and manifest generation, and tracking are implemented in `shipping.service.js:80-109` and **routed nowhere**; `shipmentTracking.awb` is only ever set by the inbound webhook, which itself matches orders by AWB the system never stored (it falls back to `orderNumber` matching — fragile).
- `createShipment` payload: hardcoded 10×10×5 cm / 0.3 kg; **missing `pickup_location`** (required by Shiprocket's adhoc API — expect a 422 on first real call); calls `transitionOrder(order,'shipped')` which is an **invalid transition from `confirmed`/`processing`** (`order.service.js:9-11`) so the local save 400s *after* the remote shipment exists — state divergence.
- Return/cancellation flows to Shiprocket: not implemented.

```text
Shipping Launch Status:
NOT READY
```
Manual fallback exists (admin can mark statuses by hand and print the in-house label/packing slip PDFs) — workable for a soft launch **if** you ship via the Shiprocket dashboard manually. The in-app integration needs UI + payload fixes + a real shipment test.

---

# 9. EMAIL SYSTEM AUDIT

```text
Email transport: LOG ONLY (dev) / SILENT NO-OP (production)
```

`deliver()` (`email.service.js:82-87`) logs the message **only when not in production** and returns `{delivered:true, channel:'log'}` unconditionally — in production nothing is sent *and nothing is even logged*. Ten polished HTML templates (welcome, verification, password reset, order confirmation, payment success/failure, shipped, delivered, cancelled, refund) and an in-memory retry queue are wired to real lifecycle events (`order.service.js:69-75`) — the seam is one function away from working, which is the good news.

Consequences today: no registration OTP (verification impossible), no password reset (**account recovery is completely broken in production**), no order/payment/shipping/refund notifications, and the checkout screen tells customers "a confirmation has been sent to your email" — false. **Launch blocker.** Note `resetPassword` is unusable without the emailed token → any customer who forgets their password is locked out permanently.

---

# 10. CLOUDINARY AUDIT

Service + config correct (feature-gated, `quality:auto/fetch_format:auto` compression, delete-with-warning, 5 MB images/50 MB video, MIME whitelist). Credentials live in prod (LIVE-VERIFIED). **But no UI consumer exists** — admin product images are pasted URLs, avatar upload has no control, review-image upload has no picker (the API accepts `images` URLs on reviews). Cloudinary is presently an unused, correctly-configured integration. Also: seed data uses `picsum.photos` placeholders; the OG image is hot-linked from Pexels — brand-owned media is missing everywhere.

---

# 11. SEO AUDIT

- ✅ robots.txt (correct disallows + sitemap pointer — LIVE-VERIFIED serving), static sitemap.xml (LIVE 200), per-route title/description/canonical/OG/Twitter via `Seo.jsx`, `noindex` on cart/checkout/account, Organization JSON-LD sitewide, Product JSON-LD w/ aggregateRating, FAQ JSON-LD (`FAQ.jsx`).
- 🔴 **Google cannot discover any product**: the sitemap contains only 13 static routes (`sitemap.xml` states this in its own comment); there is no dynamic sitemap endpoint; and with a client-only SPA, every crawler that doesn't execute JS sees one generic title for all URLs. Social scrapers (WhatsApp/FB) will show the same Pexels stock photo for every product link.
- 🟡 No SSR/prerender; canonical built from `window.location.origin` (fine since www is the only working host — but decide www vs apex canonicalization when DNS is fixed).
- 🟡 `og:image` hot-linked to Pexels (`index.html:23`, `Seo.jsx:6`).
- Verdict: technically indexable shell, **catalog invisible**. Needs: dynamic sitemap fed from the DB + prerender (or a `react-snap`-style pass, or move PDP/PLP to SSR) + owned OG images.

---

# 12. PERFORMANCE AUDIT

- ✅ Route-level code splitting + sensible manualChunks (`vite.config.js:22-32`); deployed entry JS ≈ 100 KB raw (LIVE-fetched; ~2.4 MB total dist incl. all lazy chunks/vendors); lazy images; skeleton loaders; list request caching + in-flight dedupe (`useProductStore.js:6-15`); server `.lean()` + `Promise.all` count/data + compression + indexed queries.
- 🟡 SPA + API on Render free/low tier ⇒ TTFB on cold start can exceed 30 s (observed uptime counter suggests periodic restarts — likely spin-down). First paint depends on JS + API round trip.
- 🟡 No HTTP cache headers on API GETs; no CDN for API; Google Fonts render-blocking (3 families, though `display=swap`).
- 🟡 Framer-motion page transitions add main-thread work on every navigation (fine at this scale).
- Estimated Core Web Vitals (not Lighthouse-measured): **LCP 3–5 s** on 4G (SPA + hero image + API), **CLS low** (skeletons reserve space), **INP fine**, **TTFB poor on Render cold starts**. Run Lighthouse + enable Render always-on before judging further.

---

# 13. RESPONSIVENESS & UX AUDIT

Tailwind responsive classes used consistently across storefront (grid collapses, drawer nav w/ mobile menu, horizontally scrollable checkout progress, sticky order summary on lg+). Admin uses table layouts inside `overflow` wrappers — usable on tablet, cramped but functional on phones. Loading/empty/error states are consistently present (a genuine strength). Toast system unified.

UX problems, ranked: (1) failed-payment dead end (cart emptied, no retry); (2) fake Track-Order/Contact/Resend flows destroy trust the moment a customer notices; (3) forced login before add-to-cart + no guest checkout = the classic first-order killer for a new brand; (4) demo-fallback products that 404; (5) "confirmation email sent" copy is false; (6) admin order list capped at 50 rows with no paging; (7) icon-only buttons lack aria-labels in several places (a11y ~40 aria usages total, not audited end-to-end).

---

# 14. TESTING AUDIT

- **What exists:** a syntax gate over every server file (`check-syntax.js`), and one substantial API smoke test (`smoke.js`, ~300 lines) covering health, product list/search/detail, categories, register/login/401/validation, cart add w/ totals, coupon validate, **COD order with real stock-decrement assertions**, invalid/valid status transitions, HMAC signature verify, webhook idempotency at the model level, invoice PDF bytes, reorder, analytics, customers, content CRUD, activity log, 404. Runs against in-memory Mongo in CI on every push/PR. A tiny client mapper test exists (`client/scripts/test-mappers.mjs`) — not run in CI.
- **What's missing:** any unit tests (pricing math, coupon caps, transitions), any Razorpay-path integration test (verify/webhook/race), any client/admin tests, any E2E browser test, coverage measurement.
- **Can tests falsely pass? Yes, two ways:** (1) `smoke.js:33-38` exits **0** if mongodb-memory-server can't download — CI goes green having tested nothing; (2) client/admin CI jobs only prove `vite build` succeeds.
- The exact code that carries money (verify-vs-webhook concurrency, rollback branches, recovery cancellation) is precisely the code with **zero** automated coverage.

---

# 15. CI/CD AUDIT

```text
CI = GitHub Actions: 3 parallel jobs on push/PR to main
     server → npm ci + syntax check + smoke test
     client → npm ci + vite build
     admin  → npm ci + vite build
CD = NONE in the repo. No deploy steps, no vercel.json, no render.yaml.
     Deployment presumably rides Vercel/Render git-integration auto-deploys (NOT VERIFIED)
     — meaning deploys are NOT gated on CI passing unless "wait for CI" is enabled
     in those dashboards.
Current pipeline = build-and-smoke verification only; no lint, no coverage,
     no branch protection evident, no deploy gating, no rollback strategy
     beyond Vercel's built-in immutable deployments / Render manual rollback.
```

Fix-list: make the smoke test fail loudly when it can't run; add `npm run lint` (client already defines it) to CI; enable "require CI green" on the main branch and in Vercel/Render settings; document rollback (Vercel promote-previous; Render rollback button; DB has no migrations to worry about).

---

# 16. ENVIRONMENT & DEPLOYMENT AUDIT

No secrets are committed (verified: `git ls-files` shows only `.env.example`s; all three `.gitignore`s cover `.env*`). Local `server/.env` contains real-looking Cloudinary/Razorpay/Shiprocket values **plus old test credentials in comments — rotate anything ever shared and keep prod values only in Render**.

| Variable | Used by | Local | Production | Status |
|---|---|---|---|---|
| MONGODB_URI | server | set | Render (implied by live DB) | ✅ NOT directly verifiable |
| JWT_SECRET / JWT_REFRESH_SECRET | server | set | implied working (login flows live) | ✅ |
| JWT_ACCESS_EXPIRES / REFRESH_EXPIRES | server | 15m / 30d | defaults OK | ✅ |
| CLIENT_URL (CORS whitelist) | server | localhost pair | **LIVE-VERIFIED**: allows `https://www.yscreations.in` + `https://admin.yscreations.in`; **apex origin NOT allowed** | 🟡 add apex when DNS fixed |
| COOKIE_DOMAIN | server | empty | unknown | 🟡 irrelevant while API is on onrender.com (can't scope to yscreations.in) |
| CLOUDINARY_NAME/KEY/SECRET | server | set | **LIVE-VERIFIED enabled** | ✅ |
| RAZORPAY_KEY_ID / RAZORPAY_SECRET | server | set | **LIVE-VERIFIED enabled**; live-vs-test mode NOT VERIFIED | ⚠️ confirm `rzp_live_` |
| **RAZORPAY_WEBHOOK_SECRET** | server | **commented out** | **NOT VERIFIABLE** | 🔴 must confirm in Render + Razorpay dashboard |
| SHIPROCKET_EMAIL/PASSWORD | server | set | **LIVE-VERIFIED enabled** | ✅ |
| SHIPROCKET_WEBHOOK_TOKEN | server | set | **LIVE-VERIFIED enforced** (401 w/o token) | ✅ |
| COMPANY_NAME / COMPANY_GSTIN | server | set (real-looking GSTIN) | unknown — default is a placeholder GSTIN that would print on invoices | 🟡 verify on Render |
| SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD | seed | overridden | unknown | 🟡 ensure non-default in prod; never run seed against prod (it wipes data) |
| VITE_API_URL | client+admin | localhost:5001 | **LIVE-VERIFIED**: deployed bundle points at `https://ys-creations-api.onrender.com/api` | ✅ |
| VITE_RAZORPAY_KEY_ID | client | test key | — | 🟢 **unused/dead** (key comes from server) — remove |
| VITE_CLOUDINARY_CLOUD_NAME | client | set | — | 🟢 unused — remove |
| PORT / NODE_ENV | server | 5001/dev | prod (LIVE-VERIFIED `env:"production"`) | ✅ |

Other deployment notes: admin has no `.env.example`; `dist/` folders exist locally but are untracked ✅; Vite inlines env at build time (admin `.env` comment acknowledges this) — per-environment builds required.

---

# 17. LIVE PRODUCTION CHECK (performed 2026-08-18)

| Check | Result |
|---|---|
| `GET https://ys-creations-api.onrender.com/health` | **200** — `env: production`, `db: connected`, features: cloudinary ✅ razorpay ✅ shiprocket ✅ (uptime 771 s at probe → recent restart/spin-up; Render cold starts likely) |
| `https://www.yscreations.in` | **200**, HTTPS, correct built index.html, bundle `index-CxuO1MII.js` |
| `https://yscreations.in` (apex) | 🔴 **DNS does not resolve — no A/ALIAS record** (`dig` empty). Half of typed-in traffic and many shared links will dead-end |
| `https://admin.yscreations.in` | **200**, HTTPS, on Vercel |
| Frontend → API wiring | ✅ deployed bundle contains `https://ys-creations-api.onrender.com/api` as baseURL |
| CORS | ✅ `www` and `admin` origins allowed w/ credentials; apex origin **not** whitelisted |
| **Catalog content** | 🔴 **`/api/products` → `total: 0`; `/api/categories` → `[]`; `/api/banners` → `[]`; `/api/faqs` → `[]`** — the production database is empty. Live homepage silently renders demo products that cannot be opened or bought |
| Webhook endpoints | Razorpay: 401 on bad signature (secret presence indeterminate). Shiprocket: 401 without token → token configured ✅ |
| robots.txt / sitemap.xml | ✅ both live |
| Render/Vercel/Atlas/Razorpay/Shiprocket dashboards | NOT VERIFIED (no access from audit environment) |

---

# 18. NEEDS MANUAL TESTING

Cannot be confirmed from code — must be executed by a human before launch:

1. **Razorpay live-mode ₹1 matrix:** pay-and-verify; pay-and-close-browser (webhook-only path); webhook + verify racing; failed payment; full refund; partial refund via API. Check Render logs + DB after each.
2. **Razorpay dashboard:** webhook URL registered with the exact secret set in Render; auto-capture ON; live keys active.
3. **Real Shiprocket shipment** (after wiring the UI): create, AWB assign, pickup, label, webhook status progression, COD remittance.
4. **A real transactional email of every type** (after transport wired), incl. spam-folder check and SPF/DKIM for the sending domain.
5. **Registration → OTP → verify → forgot-password → reset** end-to-end on production.
6. **Safari/iOS session persistence** — the refresh cookie is third-party (frontends on `yscreations.in`, API on `onrender.com`); ITP may refuse it, silently logging Safari users out after 15 min and breaking checkout. If it fails: put the API on `api.yscreations.in` and set `COOKIE_DOMAIN=.yscreations.in`.
7. Admin image upload (once built), CSV import with a real catalog file, invoice PDF print correctness incl. GSTIN.
8. Order lifecycle driven from the admin on a real order incl. COD delivered → auto-paid.
9. Mobile checkout on a low-end Android + iPhone; Razorpay modal behavior in in-app browsers (Instagram).
10. Lighthouse/Web Vitals on `www.yscreations.in` after products exist; Render cold-start timing with a customer's eyes.
11. Restore-from-backup drill on Atlas (confirm PITR enabled).

---

# 19. 🚨 MUST FIX BEFORE LAUNCH

| # | Issue | Severity | File | Why it matters | Exact fix | Est |
|---|---|---|---|---|---|---|
| 1 | Cart merges different products into one line (matching ignores product ID) | 🔴 | `server/src/controllers/cart.controller.js:108-112` | Any customer adding 2+ simple products gets a corrupted cart → wrong orders, instant trust loss | Match `it.product.equals(productId) && key(it.variant) === key(variant)` | 15 min + test |
| 2 | No email transport in production (OTP, reset, order mails silently dropped; password reset = permanent lockout) | 🔴 | `server/src/services/email.service.js:82-87` | Accounts unrecoverable; zero customer comms; "email sent" copy is false | Wire Resend/SES/Nodemailer-SMTP inside `deliver()`; env-gate; add `POST /auth/resend-otp`; connect real "Resend" button | 0.5–1 day |
| 3 | Production DB empty (0 products/categories/content) + storefront demo fallback masks it | 🔴 | live DB; `client/src/store/useProductStore.js:32,68,81` | Nothing is buyable; visible catalog is fake and 404s | Load the real catalog (admin CSV import exists); delete demo fallbacks; seed content via admin CMS | 0.5 day + catalog work |
| 4 | Apex domain `yscreations.in` doesn't resolve; apex not in CORS | 🔴 | Hostinger DNS; Render `CLIENT_URL` | Typed-in traffic and links die | Add A/ALIAS → Vercel, add domain in Vercel w/ redirect to www, append apex to `CLIENT_URL` | 30 min + propagation |
| 5 | Razorpay webhook secret unverified (locally commented out); registration in dashboard unverified | 🔴 | Render env; `payment.service.js:63-68` | Without it, "paid but browser died" orders auto-cancel at 30 min with money captured | Set secret in Render + register webhook in Razorpay dashboard; send test webhook; confirm 200 in logs | 30 min |
| 6 | `markOrderPaid` verify/webhook double-processing race | 🔴 | `server/src/controllers/payment.controller.js:17-41` | Double stock decrement + double loyalty on the happy path (webhook + verify usually BOTH arrive) | Gate on `Payment.findOneAndUpdate({_id, status:{$ne:'captured'}},{$set:{status:'captured',…}})`; only commit inventory when that update won; same conditional for `inventoryCommitted` | 2–3 h + test |
| 7 | Fake Track-Order page & fake Contact form | 🔴 | `client/src/pages/TrackOrder.jsx:18-49`, `Contact.jsx:50-57` | Fabricated AWB/status shown to anyone; messages silently discarded — deceptive in a paid store | Track: replace with real lookup (`GET /orders` by number+email) or remove from nav/sitemap. Contact: add endpoint (email/DB) or replace with mailto | 2–4 h |
| 8 | `orderNumber` collisions abort real checkouts | 🟠 | `server/src/models/Order.js:113-118` | ~1 in 100 checkouts 500s at 1k cumulative orders, worsening | Counter collection (`findOneAndUpdate $inc`) or 8-char base36 + retry-on-11000 | 1–2 h |
| 9 | Failed/abandoned payment leaves customer with emptied cart and no retry | 🟠 | `Checkout.jsx:99-117`, unused `payments/:orderId/retry` | Every payment hiccup = lost order + manual re-shopping | Add "Complete payment" button on pending orders (endpoint already exists) | 2–4 h |

**Gate items also required before money flows (config, not code):** confirm live-mode keys, auto-capture ON, admin password non-default, GSTIN real on Render, Sentry (or minimum: Render log alerts + UptimeRobot on `/health`).

---

# 20. POST-LAUNCH IMPROVEMENTS (do NOT block launch)

- **Reliability:** externalize email queue + recovery job (BullMQ/Redis) before scaling past one Render instance; gateway reconciliation in `reconcilePayments`; TTL indexes for WebhookEvent/AdminActivity; notifications → own collection; Render always-on plan.
- **Security hardening:** unify authz on `isAdminRole()`/permissions everywhere; restrict role-granting to super_admin; validate refund amounts; escape customer-search regex; align password policy to 8+; drop `<`/`>` value-mangling; stop populating `gatewaySignature` to customers; CSP headers on both Vercel apps.
- **Commerce/conversion:** guest checkout + anonymous cart; abandoned-cart + post-delivery review emails (unlocked by transport); cross-sell; newsletter capture; wholesale tier pricing actually applied at checkout (fields exist, pricing ignores them); customization options surfaced (schema exists, no UI).
- **Admin:** image upload UI; category manager; review moderation page; shipment panel (AWB/pickup/label); orders pagination + search; partial-refund amount input; audit-log coverage for all admin mutations.
- **SEO/Perf:** dynamic sitemap endpoint; prerender or SSR for PDP/PLP; owned OG images; API cache headers + CDN; font self-hosting.
- **Engineering:** unit tests for pricing/coupons/transitions/inventory race; Razorpay race integration test; lint in CI; smoke test hard-fail; OpenAPI doc; TypeScript migration (long-term).

---

# 21. FINAL SCORECARD

| Category | Score | Rationale (one line) |
|---|---:|---|
| Architecture | 8.5 | Clean layering, service seams, event bus, compensating transactions — genuinely strong |
| Frontend | 7.0 | Polished, complete flows; marred by fake pages + demo fallback + cart-bug exposure |
| Backend | 7.5 | Consistent, validated, race-aware in inventory/coupons; payment race + authz drift deduct |
| Admin | 6.0 | Real RBAC panel, but order-detail 403s for most roles; shipping/images/categories/reviews unreachable |
| Database | 7.5 | Well-indexed, idempotency index; orderNumber + unbounded arrays deduct |
| Security | 6.5 | Excellent token/webhook/validation hygiene; escalation path + authz inconsistencies + weak pwd policy |
| Payments | 5.0 | Correct crypto + idempotent webhook, but race, unverified webhook secret, no retry, no reconciliation |
| Shipping | 3.0 | Real API client exists; unreachable from UI, payload gaps, untested |
| Email | 1.0 | Templates + queue exist; zero delivery capability in production |
| SEO | 4.5 | Meta/JSON-LD/robots fine; catalog undiscoverable (static sitemap, no SSR) |
| Performance | 7.0 | Proper splitting/caching/indexes; SPA+cold-start LCP risk, no API caching |
| UX | 6.5 | Coherent premium journey; payment-failure dead-end + forced-auth funnel + fake surfaces |
| Testing | 3.5 | One good CI smoke; money paths untested; false-green escape hatch |
| CI/CD | 5.0 | Real CI on 3 apps; no lint, no gating, no CD/rollback definition |
| Deployment | 5.5 | All three apps live + wired + CORS right; apex DNS dead, DB empty, no monitoring |
| Scalability | 6.0 | Stateless-ish + atomic ops scale; in-process queue/timer and pool=10 cap it at one instance |

### **OVERALL: 56/100** *(mean of 16 categories ×10)*

---

# 22. FINAL ROADMAP

## Phase 1 — MUST FIX (est. 3–5 focused days)
1. Fix cart add matching (blocker #1) + add a regression test to `smoke.js`.
2. Wire a real email provider into `deliver()`; add + connect resend-OTP; verify SPF/DKIM.
3. Fix `markOrderPaid` atomicity (conditional update gate).
4. Set/confirm `RAZORPAY_WEBHOOK_SECRET` on Render; register webhook in the Razorpay dashboard; confirm auto-capture + live keys.
5. Replace orderNumber generation (counter or retry loop).
6. Real Track-Order (or remove) + real Contact submission (or mailto).
7. Remove demo-content fallbacks; load the real catalog + categories + banners/FAQs through the admin.
8. Fix apex DNS on Hostinger → Vercel; add apex to Vercel + `CLIENT_URL`.
9. Add "Retry payment" using the existing endpoint.
10. Quick authz pass: `isAdminRole()` in `getOrder`/`downloadInvoice`/`deleteReview`; super_admin-only role grants.
11. Add Sentry (server + both frontends) and an uptime check on `/health`.

## Phase 2 — PRODUCTION QA (est. 2–3 days, humans required)
Run the entire §18 manual list. Non-negotiables: live ₹1 Razorpay matrix incl. browser-closed path and refund; email deliverability to Gmail; Safari/iOS session persistence; full COD + prepaid order lifecycle via admin; mobile checkout on real devices; restore-from-backup drill.

## Phase 3 — LAUNCH
Freeze main → confirm CI green → verify Render env (live keys, GSTIN, admin password) → seed/publish catalog → Lighthouse pass → announce → watch Sentry/logs for 48 h with the recovery job's "needs reconciliation" warnings treated as pages.

## Phase 4 — POST-LAUNCH
§20 in this order: (1) queue/job externalization + reconciliation, (2) Shiprocket UI + real test, (3) admin gaps (uploads, categories, reviews, pagination), (4) guest checkout, (5) dynamic sitemap + prerender, (6) abandoned-cart + review-request emails, (7) money-path unit tests + lint gate, (8) caching/CDN + always-on.

---

# CTO VERDICT

1. **Is this project production-ready?** **No.** It is *deployment*-ready (and deployed) but not *launch*-ready: empty catalog, dead apex domain, a cart-corrupting bug, no email, and fake customer-facing pages.
2. **Can it safely accept real customer payments?** **Not yet.** The cryptography and idempotency are right, but until the webhook secret is confirmed, the verify/webhook race is closed, and reconciliation-before-cancel exists, there are real paths to "customer charged, order cancelled" and "stock decremented twice". These are ~1 day of combined work plus a live test matrix.
3. **Can it safely process orders?** COD: **yes** (reserve→commit→rollback is well built and CI-tested) — once the cart bug is fixed. Prepaid: only after the payment fixes above.
4. **Can it safely handle inventory?** **Yes at the product level** — reservation is atomic and race-safe, the best-engineered part of the system. Variant-level stock is decorative; orderNumber collisions will abort occasional checkouts until fixed.
5. **Is the admin panel production-ready?** **Partially.** For a single `admin`-role operator: products, orders (list+status+refund), customers, coupons, content, dashboards all work. It is not ready for a team (role 403s, escalation hole) and can't do shipping, image uploads, categories or review moderation.
6. **Is email production-ready?** **No — 1/10.** Nothing sends. This alone breaks account recovery and all customer communication.
7. **Is shipping production-ready?** **No.** Good API client, zero reachable workflow, payload bugs, never tested. Manual Shiprocket-dashboard shipping is the interim path.
8. **Is monitoring sufficient?** **No.** There is none: no error tracker, no uptime alerting, no log drain. A payments failure would currently be discovered by a customer complaint.
9. **What are the exact blockers?** The nine items in §19: cart matching, email transport, empty DB + demo fallback, apex DNS, webhook secret/registration, markOrderPaid race, fake Track-Order/Contact, orderNumber collisions, payment-retry dead end.
10. **What should we do NEXT, in priority order?** (1) cart fix — 15 minutes, do it today; (2) webhook secret + dashboard registration; (3) markOrderPaid atomicity; (4) email transport + resend-OTP; (5) orderNumber fix; (6) kill fake pages + demo fallback; (7) apex DNS; (8) retry-payment UI; (9) load the real catalog; (10) Sentry + uptime; then run the Phase-2 live test matrix and launch.

**Bottom line:** this is a strong codebase about one focused week away from a defensible soft launch — but today, with an empty catalog, no email, a broken cart and unverified payment webhooks, putting real money through it would be irresponsible. Fix the nine blockers, run the live matrix, then ship.

---

*Every file:line reference in this report was read directly from the working tree at commit `b09c4a7`. Live checks were performed against production on 2026-08-18 (IST). Items marked NOT VERIFIED require dashboard access (Render, Vercel, Razorpay, Shiprocket, Atlas, Hostinger) that this audit did not have.*
