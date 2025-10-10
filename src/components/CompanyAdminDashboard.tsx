import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Icon } from "@/components/ui/Icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Header } from "@/components/Header"
import { CompanyUsageAnalytics } from "@/components/CompanyUsageAnalytics"
import { CompanyInviteManager } from "@/components/CompanyInviteManager"
import { CompanyInvitationList } from "@/components/CompanyInvitationList"
import { ChatProvider } from "@/contexts/ChatContext"
import { ChatInterface } from "@/components/ChatInterface"
import { ConversationSidebar } from "@/components/ConversationSidebar"
import { CompanyTeamConversations } from "@/components/CompanyTeamConversations"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { CompanySidebar } from "@/components/CompanySidebar"
import { CompanyDashboardOverview } from "@/components/CompanyDashboardOverview"
import { NotificationCenter } from "@/components/NotificationCenter"
import { LettersList } from "@/components/LettersList"
import { LetterDetail } from "@/components/LetterDetail"
import { CompanyTeamMembers } from "@/components/CompanyTeamMembers"
import { CompanySettings } from "@/components/CompanySettings"

interface CompanyData {
  id: string
  name: string
  email: string
  subscription_tier: string
  subscription_status: string
  total_credits: number
  used_credits: number
  credits_reset_date: string
  created_at: string
}

interface CompanyUser {
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

interface InviteDialogState {
  open: boolean
  email: string
  role: string
  maxCredits: number
}

export const CompanyAdminDashboard = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [activeSection, setActiveSection] = useState("dashboard")
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null)
  const [inviteDialog, setInviteDialog] = useState<InviteDialogState>({
    open: false,
    email: '',
    role: 'individual',
    maxCredits: 50
  })

  // Check if user has company_admin role
  const isCompanyAdmin = profile?.user_role === 'company_admin' || profile?.user_role === 'super_admin'

  useEffect(() => {
    if (user && isCompanyAdmin) {
      fetchCompanyData()
    }
  }, [user, isCompanyAdmin])

  const fetchCompanyData = async () => {
    try {
      setLoading(true)
      
      // Get user's company through user_company_roles
      const { data: userRole, error: roleError } = await supabase
        .from('user_company_roles')
        .select(`
          company_id,
          role,
          companies (
            id,
            name,
            email,
            subscription_tier,
            subscription_status,
            total_credits,
            used_credits,
            credits_reset_date,
            created_at
          )
        `)
        .eq('user_id', user!.id)
        .single()

      if (roleError) {
        console.error('Error fetching user role:', roleError)
        return
      }

      if (userRole?.companies) {
        setCompany(userRole.companies)
        
        // Fetch company users
        const { data: users, error: usersError } = await supabase
          .from('user_company_roles')
          .select(`
            id,
            user_id,
            role,
            used_credits,
            max_credits_per_period,
            credits_reset_date,
            profiles (
              full_name,
              email
            )
          `)
          .eq('company_id', userRole.companies.id)

        if (usersError) {
          console.error('Error fetching company users:', usersError)
        } else {
          setCompanyUsers(users || [])
        }
      }
    } catch (error) {
      console.error('Error fetching company data:', error)
      toast.error('Failed to load company data')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async () => {
    try {
      if (!company || !inviteDialog.email) return

      const { data, error } = await supabase.functions.invoke('send-company-invitation', {
        body: {
          email: inviteDialog.email,
          role: inviteDialog.role,
          maxCredits: inviteDialog.maxCredits,
          companyId: company.id,
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success(`Invitation sent to ${inviteDialog.email}`)
      
      setInviteDialog({
        open: false,
        email: '',
        role: 'individual',
        maxCredits: 50
      })
      
      fetchCompanyData()
    } catch (error: any) {
      console.error('Error inviting user:', error)
      toast.error(error.message || 'Failed to send invitation')
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      if (!company) return

      const { data, error } = await supabase.functions.invoke('remove-company-user', {
        body: {
          userId,
          companyId: company.id,
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      fetchCompanyData()
    } catch (error: any) {
      console.error('Error removing user:', error)
      toast.error(error.message || 'Failed to remove user')
    }
  }

  const handleUpdateUserCredits = async (userRoleId: string, userId: string, newMaxCredits: number) => {
    try {
      if (!company) return

      const { data, error } = await supabase.functions.invoke('update-user-credits', {
        body: {
          userRoleId,
          userId,
          companyId: company.id,
          newMaxCredits,
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      fetchCompanyData()
    } catch (error: any) {
      console.error('Error updating user credits:', error)
      toast.error(error.message || 'Failed to update user credits')
    }
  }

  if (!isCompanyAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You don't have permission to access the company admin dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center">
            <Icon name="loader" className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading company data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>No Company Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You are not associated with any company. Please contact your administrator.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const creditUsagePercentage = (company.used_credits / company.total_credits) * 100

  // Get current user's role from company_users
  const currentUserRole = companyUsers.find(u => u.user_id === user?.id)

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return currentUserRole && company ? (
          <CompanyDashboardOverview
            company={company}
            companyRole={currentUserRole}
            teamMemberCount={companyUsers.length}
            onNavigateToSection={setActiveSection}
          />
        ) : null

      case "chat":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Legal AI Assistant</CardTitle>
                <CardDescription>
                  Ask questions and get instant legal research assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Company Credits</p>
                      <p className="text-xs text-muted-foreground">
                        {company.used_credits} / {company.total_credits} used
                      </p>
                    </div>
                    <Progress 
                      value={(company.used_credits / company.total_credits) * 100} 
                      className="w-32 h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex h-[600px] border rounded-lg overflow-hidden">
              <ConversationSidebar />
              <div className="flex-1">
                <ChatInterface />
              </div>
            </div>
          </div>
        )

      case "members":
        return company ? <CompanyTeamMembers companyId={company.id} /> : null

      case "analytics":
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <CompanyInviteManager />
              <CompanyInvitationList />
            </div>
            <CompanyUsageAnalytics company={company} companyUsers={companyUsers} />
          </div>
        )

      case "conversations":
        return <CompanyTeamConversations />
      
      case "letters":
        return selectedLetterId ? (
          <LetterDetail
            letterId={selectedLetterId}
            onBack={() => setSelectedLetterId(null)}
          />
        ) : (
          <LettersList
            onLetterClick={(id) => setSelectedLetterId(id)}
            onCreateClick={() => navigate('/letters/create')}
          />
        )
      
      case "settings":
        return company ? <CompanySettings companyId={company.id} /> : null
      
      default:
        return null
    }
  }

  return (
    <ChatProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <SidebarProvider>
          <div className="flex min-h-[calc(100vh-4rem)] w-full">
            <CompanySidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              companyName={company?.name || ""}
              isManager={false}
              isAdmin={true}
            />
            
            <main className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b p-4 flex items-center justify-between bg-card">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-2xl font-bold">Company Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">{company?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <NotificationCenter />
                </div>
              </div>

              <div className="p-6 overflow-auto flex-1">
                {renderSection()}
              </div>
            </main>
          </div>
        </SidebarProvider>

        {/* Invite User Dialog */}
        <Dialog open={inviteDialog.open} onOpenChange={(open) => setInviteDialog({ ...inviteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your company workspace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteDialog.email}
                  onChange={(e) => setInviteDialog({ ...inviteDialog, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteDialog.role}
                  onValueChange={(value) => setInviteDialog({ ...inviteDialog, role: value })}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_staff">Staff</SelectItem>
                    <SelectItem value="company_manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-credits">Monthly Credit Limit</Label>
                <Input
                  id="invite-credits"
                  type="number"
                  value={inviteDialog.maxCredits}
                  onChange={(e) => setInviteDialog({ ...inviteDialog, maxCredits: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialog({ ...inviteDialog, open: false })}>
                Cancel
              </Button>
              <Button onClick={handleInviteUser}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ChatProvider>
  )
}