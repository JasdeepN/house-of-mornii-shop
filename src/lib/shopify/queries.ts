// GraphQL query/mutation strings for Shopify Storefront API

// ─── Shared Fragments ────────────────────────────────────────────────────────

const IMAGE_FRAGMENT = `
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`

const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCardFields on Product {
    id
    handle
    title
    description
    availableForSale
    featuredImage { ...ImageFields }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    tags
    vendor
  }
  ${IMAGE_FRAGMENT}
`

const VARIANT_FRAGMENT = `
  fragment VariantFields on ProductVariant {
    id
    title
    availableForSale
    price { amount currencyCode }
    compareAtPrice { amount currencyCode }
    selectedOptions { name value }
    image { ...ImageFields }
  }
  ${IMAGE_FRAGMENT}
`

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              product {
                handle
                title
                featuredImage { ...ImageFields }
              }
              price { amount currencyCode }
              selectedOptions { name value }
              image { ...ImageFields }
            }
          }
          cost {
            totalAmount { amount currencyCode }
            amountPerQuantity { amount currencyCode }
          }
        }
      }
    }
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
      totalTaxAmount { amount currencyCode }
    }
  }
  ${IMAGE_FRAGMENT}
`

// ─── Collection Queries ──────────────────────────────────────────────────────

export const COLLECTIONS_QUERY = `
  query Collections {
    collections(first: 20) {
      edges {
        node {
          id
          handle
          title
          description
          image { ...ImageFields }
          products(first: 1) {
            edges { node { id } }
            pageInfo { hasNextPage }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
`

export const COLLECTION_BY_HANDLE_QUERY = `
  query CollectionByHandle($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image { ...ImageFields }
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node { ...ProductCardFields }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`

// ─── Product Queries ─────────────────────────────────────────────────────────

export const PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean, $query: String) {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
      edges {
        node { ...ProductCardFields }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      availableForSale
      featuredImage { ...ImageFields }
      images(first: 20) {
        edges { node { ...ImageFields } }
      }
      options { id name values }
      variants(first: 100) {
        edges { node { ...VariantFields } }
      }
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      tags
      vendor
      collections(first: 1) {
        edges {
          node {
            handle
            title
          }
        }
      }
    }
  }
  ${VARIANT_FRAGMENT}
`

// ─── Cart Mutations ──────────────────────────────────────────────────────────

export const CART_CREATE_MUTATION = `
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`

export const CART_QUERY = `
  query Cart($cartId: ID!) {
    cart(id: $cartId) { ...CartFields }
  }
  ${CART_FRAGMENT}
`

export const CART_LINES_ADD_MUTATION = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`

// ─── Customer Account Mutations & Queries ──────────────────────────────────────

export const CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION = `
  mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
        recoveryToken
      }
      customerUserErrors {
        field
        message
        code
      }
    }
  }
`

export const CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION = `
  mutation customerAccessTokenDelete($input: CustomerAccessTokenDeleteInput!) {
    customerAccessTokenDelete(input: $input) {
      deletedAccessToken
      deletedCustomerAccessReason
      userErrors { field message }
    }
  }
`

export const CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION = `
  mutation customerAccessTokenRenew($input: CustomerAccessTokenRenewInput!) {
    customerAccessTokenRenew(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
        recoveryToken
      }
      userErrors { field message }
    }
  }
`

export const CUSTOMER_CREATE_MUTATION = `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        firstName
        lastName
        email
        phone
        acceptsMarketing
      }
      customerUserErrors {
        field
        message
        code
      }
    }
  }
`

export const CUSTOMER_RECOVER_MUTATION = `
  mutation customerRecover($input: CustomerRecoverInput!) {
    customerRecover(input: $input) {
      userErrors { field message }
    }
  }
`

export const CUSTOMER_RESET_MUTATION = `
  mutation customerReset($input: CustomerResetInput!) {
    customerReset(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
        recoveryToken
      }
      userErrors { field message }
    }
  }
`

export const CUSTOMER_UPDATE_MUTATION = `
  mutation customerUpdate($customerAccessToken: String!, $input: CustomerUpdateInput!) {
    customerUpdate(input: $input, customerAccessToken: $customerAccessToken) {
      customer {
        id
        firstName
        lastName
        email
        phone
        acceptsMarketing
      }
      customerUserErrors {
        field
        message
        code
      }
    }
  }
`

// Cart mutations with authentication
export const CART_CREATE_WITH_AUTH_URL_MUTATION = `
  mutation cartCreateWithAuthUrl($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartFields }
      cartBuyerIdentity {
        authenticationUrl(returnTo: "/account")
      }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`

export const CART_MERGE_WITH_CUSTOMER_ACCESS_TOKEN_MUTATION = `
  mutation cartMergeWithCustomerAccessToken($cartId: ID!, $customerAccessToken: String!) {
    cartMergeWithBuyerIdentity(cartId: $cartId, buyerIdentity: { customerAccessToken: $customerAccessToken }) {
      cart { ...CartFields }
      mergedCart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`

// Customer queries
export const CUSTOMER_QUERY = `
  query Customer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      email
      phone
      acceptsMarketing
      addresses(first: 20) {
        edges {
          node {
            id
            firstName
            lastName
            address1
            city
            province
            country
            zip
            phone
          }
        }
      }
      orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            name
            orderNumber
            processedAt
            totalPrice { amount currencyCode }
            financialStatus
            fulfillmentStatus
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  originalPrice { amount currencyCode }
                  image { url altText width height }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`

export const CUSTOMER_BY_ACCESS_TOKEN_QUERY = `
  query CustomerByAccessToken($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      email
    }
  }
`
export const CART_LINES_UPDATE_MUTATION = `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`

export const CART_LINES_REMOVE_MUTATION = `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`
