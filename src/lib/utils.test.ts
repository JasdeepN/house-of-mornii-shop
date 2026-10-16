import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('returns an empty string for no arguments', () => {
      expect(cn()).toBe('')
    })

    it('returns a single class name', () => {
      expect(cn('foo')).toBe('foo')
    })

    it('concatenates multiple class names with spaces', () => {
      expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
    })

    it('filters out falsy values', () => {
      expect(cn('foo', false, 'bar', null, 'baz', undefined)).toBe('foo bar baz')
    })

    it('filters out empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar')
    })

    it('handles conditional class names', () => {
      const isActive = true
      const isDisabled = false
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active')
    })

    it('merges conflicting Tailwind classes (tailwind-merge behavior)', () => {
      // tailwind-merge should keep the last conflicting class
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })

    it('merges conflicting background classes', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })

    it('preserves non-conflicting classes', () => {
      expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
    })

    it('handles arrays of class names', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
    })

    it('handles nested arrays', () => {
      expect(cn(['foo', ['bar', 'baz']], 'qux')).toBe('foo bar baz qux')
    })

    it('handles objects with class names', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('handles mixed inputs', () => {
      expect(cn('base', { active: true, disabled: false }, ['extra', 'more'], 'final')).toBe(
        'base active extra more final',
      )
    })

    it('handles empty string input', () => {
      expect(cn('')).toBe('')
    })

    it('handles all falsy inputs', () => {
      expect(cn(false, null, undefined, 0, '')).toBe('')
    })

    it('handles numeric values', () => {
      expect(cn('foo', 0, 'bar')).toBe('foo bar')
    })

    it('preserves order of non-conflicting classes', () => {
      expect(cn('a', 'b', 'c', 'd')).toBe('a b c d')
    })

    it('dedupes duplicate Tailwind utilities (plain duplicate class names are kept)', () => {
      expect(cn('p-4', 'p-4', 'm-2')).toBe('p-4 m-2')
      expect(cn('foo', 'foo', 'bar')).toBe('foo foo bar')
    })
  })
})
