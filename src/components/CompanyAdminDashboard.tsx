import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
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
        setCompany(userRole.companies as any)
        
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

      // Create a notification for the invited user (basic implementation)
      // In a real system, you'd send an email invitation
      toast.success(`Invitation sent to ${inviteDialog.email}`)
      
      setInviteDialog({
        open: false,
        email: '',
        role: 'individual',
        maxCredits: 50
      })
    } catch (error) {
      console.error('Error inviting user:', error)
      toast.error('Failed to send invitation')
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_company_roles')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', company!.id)

      if (error) throw error

      toast.success('User removed from company')
      fetchCompanyData()
    } catch (error) {
      console.error('Error removing user:', error)
      toast.error('Failed to remove user')
    }
  }

  const handleUpdateUserCredits = async (userRoleId: string, newMaxCredits: number) => {
    try {
      const { error } = await supabase
        .from('user_company_roles')
        .update({ max_credits_per_period: newMaxCredits })
        .eq('id', userRoleId)

      if (error) throw error

      toast.success('User credits updated')
      fetchCompanyData()
    } catch (error) {
      console.error('Error updating user credits:', error)
      toast.error('Failed to update user credits')
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Company Dashboard</h1>
          <p className="text-muted-foreground">Manage your company settings and team members</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Team Members</TabsTrigger>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                  <Icon name="zap" className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{company.total_credits}</div>
                  <p className="text-xs text-muted-foreground">
                    {company.used_credits} used this period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Icon name="users" className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{companyUsers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                  <Icon name="credit-card" className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{company.subscription_tier}</div>
                  <Badge variant={company.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {company.subscription_status}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits Reset</CardTitle>
                  <Icon name="calendar" className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {new Date(company.credits_reset_date).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Next reset date
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Credit Usage</CardTitle>
                <CardDescription>
                  Your company has used {company.used_credits} out of {company.total_credits} credits this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={creditUsagePercentage} className="w-full" />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>{company.used_credits} used</span>
                  <span>{company.total_credits - company.used_credits} remaining</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Team Members</h2>
              <Button onClick={() => setInviteDialog({ ...inviteDialog, open: true })}>
                <Icon name="plus" className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </div>

            <div className="grid gap-4">
              {companyUsers.map((companyUser) => (
                <Card key={companyUser.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {(companyUser.profile?.full_name || companyUser.profile?.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{companyUser.profile?.full_name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{companyUser.profile?.email}</p>
                        <Badge variant="outline" className="mt-1">
                          {companyUser.role}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {companyUser.used_credits} / {companyUser.max_credits_per_period}
                        </p>
                        <p className="text-xs text-muted-foreground">Credits used</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newCredits = prompt('Enter new credit limit:', companyUser.max_credits_per_period.toString())
                            if (newCredits && !isNaN(Number(newCredits))) {
                              handleUpdateUserCredits(companyUser.id, Number(newCredits))
                            }
                          }}
                        >
                          <Icon name="edit" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to remove this user from the company?')) {
                              handleRemoveUser(companyUser.user_id)
                            }
                          }}
                        >
                          <Icon name="trash-2" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <CompanyInviteManager />
              <div className="md:col-span-2">
                <CompanyUsageAnalytics company={company} companyUsers={companyUsers} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>
                  Manage your company information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={company.name}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-email">Company Email</Label>
                    <Input
                      id="company-email"
                      value={company.email}
                      disabled
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Contact support to modify company settings
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invite User Dialog */}
        <Dialog open={inviteDialog.open} onOpenChange={(open) => setInviteDialog({ ...inviteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to add a new member to your company
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteDialog.email}
                  onChange={(e) => setInviteDialog({ ...inviteDialog, email: e.target.value })}
                  placeholder="Enter email address"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteDialog.role}
                  onValueChange={(value) => setInviteDialog({ ...inviteDialog, role: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual User</SelectItem>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="invite-credits">Credit Limit</Label>
                <Input
                  id="invite-credits"
                  type="number"
                  value={inviteDialog.maxCredits}
                  onChange={(e) => setInviteDialog({ ...inviteDialog, maxCredits: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialog({ ...inviteDialog, open: false })}>
                Cancel
              </Button>
              <Button onClick={handleInviteUser}>
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}