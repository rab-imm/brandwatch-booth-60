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

interface UserEditDialog {
  open: boolean
  user: User | null
}

export const UserManagement = () => {
  const { profile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [editDialog, setEditDialog] = useState<UserEditDialog>({ open: false, user: null })
  const [bulkAction, setBulkAction] = useState<string>("")

  useEffect(() => {
    if (profile?.user_role === 'super_admin') {
      fetchUsers()
    }
  }, [profile])

  useEffect(() => {
    setFilteredUsers(users)
  }, [users])

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

  const handleEditUser = async (updatedUser: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_role: updatedUser.user_role as "individual" | "company_admin" | "super_admin" | "company_manager" | "company_staff",
          subscription_tier: updatedUser.subscription_tier,
          subscription_status: updatedUser.subscription_status,
          max_credits_per_period: updatedUser.max_credits_per_period,
          full_name: updatedUser.full_name
        })
        .eq('user_id', updatedUser.user_id)

      if (error) throw error

      toast.success('User updated successfully')
      fetchUsers()
      setEditDialog({ open: false, user: null })
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
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
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Icon name="download" className="h-4 w-4 mr-2" />
            Export Users
          </Button>
          <Button>
            <Icon name="user-plus" className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

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
    </div>
  )
}