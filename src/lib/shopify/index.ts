export { shopifyFetch, IS_CONFIGURED } from './client'
export { useCollections, useCollection, useProduct, useProducts, useRelatedProducts } from './hooks'
export {
  getDemoCollections,
  getDemoCollection,
  getDemoProduct,
  getDemoProducts,
} from './demo-data'
export {
  COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCTS_QUERY,
  CART_CREATE_MUTATION,
  CART_QUERY,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from './queries'
export {
  flattenEdges,
  formatMoney,
  type ShopifyProduct,
  type ShopifyProductVariant,
  type ShopifyCollection,
  type ShopifyCart,
  type ShopifyCartLine,
  type ShopifyImage,
  type ShopifyMoney,
} from './types'
