import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icon } from "@/components/ui/Icon"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { AdminSearchFilter } from "./AdminSearchFilter"
import { EnhancedDataTable } from "./EnhancedDataTable"
import { BulkActionBar } from "./BulkActionBar"
import { AdminErrorBoundary } from "./AdminErrorBoundary"
import { 
  createUserSchema, 
  updateUserSchema, 
  createCompanySchema, 
  updateCompanySchema,
  type CreateUserData,
  type UpdateUserData,
  type CreateCompanyData,
  type UpdateCompanyData
} from "@/lib/admin-validation"
import { z } from "zod"

interface User {
  id: string
  user_id: string
  email: string
  full_name: string
  user_role: string
  subscription_tier: string
  subscription_status: string
  queries_used: number
  max_credits_per_period: number
  created_at: string
  current_company_id?: string
}

interface Company {
  id: string
  name: string
  email: string
  subscription_tier: string
  subscription_status: string
  total_credits: number
  used_credits: number
  created_at: string
}

interface UserEditDialog {
  open: boolean
  user: User | null
}

interface CreateUserDialog {
  open: boolean
}

interface CompanyDialog {
  open: boolean
  company: Company | null
  mode: 'create' | 'edit'
}

export const UserManagement = () => {
  const { profile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [editDialog, setEditDialog] = useState<UserEditDialog>({ open: false, user: null })
  const [createUserDialog, setCreateUserDialog] = useState<CreateUserDialog>({ open: false })
  const [companyDialog, setCompanyDialog] = useState<CompanyDialog>({ open: false, company: null, mode: 'create' })
  const [activeTab, setActiveTab] = useState('users')
  const [bulkAction, setBulkAction] = useState<string>("")
  
  // Form states for new user creation
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    user_role: 'individual' as const,
    subscription_tier: 'free',
    subscription_status: 'active',
    max_credits_per_period: 10,
    company_id: ''
  })
  
  // Form states for company creation/editing
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    subscription_tier: 'free',
    subscription_status: 'active',
    total_credits: 1000
  })

  useEffect(() => {
    if (profile?.user_role === 'super_admin') {
      fetchUsers()
      fetchCompanies()
    }
  }, [profile])

  useEffect(() => {
    setFilteredUsers(users)
  }, [users])

  useEffect(() => {
    setFilteredCompanies(companies)
  }, [companies])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
      toast.error('Failed to load companies')
    }
  }

  const handleUserFilter = (filters: Record<string, any>) => {
    let filtered = [...users]
    
    if (filters.search) {
      filtered = filtered.filter((user) => 
        user.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }
    
    if (filters.role) {
      filtered = filtered.filter((user) => user.user_role === filters.role)
    }
    
    if (filters.subscription_tier) {
      filtered = filtered.filter((user) => user.subscription_tier === filters.subscription_tier)
    }
    
    if (filters.subscription_status) {
      filtered = filtered.filter((user) => user.subscription_status === filters.subscription_status)
    }
    
    setFilteredUsers(filtered)
  }

  const handleCompanyFilter = (filters: Record<string, any>) => {
    let filtered = [...companies]
    
    if (filters.search) {
      filtered = filtered.filter((company) => 
        company.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        company.email?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }
    
    if (filters.subscription_tier) {
      filtered = filtered.filter((company) => company.subscription_tier === filters.subscription_tier)
    }
    
    if (filters.subscription_status) {
      filtered = filtered.filter((company) => company.subscription_status === filters.subscription_status)
    }
    
    setFilteredCompanies(filtered)
  }

  const handleEditUser = async (updatedUser: User) => {
    try {
      // Validate input
      const validatedData = updateUserSchema.parse({
        user_id: updatedUser.user_id,
        full_name: updatedUser.full_name,
        user_role: updatedUser.user_role,
        subscription_tier: updatedUser.subscription_tier,
        subscription_status: updatedUser.subscription_status,
        max_credits_per_period: updatedUser.max_credits_per_period
      });

      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'update_user', ...validatedData }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('User updated successfully')
      fetchUsers()
      setEditDialog({ open: false, user: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(`Validation error: ${error.issues[0].message}`)
      } else {
        console.error('Error updating user:', error)
        toast.error(`Failed to update user: ${error.message}`)
      }
    }
  }

  const handleCreateUser = async () => {
    try {
      // Validate input
      const userData = {
        email: newUser.email,
        full_name: newUser.full_name,
        user_role: newUser.user_role,
        subscription_tier: newUser.subscription_tier,
        max_credits_per_period: newUser.max_credits_per_period,
        company_id: newUser.company_id || undefined
      };
      const validatedData = createUserSchema.parse(userData);

      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'create_user', ...validatedData }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(`Function error: ${error.message}`);
      }
      
      if (data?.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      toast.success('User created successfully')
      fetchUsers()
      setCreateUserDialog({ open: false })
      setNewUser({
        email: '',
        full_name: '',
        password: '',
        user_role: 'individual',
        subscription_tier: 'free',
        subscription_status: 'active',
        max_credits_per_period: 10,
        company_id: ''
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(`Validation error: ${error.issues[0].message}`)
      } else {
        console.error('Error creating user:', error)
        const errorMessage = error.message || 'Unknown error occurred';
        if (errorMessage.includes('already been registered')) {
          toast.error('A user with this email already exists. Please use a different email address.');
        } else {
          toast.error(`Failed to create user: ${errorMessage}`);
        }
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'delete_user', user_id: userId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(`Failed to delete user: ${error.message}`)
    }
  }

  const handleCreateCompany = async () => {
    try {
      // Validate input
      const validatedData = createCompanySchema.parse({
        name: companyForm.name,
        email: companyForm.email,
        subscription_tier: companyForm.subscription_tier,
        total_credits: companyForm.total_credits
      });

      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'create_company', ...validatedData }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Company created successfully')
      fetchCompanies()
      setCompanyDialog({ open: false, company: null, mode: 'create' })
      setCompanyForm({
        name: '',
        email: '',
        subscription_tier: 'free',
        subscription_status: 'active',
        total_credits: 1000
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(`Validation error: ${error.issues[0].message}`)
      } else {
        console.error('Error creating company:', error)
        toast.error(`Failed to create company: ${error.message}`)
      }
    }
  }

  const handleEditCompany = async () => {
    if (!companyDialog.company) return

    try {
      // Validate input
      const validatedData = updateCompanySchema.parse({
        company_id: companyDialog.company.id,
        name: companyForm.name,
        email: companyForm.email,
        subscription_tier: companyForm.subscription_tier,
        subscription_status: companyForm.subscription_status,
        total_credits: companyForm.total_credits
      });

      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'update_company', ...validatedData }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Company updated successfully')
      fetchCompanies()
      setCompanyDialog({ open: false, company: null, mode: 'create' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(`Validation error: ${error.issues[0].message}`)
      } else {
        console.error('Error updating company:', error)
        toast.error(`Failed to update company: ${error.message}`)
      }
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This will affect all associated users.')) {
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'delete_company', company_id: companyId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Company deleted successfully')
      fetchCompanies()
    } catch (error) {
      console.error('Error deleting company:', error)
      toast.error(`Failed to delete company: ${error.message}`)
    }
  }

  const handlePauseCompany = async (companyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'pause_company', company_id: companyId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Company paused successfully')
      fetchCompanies()
    } catch (error) {
      console.error('Error pausing company:', error)
      toast.error(`Failed to pause company: ${error.message}`)
    }
  }

  const handleBulkSuspend = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_status: 'suspended' })
      .in('user_id', selectedUsers)

    if (error) throw error
    fetchUsers()
  }

  const handleBulkActivate = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_status: 'active' })
      .in('user_id', selectedUsers)

    if (error) throw error
    fetchUsers()
  }

  const handleBulkResetCredits = async () => {
    const { error } = await supabase
      .rpc('reset_user_queries')

    if (error) throw error
    fetchUsers()
  }

  const userColumns = [
    {
      key: 'user',
      label: 'User',
      sortable: true,
      render: (value: any, item: User) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {(item.full_name || item.email || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{item.full_name || 'No name'}</div>
            <div className="text-sm text-muted-foreground">{item.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'user_role',
      label: 'Role',
      render: (value: string) => (
        <Badge variant={
          value === 'super_admin' ? 'default' : 
          value === 'company_admin' ? 'secondary' : 'outline'
        }>
          {value.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'subscription_tier',
      label: 'Tier',
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      )
    },
    {
      key: 'subscription_status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={
          value === 'active' ? 'default' : 
          value === 'suspended' ? 'destructive' : 'secondary'
        }>
          {value}
        </Badge>
      )
    },
    {
      key: 'usage',
      label: 'Usage',
      render: (value: any, item: User) => (
        <div className="text-sm">
          <div>{item.queries_used} / {item.max_credits_per_period || 'Unlimited'}</div>
          <div className="text-muted-foreground">credits used</div>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, item: User) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditDialog({ open: true, user: item })}
          >
            <Icon name="edit" className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDeleteUser(item.user_id)}
          >
            <Icon name="trash" className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              // Log user activity or impersonate
              toast.info('User activity feature coming soon')
            }}
          >
            <Icon name="user" className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const companyColumns = [
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (value: any, item: Company) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="building" className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-muted-foreground">{item.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'subscription_tier',
      label: 'Tier',
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      )
    },
    {
      key: 'subscription_status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={
          value === 'active' ? 'default' : 
          value === 'suspended' ? 'destructive' : 'secondary'
        }>
          {value}
        </Badge>
      )
    },
    {
      key: 'credits',
      label: 'Credits',
      render: (value: any, item: Company) => (
        <div className="text-sm">
          <div>{item.used_credits} / {item.total_credits}</div>
          <div className="text-muted-foreground">used</div>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, item: Company) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setCompanyForm({
                name: item.name,
                email: item.email,
                subscription_tier: item.subscription_tier,
                subscription_status: item.subscription_status,
                total_credits: item.total_credits
              })
              setCompanyDialog({ open: true, company: item, mode: 'edit' })
            }}
          >
            <Icon name="edit" className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-orange-600 hover:text-orange-600"
            onClick={() => handlePauseCompany(item.id)}
          >
            <Icon name="pause" className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDeleteCompany(item.id)}
          >
            <Icon name="trash" className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const filterConfigs = [
    {
      key: 'role',
      label: 'Role',
      type: 'select' as const,
      options: [
        { value: 'individual', label: 'Individual' },
        { value: 'company_admin', label: 'Company Admin' },
        { value: 'super_admin', label: 'Super Admin' }
      ]
    },
    {
      key: 'subscription_tier',
      label: 'Subscription',
      type: 'select' as const,
      options: [
        { value: 'free', label: 'Free' },
        { value: 'essential', label: 'Essential' },
        { value: 'premium', label: 'Premium' },
        { value: 'sme', label: 'SME' }
      ]
    },
    {
      key: 'subscription_status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    }
  ]

  if (profile?.user_role !== 'super_admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You don't have permission to manage users.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User & Company Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, permissions, and companies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Icon name="download" className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          {activeTab === 'users' ? (
            <Button onClick={() => setCreateUserDialog({ open: true })}>
              <Icon name="user-plus" className="h-4 w-4 mr-2" />
              Create User
            </Button>
          ) : (
            <Button onClick={() => {
              setCompanyForm({
                name: '',
                email: '',
                subscription_tier: 'free',
                subscription_status: 'active',
                total_credits: 1000
              })
              setCompanyDialog({ open: true, company: null, mode: 'create' })
            }}>
              <Icon name="building" className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-6">
          {/* User Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Icon name="users" className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Icon name="user-check" className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.subscription_status === 'active').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Company Admins</CardTitle>
                <Icon name="shield" className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.user_role === 'company_admin').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                <Icon name="crown" className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.subscription_tier === 'premium').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <AdminSearchFilter
            onFilterChange={handleUserFilter}
            filterConfigs={filterConfigs}
          />

          {/* Users Table */}
          <EnhancedDataTable
            data={filteredUsers}
            columns={userColumns}
            onSelectionChange={setSelectedUsers}
            selectedItems={selectedUsers}
            loading={loading}
            emptyMessage="No users found"
            itemIdKey="user_id"
          />

          {/* Bulk Actions */}
          <BulkActionBar
            selectedItems={selectedUsers}
            onClearSelection={() => setSelectedUsers([])}
            itemType="users"
            onBulkApprove={handleBulkActivate}
            onBulkReject={handleBulkSuspend}
          />
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          {/* Company Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                <Icon name="building" className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companies.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
                <Icon name="check-circle" className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {companies.filter(c => c.subscription_status === 'active').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Premium Companies</CardTitle>
                <Icon name="star" className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {companies.filter(c => c.subscription_tier === 'premium').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                <Icon name="coins" className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {companies.reduce((sum, c) => sum + c.total_credits, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Companies Table */}
          <EnhancedDataTable
            data={filteredCompanies}
            columns={companyColumns}
            onSelectionChange={setSelectedCompanies}
            selectedItems={selectedCompanies}
            loading={loading}
            emptyMessage="No companies found"
            itemIdKey="id"
          />
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={createUserDialog.open} onOpenChange={(open) => setCreateUserDialog({ open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account with specified role and permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create_email">Email</Label>
                <Input
                  id="create_email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="create_full_name">Full Name</Label>
                <Input
                  id="create_full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="create_password">Password</Label>
              <Input
                id="create_password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create_role">User Role</Label>
                <Select
                  value={newUser.user_role}
                  onValueChange={(value: any) => setNewUser({ ...newUser, user_role: value, company_id: value === 'company_admin' ? newUser.company_id : '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                    <SelectItem value="company_manager">Company Manager</SelectItem>
                    <SelectItem value="company_staff">Company Staff</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create_tier">Subscription Tier</Label>
                <Select
                  value={newUser.subscription_tier}
                  onValueChange={(value) => setNewUser({ ...newUser, subscription_tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="essential">Essential</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="sme">SME</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {(newUser.user_role as string) === 'company_admin' && (
              <div>
                <Label htmlFor="create_company">Company *</Label>
                <Select
                  value={newUser.company_id}
                  onValueChange={(value) => setNewUser({ ...newUser, company_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="create_credits">Credit Limit</Label>
              <Input
                id="create_credits"
                type="number"
                value={newUser.max_credits_per_period}
                onChange={(e) => setNewUser({ ...newUser, max_credits_per_period: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, user: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information, role, and subscription details
            </DialogDescription>
          </DialogHeader>
          
          {editDialog.user && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editDialog.user.full_name || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        user: { ...editDialog.user!, full_name: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editDialog.user.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="subscription" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="subscription_tier">Subscription Tier</Label>
                    <Select
                      value={editDialog.user.subscription_tier}
                      onValueChange={(value) => setEditDialog({
                        ...editDialog,
                        user: { ...editDialog.user!, subscription_tier: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="essential">Essential</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="sme">SME</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subscription_status">Status</Label>
                    <Select
                      value={editDialog.user.subscription_status}
                      onValueChange={(value) => setEditDialog({
                        ...editDialog,
                        user: { ...editDialog.user!, subscription_status: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="max_credits">Credit Limit</Label>
                    <Input
                      id="max_credits"
                      type="number"
                      value={editDialog.user.max_credits_per_period || ''}
                      onChange={(e) => setEditDialog({
                        ...editDialog,
                        user: { ...editDialog.user!, max_credits_per_period: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="permissions" className="space-y-4">
                <div>
                  <Label htmlFor="user_role">User Role</Label>
                  <Select
                    value={editDialog.user.user_role}
                    onValueChange={(value) => setEditDialog({
                      ...editDialog,
                      user: { ...editDialog.user!, user_role: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company_admin">Company Admin</SelectItem>
                      <SelectItem value="company_manager">Company Manager</SelectItem>
                      <SelectItem value="company_staff">Company Staff</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button onClick={() => editDialog.user && handleEditUser(editDialog.user)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Company Dialog */}
      <Dialog open={companyDialog.open} onOpenChange={(open) => setCompanyDialog({ ...companyDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {companyDialog.mode === 'create' ? 'Create New Company' : 'Edit Company'}
            </DialogTitle>
            <DialogDescription>
              {companyDialog.mode === 'create' 
                ? 'Add a new company to the system'
                : 'Update company information and settings'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <Label htmlFor="company_email">Company Email</Label>
              <Input
                id="company_email"
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                placeholder="contact@acme.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_tier">Subscription Tier</Label>
                <Select
                  value={companyForm.subscription_tier}
                  onValueChange={(value) => setCompanyForm({ ...companyForm, subscription_tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="essential">Essential</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="sme">SME</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="company_status">Status</Label>
                <Select
                  value={companyForm.subscription_status}
                  onValueChange={(value) => setCompanyForm({ ...companyForm, subscription_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="company_credits">Total Credits</Label>
              <Input
                id="company_credits"
                type="number"
                value={companyForm.total_credits}
                onChange={(e) => setCompanyForm({ ...companyForm, total_credits: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyDialog({ ...companyDialog, open: false })}>
              Cancel
            </Button>
            <Button onClick={companyDialog.mode === 'create' ? handleCreateCompany : handleEditCompany}>
              {companyDialog.mode === 'create' ? 'Create Company' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function UserManagementWithErrorBoundary() {
  return (
    <AdminErrorBoundary>
      <UserManagement />
    </AdminErrorBoundary>
  )
}