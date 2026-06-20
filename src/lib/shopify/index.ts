export { shopifyFetch, IS_CONFIGURED, STOREFRONT_MODE, StorefrontError, validateQueryMode } from './client'
export type { StorefrontMode, StorefrontErrorCategory } from './client'
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
  COLLECTION_BY_HANDLE_QUERY_TOKENLESS,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_BY_HANDLE_QUERY_TOKENLESS,
  PRODUCTS_QUERY,
  PRODUCTS_QUERY_TOKENLESS,
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
export { EnvironmentWarning } from '../../components/EnvironmentWarning'
export { ErrorBoundary } from '../../components/ErrorBoundary'
export {
  TOKEN_GATED_FIELDS,
  getRequiredModeForFields,
  hasTokenGatedFields,
} from './token-requirements'
export { getHealthStatus, type HealthStatus } from './health'
export { validateEnv } from './env-schema'
