// GraphQL documents for the Shopify Customer Account API, version 2026-10.
// Every field below was checked against https://shopify.dev/docs/api/customer/2026-10.
// Addresses write countryCode (a CountryCode enum) and zoneCode; territoryCode is deprecated.

const ADDRESS_FIELDS = `
  id
  firstName
  lastName
  company
  address1
  address2
  city
  zoneCode
  zip
  countryCode
  phoneNumber
  formatted
`

const MONEY = 'amount currencyCode'

const ORDER_SUMMARY_FIELDS = `
  id
  name
  number
  processedAt
  financialStatus
  fulfillmentStatus
  totalPrice { ${MONEY} }
`

const USER_ERRORS = 'userErrors { field message code }'

export const PROFILE_QUERY = `
  query CustomerProfile {
    customer {
      id
      firstName
      lastName
      displayName
      emailAddress { emailAddress marketingState }
      phoneNumber { phoneNumber }
      defaultAddress { ${ADDRESS_FIELDS} }
    }
  }
`

// Customer.orders accepts sortKey (OrderSortKeys) and reverse; newest first = PROCESSED_AT + reverse.
export const ORDERS_QUERY = `
  query CustomerOrders($first: Int!, $after: String) {
    customer {
      orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {
        nodes { ${ORDER_SUMMARY_FIELDS} }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`

export const ORDER_QUERY = `
  query CustomerOrder($id: ID!) {
    order(id: $id) {
      ${ORDER_SUMMARY_FIELDS}
      confirmationNumber
      cancelledAt
      statusPageUrl
      subtotal { ${MONEY} }
      totalShipping { ${MONEY} }
      totalTax { ${MONEY} }
      shippingAddress { ${ADDRESS_FIELDS} }
      billingAddress { ${ADDRESS_FIELDS} }
      lineItems(first: 50) {
        nodes {
          id
          name
          title
          variantTitle
          quantity
          image { url altText }
          price { ${MONEY} }
          totalPrice { ${MONEY} }
        }
      }
    }
  }
`

export const ADDRESSES_QUERY = `
  query CustomerAddresses {
    customer {
      defaultAddress { id }
      addresses(first: 50) {
        nodes { ${ADDRESS_FIELDS} }
      }
    }
  }
`

export const ADDRESS_CREATE_MUTATION = `
  mutation CustomerAddressCreate($address: CustomerAddressInput!, $defaultAddress: Boolean) {
    customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
      customerAddress { id }
      ${USER_ERRORS}
    }
  }
`

export const ADDRESS_UPDATE_MUTATION = `
  mutation CustomerAddressUpdate($addressId: ID!, $address: CustomerAddressInput, $defaultAddress: Boolean) {
    customerAddressUpdate(addressId: $addressId, address: $address, defaultAddress: $defaultAddress) {
      customerAddress { id }
      ${USER_ERRORS}
    }
  }
`

export const ADDRESS_DELETE_MUTATION = `
  mutation CustomerAddressDelete($addressId: ID!) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      ${USER_ERRORS}
    }
  }
`

export const CUSTOMER_UPDATE_MUTATION = `
  mutation CustomerUpdate($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer { id firstName lastName displayName }
      ${USER_ERRORS}
    }
  }
`

export const EMAIL_MARKETING_SUBSCRIBE_MUTATION = `
  mutation CustomerEmailMarketingSubscribe {
    customerEmailMarketingSubscribe {
      emailAddress { emailAddress marketingState }
      ${USER_ERRORS}
    }
  }
`

export const EMAIL_MARKETING_UNSUBSCRIBE_MUTATION = `
  mutation CustomerEmailMarketingUnsubscribe {
    customerEmailMarketingUnsubscribe {
      emailAddress { emailAddress marketingState }
      ${USER_ERRORS}
    }
  }
`
