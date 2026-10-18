import { useState, useCallback, useMemo } from 'react'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { OrnamentalBorder } from '@/components/OrnamentalBorder'
import { Plus, PencilSimple, Trash, Star, AddressBook } from '@phosphor-icons/react'
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  type Address,
  type AddressInput,
} from '@/lib/customer'
import { toast } from 'sonner'
import { AccountGate } from './account/AccountGate'
import { getCountryOptions } from './account/countries'

interface FormState {
  firstName: string
  lastName: string
  address1: string
  address2: string
  company: string
  city: string
  zoneCode: string
  countryCode: string
  zip: string
  phoneNumber: string
  makeDefault: boolean
}

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  address1: '',
  address2: '',
  company: '',
  city: '',
  zoneCode: '',
  countryCode: '',
  zip: '',
  phoneNumber: '',
  makeDefault: false,
}

function toInput(f: FormState): AddressInput {
  return {
    firstName: f.firstName,
    lastName: f.lastName,
    address1: f.address1,
    address2: f.address2,
    company: f.company,
    city: f.city,
    zoneCode: f.zoneCode,
    countryCode: f.countryCode,
    zip: f.zip,
    phoneNumber: f.phoneNumber,
  }
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
function countryName(code: string | null): string {
  if (!code) return ''
  try {
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}

export function AddressesPage() {
  return (
    <AccountGate signedOutMessage="Please sign in to manage your addresses.">
      <AddressesContent />
    </AccountGate>
  )
}

function AddressesContent() {
  const { data } = useAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const countries = useMemo(() => getCountryOptions(), [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addresses = data?.addresses ?? []
  const defaultAddressId = data?.defaultAddressId ?? null

  const startEdit = useCallback(
    (address: Address) => {
      setEditingId(address.id)
      setIsCreating(false)
      setFormData({
        firstName: address.firstName ?? '',
        lastName: address.lastName ?? '',
        address1: address.address1 ?? '',
        address2: address.address2 ?? '',
        company: address.company ?? '',
        city: address.city ?? '',
        zoneCode: address.zoneCode ?? '',
        countryCode: address.countryCode ?? '',
        zip: address.zip ?? '',
        phoneNumber: address.phoneNumber ?? '',
        makeDefault: address.id === defaultAddressId,
      })
    },
    [defaultAddressId],
  )

  const startCreate = useCallback(() => {
    setIsCreating(true)
    setEditingId(null)
    setFormData(EMPTY_FORM)
  }, [])

  const cancelForm = useCallback(() => {
    setIsCreating(false)
    setEditingId(null)
    setFormData(EMPTY_FORM)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting) return
      setIsSubmitting(true)
      try {
        if (editingId) {
          await updateAddress.mutateAsync({
            id: editingId,
            address: toInput(formData),
            defaultAddress: formData.makeDefault,
          })
          toast.success('Address updated')
        } else {
          await createAddress.mutateAsync({ address: toInput(formData), defaultAddress: formData.makeDefault })
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
        await deleteAddress.mutateAsync(id)
        toast.success('Address removed')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete address.')
      }
    },
    [deleteAddress],
  )

  const showForm = isCreating || !!editingId

  return (
    <div className="min-h-screen pt-8 pb-16">
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
                  value={formData.zoneCode}
                  onChange={(e) => setFormData({ ...formData, zoneCode: e.target.value })}
                  className="bg-card/50 border-gold/30"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  aria-label="Country"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  required
                  className="h-9 w-full rounded-md border border-gold/30 bg-card/50 px-3 text-sm"
                >
                  <option value="">Country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Postal/Zip code"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="bg-card/50 border-gold/30"
                />
              </div>
              <Input
                placeholder="Phone (optional)"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="bg-card/50 border-gold/30"
              />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="makeDefault"
                  checked={formData.makeDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, makeDefault: checked === true })}
                />
                <label htmlFor="makeDefault" className="text-sm text-muted-foreground">
                  Make this my default address
                </label>
              </div>

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
                  {address.city}, {address.zoneCode} {address.zip}
                </p>
                <p className="text-sm text-muted-foreground">{countryName(address.countryCode)}</p>
                {address.phoneNumber && (
                  <p className="text-sm text-muted-foreground mt-1">{address.phoneNumber}</p>
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
