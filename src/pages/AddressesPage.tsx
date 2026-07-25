import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useCustomerAuth } from '@/context/CustomerAuthContext'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OrnamentalBorder } from '@/components/OrnamentalBorder'
import { Plus, PencilSimple, Trash, Star, AddressBook } from '@phosphor-icons/react'
import type { MailingAddressInput, ShopifyMailingAddress } from '@/lib/shopify/types'
import { toast } from 'sonner'

const EMPTY_ADDRESS: MailingAddressInput = {
  firstName: '',
  lastName: '',
  address1: '',
  address2: '',
  company: '',
  city: '',
  province: '',
  country: '',
  zip: '',
  phone: '',
}

export function AddressesPage() {
  const {
    customer,
    isAuthenticated,
    isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useCustomerAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<MailingAddressInput>(EMPTY_ADDRESS)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const startEdit = useCallback((address: ShopifyMailingAddress) => {
    setEditingId(address.id)
    setIsCreating(false)
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      address1: address.address1,
      address2: address.address2 ?? '',
      company: address.company ?? '',
      city: address.city,
      province: address.province,
      country: address.country,
      zip: address.zip,
      phone: address.phone,
    })
  }, [])

  const startCreate = useCallback(() => {
    setIsCreating(true)
    setEditingId(null)
    setFormData(EMPTY_ADDRESS)
  }, [])

  const cancelForm = useCallback(() => {
    setIsCreating(false)
    setEditingId(null)
    setFormData(EMPTY_ADDRESS)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting) return
      setIsSubmitting(true)
      try {
        if (editingId) {
          await updateAddress(editingId, formData)
          toast.success('Address updated')
        } else {
          await createAddress(formData)
          toast.success('Address added')
        }
        cancelForm()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save address.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [editingId, formData, createAddress, updateAddress, cancelForm, isSubmitting],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteAddress(id)
        toast.success('Address removed')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete address.')
      }
    },
    [deleteAddress],
  )

  const handleSetDefault = useCallback(
    async (id: string) => {
      try {
        await setDefaultAddress(id)
        toast.success('Default address updated')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to set default address.')
      }
    },
    [setDefaultAddress],
  )

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'oklch(0.60 0.11 78)', borderTopColor: 'transparent' }}
          />
          <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Loading...
          </span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !customer) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl tracking-widest mb-4">ACCOUNT REQUIRED</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to manage your addresses.
          </p>
          <Link to="/shop">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 tracking-widest">
              CONTINUE SHOPPING
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const addresses = customer.addresses.edges.map((e) => e.node)
  const defaultAddressId = customer.defaultAddress?.id
  const showForm = isCreating || !!editingId

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        <PageBreadcrumb items={[
          { label: 'Account', to: '/account' },
          { label: 'Addresses', to: '/account/addresses' },
        ]} className="mb-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl tracking-widest mb-2">ADDRESSES</h1>
            <p className="text-muted-foreground">
              Manage the shipping addresses saved to your account.
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={startCreate}
              className="bg-accent text-accent-foreground hover:bg-accent/90 tracking-widest shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" /> ADD ADDRESS
            </Button>
          )}
        </div>

        {showForm && (
          <OrnamentalBorder className="mb-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h2 className="text-lg tracking-widest mb-2">
                {editingId ? 'EDIT ADDRESS' : 'NEW ADDRESS'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-card/50 border-gold/30"
                />
                <Input
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-card/50 border-gold/30"
                />
              </div>
              <Input
                placeholder="Address line 1"
                value={formData.address1}
                onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                required
                className="bg-card/50 border-gold/30"
              />
              <Input
                placeholder="Address line 2 (optional)"
                value={formData.address2}
                onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                className="bg-card/50 border-gold/30"
              />
              <Input
                placeholder="Company (optional)"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="bg-card/50 border-gold/30"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="bg-card/50 border-gold/30"
                />
                <Input
                  placeholder="Province/State"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="bg-card/50 border-gold/30"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                  className="bg-card/50 border-gold/30"
                />
                <Input
                  placeholder="Postal/Zip code"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="bg-card/50 border-gold/30"
                />
              </div>
              <Input
                placeholder="Phone (optional)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-card/50 border-gold/30"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest"
                >
                  {isSubmitting ? 'SAVING...' : 'SAVE ADDRESS'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelForm}
                  className="border-gold/30 hover:bg-accent/10 tracking-widest"
                >
                  CANCEL
                </Button>
              </div>
            </form>
          </OrnamentalBorder>
        )}

        {addresses.length === 0 && !showForm ? (
          <div className="glass-panel p-12 golden-glow text-center">
            <AddressBook size={40} className="mx-auto mb-4 text-accent" weight="bold" />
            <p className="text-muted-foreground mb-6">You haven't added any addresses yet.</p>
            <Button
              onClick={startCreate}
              className="bg-accent text-accent-foreground hover:bg-accent/90 tracking-widest"
            >
              <Plus className="mr-2 h-4 w-4" /> ADD ADDRESS
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div key={address.id} className="glass-panel p-6 golden-glow">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-medium tracking-wide">
                    {address.firstName} {address.lastName}
                  </p>
                  {defaultAddressId === address.id && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                      <Star size={12} weight="fill" /> DEFAULT
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{address.address1}</p>
                {address.address2 && (
                  <p className="text-sm text-muted-foreground">{address.address2}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.province} {address.zip}
                </p>
                <p className="text-sm text-muted-foreground">{address.country}</p>
                {address.phone && (
                  <p className="text-sm text-muted-foreground mt-1">{address.phone}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(address)}
                    className="border-gold/30 hover:bg-accent/10 text-xs tracking-widest"
                  >
                    <PencilSimple className="mr-1 h-3 w-3" /> EDIT
                  </Button>
                  {defaultAddressId !== address.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      className="border-gold/30 hover:bg-accent/10 text-xs tracking-widest"
                    >
                      SET DEFAULT
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(address.id)}
                    className="text-destructive hover:bg-destructive/10 text-xs tracking-widest"
                  >
                    <Trash className="mr-1 h-3 w-3" /> DELETE
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
