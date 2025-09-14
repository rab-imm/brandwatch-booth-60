import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface Trial {
  id: string
  user_id: string
  trial_type: string
  trial_start_date: string
  trial_end_date: string
  trial_credits_allocated: number
  trial_credits_used: number
  trial_status: string
  conversion_completed: boolean
  conversion_target_tier?: string
  extension_count: number
  metadata: any
  profile?: {
    email: string
    full_name: string
  }
}

interface TrialStats {
  activeTrials: number
  convertedTrials: number
  expiredTrials: number
  conversionRate: number
  trialDistribution: Record<string, number>
}

export const TrialManagement = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [trials, setTrials] = useState<Trial[]>([])
  const [trialStats, setTrialStats] = useState<TrialStats | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null)
  const [actionType, setActionType] = useState("")
  const [actionData, setActionData] = useState<any>({})
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchTrialData()
  }, [filter])

  const fetchTrialData = async () => {
    try {
      setLoading(true)

      // Fetch trial statistics
      const { data: statsData, error: statsError } = await supabase.functions.invoke('trial-manager', {
        body: { action: 'get_trial_stats' }
      })

      if (statsError) throw statsError
      if (statsData?.stats) {
        setTrialStats(statsData.stats)
      }

      // Fetch trials
      let query = supabase
        .from('trial_management')
        .select(`
          *,
          profiles!trial_management_user_id_fkey (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('trial_status', filter)
      }

      const { data: trialsData, error: trialsError } = await query

      if (trialsError) throw trialsError
      setTrials(trialsData || [])

    } catch (error) {
      console.error('Error fetching trial data:', error)
      toast({
        title: "Error",
        description: "Failed to load trial data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTrialAction = (trial: Trial, action: string) => {
    setSelectedTrial(trial)
    setActionType(action)
    setActionData({})
    setShowActionDialog(true)
  }

  const executeTrialAction = async () => {
    if (!selectedTrial) return

    try {
      switch (actionType) {
        case 'extend':
          await extendTrial()
          break
        case 'convert':
          await convertTrial()
          break
        case 'create_new':
          await createNewTrial()
          break
        case 'expire':
          await expireTrial()
          break
        default:
          throw new Error('Unknown action type')
      }

      setShowActionDialog(false)
      await fetchTrialData()
      toast({
        title: "Success",
        description: "Action completed successfully"
      })

    } catch (error) {
      console.error('Error executing trial action:', error)
      toast({
        title: "Error",
        description: "Failed to execute action",
        variant: "destructive"
      })
    }
  }

  const extendTrial = async () => {
    const { error } = await supabase.functions.invoke('trial-manager', {
      body: {
        action: 'extend_trial',
        user_id: selectedTrial!.user_id,
        extension_days: parseInt(actionData.days || '7'),
        reason: actionData.reason || 'Admin extension'
      }
    })

    if (error) throw error
  }

  const convertTrial = async () => {
    const { error } = await supabase.functions.invoke('trial-manager', {
      body: {
        action: 'convert_trial',
        user_id: selectedTrial!.user_id,
        target_tier: actionData.tier,
        subscription_id: actionData.subscription_id || 'admin_conversion'
      }
    })

    if (error) throw error
  }

  const createNewTrial = async () => {
    const { error } = await supabase.functions.invoke('trial-manager', {
      body: {
        action: 'create_trial',
        user_id: actionData.user_id,
        trial_type: actionData.trial_type || 'standard',
        trial_credits: parseInt(actionData.credits || '50')
      }
    })

    if (error) throw error
  }

  const expireTrial = async () => {
    const { error } = await supabase
      .from('trial_management')
      .update({
        trial_status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedTrial!.id)

    if (error) throw error

    // Update user profile
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        subscription_status: 'trial_expired'
      })
      .eq('user_id', selectedTrial!.user_id)
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getUsagePercentage = (used: number, allocated: number) => {
    return allocated > 0 ? (used / allocated) * 100 : 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'extended': return 'bg-blue-500'
      case 'converted': return 'bg-purple-500'
      case 'expired': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="loader" className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading trial data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Trial Management</h2>
          <p className="text-muted-foreground">Monitor and optimize trial user conversions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleTrialAction({} as Trial, 'create_new')} variant="outline">
            <Icon name="plus" className="h-4 w-4 mr-2" />
            Create Trial
          </Button>
          <Button onClick={fetchTrialData} variant="outline">
            <Icon name="refresh-cw" className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {trialStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
              <Icon name="clock" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{trialStats.activeTrials}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Converted Trials</CardTitle>
              <Icon name="check-circle" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{trialStats.convertedTrials}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Icon name="trending-up" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{trialStats.conversionRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Trials</CardTitle>
              <Icon name="x-circle" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{trialStats.expiredTrials}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label htmlFor="filter">Filter by status:</Label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trials</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="extended">Extended</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trials List */}
      <div className="grid gap-4">
        {trials.map((trial) => {
          const daysRemaining = getDaysRemaining(trial.trial_end_date)
          const usagePercentage = getUsagePercentage(trial.trial_credits_used, trial.trial_credits_allocated)
          
          return (
            <Card key={trial.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {trial.profile?.full_name || trial.profile?.email || 'Unknown User'}
                    </CardTitle>
                    <CardDescription>{trial.profile?.email}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(trial.trial_status)}>
                        {trial.trial_status}
                      </Badge>
                      <Badge variant="outline">{trial.trial_type}</Badge>
                      {trial.extension_count > 0 && (
                        <Badge variant="secondary">Extended {trial.extension_count}x</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Started: {new Date(trial.trial_start_date).toLocaleDateString()}</p>
                    <p>Ends: {new Date(trial.trial_end_date).toLocaleDateString()}</p>
                    {trial.trial_status === 'active' && (
                      <p className={daysRemaining <= 3 ? 'text-destructive font-medium' : ''}>
                        {daysRemaining} days left
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Usage Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Credits Used</span>
                      <span>{trial.trial_credits_used} / {trial.trial_credits_allocated}</span>
                    </div>
                    <Progress value={usagePercentage} className="w-full" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {trial.trial_status === 'active' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTrialAction(trial, 'extend')}
                        >
                          <Icon name="clock" className="h-4 w-4 mr-1" />
                          Extend
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTrialAction(trial, 'convert')}
                        >
                          <Icon name="arrow-up" className="h-4 w-4 mr-1" />
                          Convert
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleTrialAction(trial, 'expire')}
                        >
                          <Icon name="x" className="h-4 w-4 mr-1" />
                          Expire
                        </Button>
                      </>
                    )}
                    
                    {trial.conversion_completed && trial.conversion_target_tier && (
                      <Badge variant="default">
                        Converted to {trial.conversion_target_tier}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {trials.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Icon name="users" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No trials found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'extend' && 'Extend Trial'}
              {actionType === 'convert' && 'Convert Trial'}
              {actionType === 'create_new' && 'Create New Trial'}
              {actionType === 'expire' && 'Expire Trial'}
            </DialogTitle>
            <DialogDescription>
              {selectedTrial?.profile?.email && `Customer: ${selectedTrial.profile.email}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'extend' && (
              <>
                <div>
                  <Label htmlFor="days">Extension Days</Label>
                  <Input
                    id="days"
                    type="number"
                    value={actionData.days || ''}
                    onChange={(e) => setActionData({...actionData, days: e.target.value})}
                    placeholder="7"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Extension Reason</Label>
                  <Textarea
                    id="reason"
                    value={actionData.reason || ''}
                    onChange={(e) => setActionData({...actionData, reason: e.target.value})}
                    placeholder="Reason for extension..."
                  />
                </div>
              </>
            )}

            {actionType === 'convert' && (
              <>
                <div>
                  <Label htmlFor="tier">Target Subscription Tier</Label>
                  <Select value={actionData.tier || ''} onValueChange={(value) => setActionData({...actionData, tier: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essential">Essential</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="sme">SME</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subscription_id">Subscription ID (Optional)</Label>
                  <Input
                    id="subscription_id"
                    value={actionData.subscription_id || ''}
                    onChange={(e) => setActionData({...actionData, subscription_id: e.target.value})}
                    placeholder="Stripe subscription ID"
                  />
                </div>
              </>
            )}

            {actionType === 'create_new' && (
              <>
                <div>
                  <Label htmlFor="user_id">User ID</Label>
                  <Input
                    id="user_id"
                    value={actionData.user_id || ''}
                    onChange={(e) => setActionData({...actionData, user_id: e.target.value})}
                    placeholder="User UUID"
                  />
                </div>
                <div>
                  <Label htmlFor="trial_type">Trial Type</Label>
                  <Select value={actionData.trial_type || ''} onValueChange={(value) => setActionData({...actionData, trial_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trial type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (14 days)</SelectItem>
                      <SelectItem value="extended">Extended (30 days)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (60 days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="credits">Trial Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    value={actionData.credits || ''}
                    onChange={(e) => setActionData({...actionData, credits: e.target.value})}
                    placeholder="50"
                  />
                </div>
              </>
            )}

            {actionType === 'expire' && (
              <p className="text-sm text-muted-foreground">
                This will immediately expire the trial and move the user to the free tier.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeTrialAction}>
              Execute Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}