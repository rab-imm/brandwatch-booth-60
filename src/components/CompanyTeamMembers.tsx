import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Icon } from "@/components/ui/Icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

interface TeamMember {
  id: string
  user_id: string
  role: string
  used_credits: number
  max_credits_per_period: number
  credits_reset_date: string
  profile?: {
    full_name: string
    email: string
  }
}

interface CompanyTeamMembersProps {
  companyId: string
}

export function CompanyTeamMembers({ companyId }: CompanyTeamMembersProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'company_staff',
    maxCredits: 50
  })

  useEffect(() => {
    fetchTeamMembers()
  }, [companyId])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_company_roles')
        .select(`
          id,
          user_id,
          role,
          used_credits,
          max_credits_per_period,
          credits_reset_date,
          email
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Fetch profile data separately for each user
      const membersWithProfiles = await Promise.all(
        (data || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', member.user_id)
            .maybeSingle()
          
          return {
            ...member,
            profile: { 
              full_name: profile?.full_name || null,
              email: member.email
            }
          }
        })
      )
      
      setMembers(membersWithProfiles)
    } catch (error) {
      console.error('Error fetching team members:', error)
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-company-invitation', {
        body: {
          email: inviteForm.email,
          role: inviteForm.role,
          maxCredits: inviteForm.maxCredits,
          companyId: companyId,
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success(`Invitation sent to ${inviteForm.email}`)
      setInviteOpen(false)
      setInviteForm({ email: '', role: 'company_staff', maxCredits: 50 })
      fetchTeamMembers()
    } catch (error: any) {
      console.error('Error inviting user:', error)
      toast.error(error.message || 'Failed to send invitation')
    }
  }

  const handleUpdateCredits = async (member: TeamMember, newMaxCredits: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-user-credits', {
        body: {
          userRoleId: member.id,
          userId: member.user_id,
          companyId: companyId,
          newMaxCredits,
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success('Credits updated successfully')
      fetchTeamMembers()
      setEditingMember(null)
    } catch (error: any) {
      console.error('Error updating credits:', error)
      toast.error(error.message || 'Failed to update credits')
    }
  }

  const handleRemoveMember = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.profile?.full_name || member.profile?.email} from the company?`)) {
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('remove-company-user', {
        body: {
          userId: member.user_id,
          companyId: companyId,
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success('Member removed successfully')
      fetchTeamMembers()
    } catch (error: any) {
      console.error('Error removing member:', error)
      toast.error(error.message || 'Failed to remove member')
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'company_admin': return 'default'
      case 'company_manager': return 'secondary'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="loader" className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">Manage your team and their access</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icon name="user-plus" className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your company workspace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_staff">Staff</SelectItem>
                    <SelectItem value="company_manager">Manager</SelectItem>
                    <SelectItem value="company_admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Monthly Credit Limit</Label>
                <Input
                  id="credits"
                  type="number"
                  min="0"
                  value={inviteForm.maxCredits}
                  onChange={(e) => setInviteForm({ ...inviteForm, maxCredits: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {members.map((member) => {
          const creditPercentage = (member.used_credits / member.max_credits_per_period) * 100

          return (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-lg">
                        {(member.profile?.full_name || member.profile?.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {member.profile?.full_name || member.profile?.email || 'User (No Profile)'}
                          </h3>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {member.role.replace('company_', '')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.profile?.email || 'No email on file'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Credit Usage</span>
                          <span className="font-medium">
                            {member.used_credits} / {member.max_credits_per_period}
                          </span>
                        </div>
                        <Progress value={creditPercentage} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Resets: {new Date(member.credits_reset_date).toLocaleDateString()}</span>
                          <span>{Math.round(creditPercentage)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Icon name="edit" className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Credit Limit</DialogTitle>
                          <DialogDescription>
                            Change the monthly credit allocation for {member.profile?.full_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Current Limit</Label>
                            <Input
                              type="number"
                              min="0"
                              defaultValue={member.max_credits_per_period}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0
                                setEditingMember({ ...member, max_credits_per_period: value })
                              }}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingMember(null)}>
                            Cancel
                          </Button>
                          <Button onClick={() => editingMember && handleUpdateCredits(member, editingMember.max_credits_per_period)}>
                            Update
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveMember(member)}
                    >
                      <Icon name="trash-2" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {members.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Icon name="users" className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by inviting your first team member
              </p>
              <Button onClick={() => setInviteOpen(true)}>
                <Icon name="user-plus" className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}