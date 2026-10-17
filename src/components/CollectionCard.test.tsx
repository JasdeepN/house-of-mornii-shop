import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/utils'
import { CollectionCard } from './CollectionCard'
import { fixtureCollectionSummaries } from '@/test/fixtures/catalog-fixtures'

describe('CollectionCard', () => {
  it('renders the title and links to the Collection handle', () => {
    const [collection] = fixtureCollectionSummaries()
    renderWithRouter(<CollectionCard collection={collection} />)

    const link = screen.getByRole('link', { name: collection.title })
    expect(link).toHaveAttribute('href', `/collections/${collection.handle}`)
    expect(screen.getByText('Collection')).toBeInTheDocument()
  })
})
