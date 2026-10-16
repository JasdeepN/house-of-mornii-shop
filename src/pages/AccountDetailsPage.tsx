import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCustomerAuth } from '@/context/CustomerAuthContext'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { OrnamentalBorder, OrnamentalDivider } from '@/components/OrnamentalBorder'
import { LockKey } from '@phosphor-icons/react'
import { toast } from 'sonner'

export function AccountDetailsPage() {
  const { customer, isAuthenticated, isLoading, updateProfile } = useCustomerAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    acceptsMarketing: false,
  })
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName ?? '',
        lastName: customer.lastName ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        acceptsMarketing: customer.acceptsMarketing ?? false,
      })
    }
  }, [customer])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting) return
      setIsSubmitting(true)
      try {
        await updateProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          acceptsMarketing: formData.acceptsMarketing,
          ...(password ? { password } : {}),
        })
        setPassword('')
        toast.success('Account details updated')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Update failed. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [updateProfile, formData, password, isSubmitting],
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
            Please sign in to manage your account details.
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

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6 lg:px-20 max-w-2xl">
        <PageBreadcrumb items={[
          { label: 'Account', to: '/account' },
          { label: 'Account Details', to: '/account/details' },
        ]} className="mb-10" />

        <h1 className="text-2xl tracking-widest mb-2">ACCOUNT DETAILS</h1>
        <p className="text-muted-foreground mb-8">
          Update your personal information and manage your login credentials.
        </p>

        <OrnamentalBorder>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="firstName" className="text-xs tracking-widest uppercase text-muted-foreground">
                  First Name
                </label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-card/50 border-gold/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lastName" className="text-xs tracking-widest uppercase text-muted-foreground">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-card/50 border-gold/30"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs tracking-widest uppercase text-muted-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-card/50 border-gold/30"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-xs tracking-widest uppercase text-muted-foreground">
                Phone
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 613 555 1111"
                className="bg-card/50 border-gold/30"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id="acceptsMarketing"
                checked={formData.acceptsMarketing}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, acceptsMarketing: checked === true })
                }
              />
              <label htmlFor="acceptsMarketing" className="text-sm text-muted-foreground">
                Email me about new collections and exclusive offers
              </label>
            </div>

            <OrnamentalDivider className="my-6" />

            <div className="flex items-center gap-2 mb-1">
              <LockKey size={18} className="text-accent" weight="bold" />
              <h2 className="text-sm tracking-widest uppercase text-foreground">
                Password
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="new-password" className="text-xs tracking-widest uppercase text-muted-foreground">
                New Password (optional)
              </label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                minLength={8}
                className="bg-card/50 border-gold/30"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters. Leave this field blank to keep your current password.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest"
            >
              {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
            </Button>
          </form>
        </OrnamentalBorder>
      </div>
    </div>
  )
}
