import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Invitation {
  id: string
  email: string
  role: string
  max_credits_per_period: number
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export function CompanyInvitationList() {
  const { profile } = useAuth()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvitations()
  }, [profile])

  const fetchInvitations = async () => {
    if (!profile?.current_company_id) return

    try {
      const { data, error } = await supabase
        .from("invitation_tokens")
        .select("*")
        .eq("company_id", profile.current_company_id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setInvitations(data || [])
    } catch (error) {
      console.error("Error fetching invitations:", error)
      toast.error("Failed to load invitations")
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(inviteUrl)
    toast.success("Invitation link copied!")
  }

  const revokeInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("invitation_tokens")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast.success("Invitation revoked")
      fetchInvitations()
    } catch (error) {
      console.error("Error revoking invitation:", error)
      toast.error("Failed to revoke invitation")
    }
  }

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.accepted_at) {
      return <Badge variant="default">Accepted</Badge>
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>
    }
    return <Badge variant="secondary">Pending</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Icon name="loader" className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>
          Manage sent invitations to join your company
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No invitations sent yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell className="capitalize">
                    {invitation.role.replace('_', ' ')}
                  </TableCell>
                  <TableCell>{invitation.max_credits_per_period}</TableCell>
                  <TableCell>{getStatusBadge(invitation)}</TableCell>
                  <TableCell>
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!invitation.accepted_at && new Date(invitation.expires_at) > new Date() && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyInviteLink(invitation.token)}
                            title="Copy invite link"
                          >
                            <Icon name="copy" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Revoke this invitation?')) {
                                revokeInvitation(invitation.id)
                              }
                            }}
                            title="Revoke invitation"
                          >
                            <Icon name="trash-2" className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
