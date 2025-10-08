import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"

export function CompanyInviteManager() {
  const { profile } = useAuth()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("company_staff")
  const [maxCredits, setMaxCredits] = useState("50")
  const [inviteUrl, setInviteUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !role || !maxCredits) {
      toast.error("Please fill in all fields")
      return
    }

    if (!profile?.current_company_id) {
      toast.error("Company ID not found")
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase.functions.invoke('send-company-invitation', {
        body: {
          email,
          role,
          maxCredits: parseInt(maxCredits),
          companyId: profile.current_company_id,
        }
      })

      if (error) throw error

      if (data.error) {
        throw new Error(data.error)
      }

      setInviteUrl(data.invitation.inviteUrl)
      toast.success("Invitation created successfully!")
      
      // Reset form
      setEmail("")
      setRole("company_staff")
      setMaxCredits("50")
    } catch (error: any) {
      console.error("Error sending invitation:", error)
      toast.error(error.message || "Failed to send invitation")
    } finally {
      setSubmitting(false)
    }
  }

  const copyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl)
    toast.success("Invite link copied to clipboard!")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="user-plus" className="h-5 w-5" />
          Invite Company Users
        </CardTitle>
        <CardDescription>
          Send invitations to add users to your company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company_staff">Company Staff</SelectItem>
                <SelectItem value="company_manager">Company Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxCredits">Monthly Credits</Label>
            <Input
              id="maxCredits"
              type="number"
              min="1"
              max="10000"
              placeholder="50"
              value={maxCredits}
              onChange={(e) => setMaxCredits(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Number of credits this user can use per month
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating Invitation..." : "Create Invitation"}
          </Button>
        </form>

        {inviteUrl && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
            <Label>Invitation Link</Label>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyInviteUrl}
              >
                <Icon name="copy" className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with the invited user. It expires in 7 days.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
