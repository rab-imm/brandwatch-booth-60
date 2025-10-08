import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface InvitationData {
  email: string
  role: string
  company_id: string
  max_credits_per_period: number
  expires_at: string
  accepted_at: string | null
}

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        toast.error("Invalid invitation link")
        navigate("/auth")
        return
      }

      try {
        const { data, error } = await supabase
          .from("invitation_tokens")
          .select("*")
          .eq("token", token)
          .is("accepted_at", null)
          .single()

        if (error || !data) {
          toast.error("Invalid or expired invitation")
          navigate("/auth")
          return
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          toast.error("This invitation has expired")
          navigate("/auth")
          return
        }

        setInvitation(data)
      } catch (error) {
        console.error("Error fetching invitation:", error)
        toast.error("Failed to load invitation")
        navigate("/auth")
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [token, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase.functions.invoke('accept-company-invitation', {
        body: {
          token,
          password: formData.password,
          fullName: formData.fullName,
        }
      })

      if (error) throw error

      if (data.error) {
        throw new Error(data.error)
      }

      toast.success("Account created successfully! Please sign in.")
      navigate("/auth")
    } catch (error: any) {
      console.error("Error accepting invitation:", error)
      toast.error(error.message || "Failed to create account")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading invitation...</div>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Company Invitation</CardTitle>
          <CardDescription>
            You've been invited to join as a {invitation.role.replace('_', ' ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Choose a password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium mb-1">Your Credits</p>
              <p className="text-muted-foreground">
                {invitation.max_credits_per_period} credits per month
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
