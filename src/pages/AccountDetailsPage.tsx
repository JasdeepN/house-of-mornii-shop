import { useState, useCallback } from 'react'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { OrnamentalBorder, OrnamentalDivider } from '@/components/OrnamentalBorder'
import { useCustomerProfile, useUpdateName, useSetEmailMarketing, type CustomerProfile } from '@/lib/customer'
import { toast } from 'sonner'
import { AccountGate, LoadingState } from './account/AccountGate'

export function AccountDetailsPage() {
  return (
    <AccountGate signedOutMessage="Please sign in to manage your account details.">
      <AccountDetails />
    </AccountGate>
  )
}

function AccountDetails() {
  const { data: profile } = useCustomerProfile()
  if (!profile) return <LoadingState />
  return <DetailsForm profile={profile} />
}

function DetailsForm({ profile }: { profile: CustomerProfile }) {
  const updateName = useUpdateName()
  const setMarketing = useSetEmailMarketing()
  const [firstName, setFirstName] = useState(profile.firstName ?? '')
  const [lastName, setLastName] = useState(profile.lastName ?? '')
  const [subscribed, setSubscribed] = useState(profile.emailAddress?.marketingState === 'SUBSCRIBED')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const accountUrl = import.meta.env.VITE_SHOPIFY_ACCOUNT_URL as string | undefined

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting) return
      setIsSubmitting(true)
      try {
        await updateName.mutateAsync({ firstName, lastName })
        toast.success('Account details updated')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Update failed. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [updateName, firstName, lastName, isSubmitting],
  )

  const handleMarketing = useCallback(
    async (checked: boolean) => {
      const previous = subscribed
      setSubscribed(checked)
      try {
        await setMarketing.mutateAsync(checked)
        toast.success(checked ? 'Subscribed to emails' : 'Unsubscribed from emails')
      } catch (err) {
        setSubscribed(previous)
        toast.error(err instanceof Error ? err.message : 'Update failed. Please try again.')
      }
    },
    [setMarketing, subscribed],
  )

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6 lg:px-20 max-w-2xl">
        <PageBreadcrumb items={[
          { label: 'Account', to: '/account' },
          { label: 'Account Details', to: '/account/details' },
        ]} className="mb-10" />

        <h1 className="text-2xl tracking-widest mb-2">ACCOUNT DETAILS</h1>
        <p className="text-muted-foreground mb-8">Update your name and email preferences.</p>

        <OrnamentalBorder>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="firstName" className="text-xs tracking-widest uppercase text-muted-foreground">
                  First Name
                </label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-card/50 border-gold/30"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lastName" className="text-xs tracking-widest uppercase text-muted-foreground">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-card/50 border-gold/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold tracking-widest"
            >
              {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
            </Button>

            <OrnamentalDivider className="my-6" />

            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-widest uppercase text-muted-foreground">Email</span>
              <span>{profile.emailAddress?.emailAddress ?? 'Not set'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-widest uppercase text-muted-foreground">Phone</span>
              <span>{profile.phoneNumber?.phoneNumber ?? 'Not set'}</span>
            </div>
            {accountUrl && (
              <a
                href={`${accountUrl}/profile`}
                className="text-sm text-accent underline underline-offset-4 w-fit"
              >
                Change email or phone
              </a>
            )}

            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id="acceptsMarketing"
                checked={subscribed}
                disabled={setMarketing.isPending}
                onCheckedChange={(checked) => handleMarketing(checked === true)}
              />
              <label htmlFor="acceptsMarketing" className="text-sm text-muted-foreground">
                Email me about new collections and exclusive offers
              </label>
            </div>
          </form>
        </OrnamentalBorder>
      </div>
    </div>
  )
}
