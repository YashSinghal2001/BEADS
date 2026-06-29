import { create } from 'zustand'
import { productApi } from '../api/product.api.js'
import { categoryApi } from '../api/category.api.js'

/* Module-level caches (don't belong in reactive state). */
const listCache = new Map() // key → { products, meta }
const inflight = new Map() // key → Promise (request dedupe)
const detailCache = new Map()

const keyOf = (params) =>
  Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')

export const useProductStore = create((set, get) => ({
  categories: [],
  categoriesLoaded: false,
  featured: [],

  async fetchCategories() {
    if (get().categoriesLoaded) return get().categories
    const categories = await categoryApi.list()
    set({ categories, categoriesLoaded: true })
    return categories
  },

  categoryName: (slug) => get().categories.find((c) => c.slug === slug)?.name || slug,

  /** Cached + deduped product list. Pass { force:true } to bypass cache. */
  async fetchProducts(params = {}, { force = false } = {}) {
    const key = keyOf(params)
    if (!force && listCache.has(key)) return listCache.get(key)
    if (inflight.has(key)) return inflight.get(key)

    const promise = productApi
      .list(params)
      .then((result) => {
        listCache.set(key, result)
        inflight.delete(key)
        return result
      })
      .catch((err) => {
        inflight.delete(key)
        throw err
      })
    inflight.set(key, promise)
    return promise
  },

  async fetchFeatured() {
    if (get().featured.length) return get().featured
    const { products } = await productApi.list({ limit: 12, sort: 'featured' })
    set({ featured: products })
    return products
  },

  async fetchProduct(slug, { force = false } = {}) {
    if (!force && detailCache.has(slug)) return detailCache.get(slug)
    const product = await productApi.getBySlug(slug)
    detailCache.set(slug, product)
    return product
  },

  fetchRelated: (slug) => productApi.related(slug),

  invalidate() {
    listCache.clear()
    detailCache.clear()
  },
}))

export default useProductStore
