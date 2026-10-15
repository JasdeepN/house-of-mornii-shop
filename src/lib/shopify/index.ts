export { shopifyFetch, IS_CONFIGURED, STOREFRONT_MODE, StorefrontError, validateQueryMode } from './client'
export type { StorefrontMode, StorefrontErrorCategory } from './client'
export { adminProxyFetch } from './admin-proxy'
export { useCollections, useCollection, useProduct, useProducts, useRelatedProducts } from './hooks'
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
  CART_MERGE_WITH_CUSTOMER_ACCESS_TOKEN_MUTATION,
  CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
  CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION,
  CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION,
  CUSTOMER_CREATE_MUTATION,
  CUSTOMER_RECOVER_MUTATION,
  CUSTOMER_RESET_MUTATION,
  CUSTOMER_UPDATE_MUTATION,
  CUSTOMER_QUERY,
  CUSTOMER_ADDRESS_CREATE_MUTATION,
  CUSTOMER_ADDRESS_UPDATE_MUTATION,
  CUSTOMER_ADDRESS_DELETE_MUTATION,
  CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION,
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
export type {
  ShopifyCustomer,
  ShopifyCustomerAccessToken,
  ShopifyCustomerUserError,
  ShopifyMailingAddress,
  CustomerCreateInput,
  CustomerUpdateInput,
  MailingAddressInput,
} from './types'
export {
  TOKEN_GATED_FIELDS,
  getRequiredModeForFields,
  hasTokenGatedFields,
} from './token-requirements'
export { getHealthStatus, type HealthStatus } from './health'
export { validateEnv } from './env-schema'
