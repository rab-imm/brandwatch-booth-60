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

interface PaymentFailure {
  user_id: string
  email: string
  full_name: string
  payment_failure_count: number
  last_payment_failure: string
  customer_risk_score: number
  subscription_tier: string
  stripe_customer_id?: string
}

interface FailureAlert {
  id: string
  user_id: string
  title: string
  message: string
  severity: string
  created_at: string
  metadata: any
}

export const PaymentFailureManager = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [paymentFailures, setPaymentFailures] = useState<PaymentFailure[]>([])
  const [failureAlerts, setFailureAlerts] = useState<FailureAlert[]>([])
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<PaymentFailure | null>(null)
  const [actionType, setActionType] = useState("")
  const [actionData, setActionData] = useState<any>({})

  useEffect(() => {
    fetchPaymentFailures()
  }, [])

  const fetchPaymentFailures = async () => {
    try {
      setLoading(true)

      // Fetch customers with payment failures
      const { data: customers, error: customersError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, payment_failure_count, last_payment_failure, customer_risk_score, subscription_tier')
        .gt('payment_failure_count', 0)
        .order('customer_risk_score', { ascending: false })

      if (customersError) throw customersError

      // Fetch payment failure alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('billing_alerts')
        .select('*')
        .eq('alert_type', 'payment_failed')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (alertsError) throw alertsError

      setPaymentFailures(customers || [])
      setFailureAlerts(alerts || [])

    } catch (error) {
      console.error('Error fetching payment failures:', error)
      toast({
        title: "Error",
        description: "Failed to load payment failure data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFailureAction = (customer: PaymentFailure, action: string) => {
    setSelectedCustomer(customer)
    setActionType(action)
    setActionData({})
    setShowActionDialog(true)
  }

  const executeFailureAction = async () => {
    if (!selectedCustomer) return

    try {
      switch (actionType) {
        case 'retry_payment':
          await retryPayment()
          break
        case 'update_payment_method':
          await requestPaymentMethodUpdate()
          break
        case 'apply_grace_period':
          await applyGracePeriod()
          break
        case 'downgrade_subscription':
          await downgradeSubscription()
          break
        case 'send_reminder':
          await sendPaymentReminder()
          break
        case 'mark_resolved':
          await markFailureResolved()
          break
        default:
          throw new Error('Unknown action type')
      }

      setShowActionDialog(false)
      await fetchPaymentFailures()
      toast({
        title: "Success",
        description: "Action completed successfully"
      })

    } catch (error) {
      console.error('Error executing failure action:', error)
      toast({
        title: "Error",
        description: "Failed to execute action",
        variant: "destructive"
      })
    }
  }

  const retryPayment = async () => {
    // This would typically trigger Stripe to retry the payment
    // For now, we'll simulate by creating a billing transaction
    const { error } = await supabase
      .from('billing_transactions')
      .insert({
        user_id: selectedCustomer!.user_id,
        transaction_type: 'payment',
        amount_aed: parseFloat(actionData.amount || '0'),
        status: 'pending',
        description: 'Manual payment retry',
        metadata: {
          retry_reason: actionData.reason,
          admin_initiated: true
        }
      })

    if (error) throw error
  }

  const requestPaymentMethodUpdate = async () => {
    // Create a support ticket for payment method update
    const { error } = await supabase.functions.invoke('customer-support-api', {
      body: {
        action: 'create_ticket',
        user_id: selectedCustomer!.user_id,
        subject: 'Payment Method Update Required',
        description: `Please update your payment method. ${actionData.message || ''}`,
        category: 'billing',
        priority: 'high'
      }
    })

    if (error) throw error
  }

  const applyGracePeriod = async () => {
    const graceDays = parseInt(actionData.days || '7')
    const graceEndDate = new Date()
    graceEndDate.setDate(graceEndDate.getDate() + graceDays)

    // Update customer with grace period
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'grace_period',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', selectedCustomer!.user_id)

    if (error) throw error

    // Create billing alert for grace period
    await supabase
      .from('billing_alerts')
      .insert({
        user_id: selectedCustomer!.user_id,
        alert_type: 'payment_failed',
        severity: 'medium',
        title: `Grace Period Applied (${graceDays} days)`,
        message: `Customer has been given ${graceDays} days grace period`,
        metadata: {
          grace_end_date: graceEndDate.toISOString(),
          reason: actionData.reason
        }
      })
  }

  const downgradeSubscription = async () => {
    const newTier = actionData.tier || 'free'
    
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: newTier,
        subscription_status: 'active',
        payment_failure_count: 0,
        customer_risk_score: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', selectedCustomer!.user_id)

    if (error) throw error

    // Log subscription event
    await supabase
      .from('subscription_events')
      .insert({
        user_id: selectedCustomer!.user_id,
        event_type: 'downgraded',
        old_tier: selectedCustomer!.subscription_tier,
        new_tier: newTier,
        triggered_by: 'admin',
        notes: 'Downgraded due to payment failures'
      })
  }

  const sendPaymentReminder = async () => {
    // Create notification for customer
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: selectedCustomer!.user_id,
        title: 'Payment Required',
        message: actionData.message || 'Please update your payment method to continue service',
        type: 'payment_reminder',
        action_url: '/subscription'
      })

    if (error) throw error
  }

  const markFailureResolved = async () => {
    // Reset payment failure count
    const { error } = await supabase
      .from('profiles')
      .update({
        payment_failure_count: 0,
        last_payment_failure: null,
        customer_risk_score: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', selectedCustomer!.user_id)

    if (error) throw error

    // Mark related alerts as resolved
    await supabase
      .from('billing_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('user_id', selectedCustomer!.user_id)
      .eq('alert_type', 'payment_failed')
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-green-600'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      default: return 'text-blue-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="loader" className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading payment failure data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Payment Failure Management</h2>
          <p className="text-muted-foreground">Monitor and resolve customer payment issues</p>
        </div>
        <Button onClick={fetchPaymentFailures} variant="outline">
          <Icon name="refresh-cw" className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Customers with Failures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{paymentFailures.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">High Risk Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {paymentFailures.filter(c => c.customer_risk_score >= 70).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failureAlerts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Failures List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Failures</CardTitle>
          <CardDescription>Customers with payment issues requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentFailures.map((customer) => (
              <div key={customer.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">{customer.full_name || customer.email}</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{customer.subscription_tier}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Last failure: {new Date(customer.last_payment_failure).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {customer.payment_failure_count} failures
                    </p>
                    <p className={`text-sm ${getRiskColor(customer.customer_risk_score)}`}>
                      Risk: {customer.customer_risk_score}/100
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFailureAction(customer, 'retry_payment')}
                    >
                      <Icon name="refresh-cw" className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFailureAction(customer, 'send_reminder')}
                    >
                      <Icon name="mail" className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFailureAction(customer, 'apply_grace_period')}
                    >
                      <Icon name="clock" className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFailureAction(customer, 'mark_resolved')}
                    >
                      <Icon name="check" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {paymentFailures.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="check-circle" className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No payment failures to resolve</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Failure Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {failureAlerts.map((alert) => (
              <div key={alert.id} className="flex justify-between items-start p-3 border rounded">
                <div className="flex items-start space-x-3">
                  <Icon 
                    name="alert-triangle" 
                    className={`h-5 w-5 mt-0.5 ${getSeverityColor(alert.severity)}`}
                  />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={alert.severity === 'high' || alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {alert.severity}
                </Badge>
              </div>
            ))}

            {failureAlerts.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent alerts</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'retry_payment' && 'Retry Payment'}
              {actionType === 'update_payment_method' && 'Request Payment Method Update'}
              {actionType === 'apply_grace_period' && 'Apply Grace Period'}
              {actionType === 'downgrade_subscription' && 'Downgrade Subscription'}
              {actionType === 'send_reminder' && 'Send Payment Reminder'}
              {actionType === 'mark_resolved' && 'Mark as Resolved'}
            </DialogTitle>
            <DialogDescription>
              Customer: {selectedCustomer?.full_name || selectedCustomer?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'retry_payment' && (
              <>
                <div>
                  <Label htmlFor="amount">Payment Amount (AED)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={actionData.amount || ''}
                    onChange={(e) => setActionData({...actionData, amount: e.target.value})}
                    placeholder="50.00"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Retry Reason</Label>
                  <Textarea
                    id="reason"
                    value={actionData.reason || ''}
                    onChange={(e) => setActionData({...actionData, reason: e.target.value})}
                    placeholder="Reason for manual retry..."
                  />
                </div>
              </>
            )}

            {actionType === 'apply_grace_period' && (
              <>
                <div>
                  <Label htmlFor="days">Grace Period (Days)</Label>
                  <Input
                    id="days"
                    type="number"
                    value={actionData.days || ''}
                    onChange={(e) => setActionData({...actionData, days: e.target.value})}
                    placeholder="7"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={actionData.reason || ''}
                    onChange={(e) => setActionData({...actionData, reason: e.target.value})}
                    placeholder="Reason for grace period..."
                  />
                </div>
              </>
            )}

            {actionType === 'downgrade_subscription' && (
              <div>
                <Label htmlFor="tier">New Subscription Tier</Label>
                <Select value={actionData.tier || ''} onValueChange={(value) => setActionData({...actionData, tier: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="essential">Essential</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {actionType === 'send_reminder' && (
              <div>
                <Label htmlFor="message">Reminder Message</Label>
                <Textarea
                  id="message"
                  value={actionData.message || ''}
                  onChange={(e) => setActionData({...actionData, message: e.target.value})}
                  placeholder="Please update your payment method to continue service..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeFailureAction}>
              Execute Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}