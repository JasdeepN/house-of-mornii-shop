import { describe, it, expect } from 'vitest'
import {
  TOKEN_GATED_FIELDS,
  getRequiredModeForFields,
  hasTokenGatedFields,
  type TokenRequirement,
} from './token-requirements'

describe('token-requirements', () => {
  describe('TOKEN_GATED_FIELDS', () => {
    it('is an array of TokenRequirement objects', () => {
      expect(Array.isArray(TOKEN_GATED_FIELDS)).toBe(true)
      expect(TOKEN_GATED_FIELDS.length).toBeGreaterThan(0)

      for (const req of TOKEN_GATED_FIELDS) {
        expect(req).toHaveProperty('field')
        expect(req).toHaveProperty('requiredMode')
        expect(req).toHaveProperty('description')
        expect(req.requiredMode).toBe('token')
      }
    })

    it('includes tags as a token-gated field', () => {
      const tagsReq = TOKEN_GATED_FIELDS.find((r) => r.field === 'tags')
      expect(tagsReq).toBeDefined()
      expect(tagsReq?.requiredMode).toBe('token')
    })

    it('includes metafields as a token-gated field', () => {
      const metafieldsReq = TOKEN_GATED_FIELDS.find((r) => r.field === 'metafields')
      expect(metafieldsReq).toBeDefined()
      expect(metafieldsReq?.requiredMode).toBe('token')
    })

    it('includes customer as a token-gated field', () => {
      const customerReq = TOKEN_GATED_FIELDS.find((r) => r.field === 'customer')
      expect(customerReq).toBeDefined()
      expect(customerReq?.requiredMode).toBe('token')
    })

    it('includes customerAccessToken as a token-gated field', () => {
      const accessTokenReq = TOKEN_GATED_FIELDS.find((r) => r.field === 'customerAccessToken')
      expect(accessTokenReq).toBeDefined()
      expect(accessTokenReq?.requiredMode).toBe('token')
    })
  })

  describe('getRequiredModeForFields', () => {
    it('returns "tokenless" for an empty array', () => {
      expect(getRequiredModeForFields([])).toBe('tokenless')
    })

    it('returns "tokenless" when no fields are token-gated', () => {
      expect(getRequiredModeForFields(['id', 'title', 'handle'])).toBe('tokenless')
    })

    it('returns "token" when a token-gated field is present', () => {
      expect(getRequiredModeForFields(['id', 'tags'])).toBe('token')
    })

    it('returns "token" when metafields is present', () => {
      expect(getRequiredModeForFields(['metafields'])).toBe('token')
    })

    it('returns "token" when customer is present', () => {
      expect(getRequiredModeForFields(['customer'])).toBe('token')
    })

    it('returns "token" when customerAccessToken is present', () => {
      expect(getRequiredModeForFields(['customerAccessToken'])).toBe('token')
    })

    it('returns "token" when multiple token-gated fields are present', () => {
      expect(getRequiredModeForFields(['tags', 'metafields', 'customer'])).toBe('token')
    })

    it('returns "token" when only token-gated fields are present', () => {
      expect(getRequiredModeForFields(['tags', 'metafields'])).toBe('token')
    })

    it('returns "token" when token-gated field is mixed with non-gated fields', () => {
      expect(getRequiredModeForFields(['id', 'title', 'tags', 'vendor'])).toBe('token')
    })
  })

  describe('hasTokenGatedFields', () => {
    it('returns false for an empty string', () => {
      expect(hasTokenGatedFields('')).toBe(false)
    })

    it('returns false for a query without token-gated fields', () => {
      const query = 'query { products { id title handle } }'
      expect(hasTokenGatedFields(query)).toBe(false)
    })

    it('returns true when "tags" is in the query', () => {
      const query = 'query { products { id tags } }'
      expect(hasTokenGatedFields(query)).toBe(true)
    })

    it('returns true when "metafields" is in the query', () => {
      const query = 'query { products { id metafields { namespace key value } } }'
      expect(hasTokenGatedFields(query)).toBe(true)
    })

    it('returns true when "customerAccessToken" is in the query', () => {
      const query = 'mutation { customerAccessTokenCreate { customerAccessToken { accessToken } } }'
      expect(hasTokenGatedFields(query)).toBe(true)
    })

    it('returns true when multiple token-gated patterns are present', () => {
      const query = 'query { customer { tags metafields } }'
      expect(hasTokenGatedFields(query)).toBe(true)
    })

    it('returns false for a query that mentions "customer" but not "customerAccessToken"', () => {
      // "customer" alone is NOT in the patterns list — only "customerAccessToken" is
      const query = 'query { customer { id email } }'
      expect(hasTokenGatedFields(query)).toBe(false)
    })

    it('returns true when "tags" appears as a substring in a field name', () => {
      // The function uses .includes(), so "tags" in "productTags" would match
      const query = 'query { productTags }'
      expect(hasTokenGatedFields(query)).toBe(true)
    })
  })
})
