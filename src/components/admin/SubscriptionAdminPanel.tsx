import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { Icon } from "@/components/ui/Icon"
import { toast } from "sonner"

interface UserSubscription {
  user_id: string
  email: string
  full_name: string
  subscription_tier: string
  queries_used: number
  created_at: string
}

export const SubscriptionAdminPanel = () => {
  const [users, setUsers] = useState<UserSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [tierFilter, setTierFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newTier, setNewTier] = useState("")
  const [creditAdjustment, setCreditAdjustment] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [tierFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('profiles')
        .select('user_id, email, full_name, subscription_tier, queries_used, created_at')
        .order('created_at', { ascending: false })

      if (tierFilter !== 'all') {
        query = query.eq('subscription_tier', tierFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTier = async () => {
    if (!selectedUser || !newTier) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: newTier })
        .eq('user_id', selectedUser.user_id)

      if (error) throw error

      // Log the change
      await supabase.rpc('log_activity', {
        p_user_id: selectedUser.user_id,
        p_action: 'admin_tier_change',
        p_resource_type: 'subscription',
        p_metadata: {
          old_tier: selectedUser.subscription_tier,
          new_tier: newTier,
          admin_action: true
        }
      })

      toast.success(`Updated ${selectedUser.email} to ${newTier} tier`)
      setIsEditDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error('Error updating tier:', error)
      toast.error("Failed to update subscription tier")
    }
  }

  const handleAdjustCredits = async () => {
    if (!selectedUser || !creditAdjustment) return

    const adjustment = parseInt(creditAdjustment)
    if (isNaN(adjustment)) {
      toast.error("Please enter a valid number")
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          queries_used: Math.max(0, selectedUser.queries_used + adjustment)
        })
        .eq('user_id', selectedUser.user_id)

      if (error) throw error

      // Log the transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUser.user_id,
          amount: -adjustment,
          transaction_type: 'admin_adjustment',
          description: `Admin credit adjustment: ${adjustment > 0 ? '+' : ''}${adjustment}`
        })

      toast.success(`Adjusted credits for ${selectedUser.email}`)
      setCreditAdjustment("")
      fetchUsers()
    } catch (error) {
      console.error('Error adjusting credits:', error)
      toast.error("Failed to adjust credits")
    }
  }

  const handleResetCredits = async (user: UserSubscription) => {
    try {
      const { error } = await supabase.rpc('reset_user_queries', {
        target_user_id: user.user_id
      })

      if (error) throw error

      toast.success(`Reset credits for ${user.email}`)
      fetchUsers()
    } catch (error) {
      console.error('Error resetting credits:', error)
      toast.error("Failed to reset credits")
    }
  }

  const getTierBadgeVariant = (tier: string) => {
    const variants: Record<string, any> = {
      free: 'secondary',
      essential: 'default',
      premium: 'default',
      essential_business: 'default',
      premium_business: 'default',
      enterprise: 'default'
    }
    return variants[tier] || 'secondary'
  }

  const getCreditLimit = (tier: string) => {
    const limits: Record<string, number> = {
      free: 10,
      essential: 100,
      premium: 500,
      essential_business: 1500,
      premium_business: 2500,
      enterprise: 10000
    }
    return limits[tier] || 10
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="users" className="h-5 w-5" />
            Subscription Management
          </CardTitle>
          <CardDescription>Manage user subscriptions, tiers, and credits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="essential">Essential</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="essential_business">Essential Business</SelectItem>
                <SelectItem value="premium_business">Premium Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchUsers} variant="outline">
              <Icon name="refresh" className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="loader" className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Credits Used</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Stripe</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const creditLimit = getCreditLimit(user.subscription_tier)
                  const usagePercent = (user.queries_used / creditLimit) * 100

                  return (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTierBadgeVariant(user.subscription_tier)}>
                          {user.subscription_tier.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={usagePercent > 80 ? 'text-destructive font-medium' : ''}>
                            {user.queries_used} / {creditLimit}
                          </span>
                          {usagePercent > 90 && (
                            <Icon name="alert-triangle" className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">N/A</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user)
                              setNewTier(user.subscription_tier)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Icon name="edit" className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetCredits(user)}
                          >
                            <Icon name="refresh" className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Subscription</DialogTitle>
            <DialogDescription>
              Update subscription tier and credits for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subscription Tier</Label>
              <Select value={newTier} onValueChange={setNewTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="essential">Essential</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="essential_business">Essential Business</SelectItem>
                  <SelectItem value="premium_business">Premium Business</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Adjust Credits</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter adjustment (+ or -)"
                  value={creditAdjustment}
                  onChange={(e) => setCreditAdjustment(e.target.value)}
                />
                <Button onClick={handleAdjustCredits}>Apply</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Current usage: {selectedUser?.queries_used} / {selectedUser && getCreditLimit(selectedUser.subscription_tier)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTier}>
              Update Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
