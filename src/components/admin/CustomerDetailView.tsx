import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CustomerDetails {
  user_id: string
  email: string
  full_name: string
  subscription_tier: string
  subscription_status: string
  customer_risk_score: number
  payment_failure_count: number
  trial_start_date?: string
  trial_end_date?: string
  created_at: string
  billing_transactions?: any[]
  subscription_events?: any[]
  support_tickets?: any[]
}

interface CustomerDetailViewProps {
  customerId: string
  onClose: () => void
}

export const CustomerDetailView = ({ customerId, onClose }: CustomerDetailViewProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState("")
  const [actionData, setActionData] = useState<any>({})

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails()
    }
  }, [customerId])

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true)

      // Fetch customer profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', customerId)
        .single()

      if (profileError) throw profileError

      // Fetch billing transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('billing_transactions')
        .select('*')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
      }

      // Fetch subscription events
      const { data: events, error: eventsError } = await supabase
        .from('subscription_events')
        .select('*')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (eventsError) {
        console.error('Error fetching events:', eventsError)
      }

      // Fetch support tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('customer_support_tickets')
        .select('*')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError)
      }

      setCustomer({
        ...profile,
        billing_transactions: transactions || [],
        subscription_events: events || [],
        support_tickets: tickets || []
      })

    } catch (error) {
      console.error('Error fetching customer details:', error)
      toast({
        title: "Error",
        description: "Failed to load customer details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerAction = async (type: string) => {
    setActionType(type)
    setActionData({})
    setShowActionDialog(true)
  }

  const executeCustomerAction = async () => {
    try {
      switch (actionType) {
        case 'suspend':
          await suspendCustomer()
          break
        case 'extend_trial':
          await extendTrial()
          break
        case 'apply_credit':
          await applyCredit()
          break
        case 'create_ticket':
          await createSupportTicket()
          break
        case 'reset_failures':
          await resetPaymentFailures()
          break
        default:
          throw new Error('Unknown action type')
      }

      setShowActionDialog(false)
      await fetchCustomerDetails()
      toast({
        title: "Success",
        description: "Action completed successfully"
      })

    } catch (error) {
      console.error('Error executing action:', error)
      toast({
        title: "Error",
        description: "Failed to execute action",
        variant: "destructive"
      })
    }
  }

  const suspendCustomer = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', customerId)

    if (error) throw error
  }

  const extendTrial = async () => {
    const extensionDays = parseInt(actionData.days) || 7
    
    const { error } = await supabase.functions.invoke('trial-manager', {
      body: {
        action: 'extend_trial',
        user_id: customerId,
        extension_days: extensionDays,
        reason: actionData.reason || 'Admin extension'
      }
    })

    if (error) throw error
  }

  const applyCredit = async () => {
    const amount = parseFloat(actionData.amount) || 0
    
    const { error } = await supabase
      .from('billing_transactions')
      .insert({
        user_id: customerId,
        transaction_type: 'credit',
        amount_aed: amount,
        status: 'succeeded',
        description: actionData.description || 'Admin credit adjustment',
        processed_at: new Date().toISOString()
      })

    if (error) throw error
  }

  const createSupportTicket = async () => {
    const { error } = await supabase.functions.invoke('customer-support-api', {
      body: {
        action: 'create_ticket',
        user_id: customerId,
        subject: actionData.subject,
        description: actionData.description,
        category: actionData.category || 'admin',
        priority: actionData.priority || 'medium'
      }
    })

    if (error) throw error
  }

  const resetPaymentFailures = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        payment_failure_count: 0,
        last_payment_failure: null,
        customer_risk_score: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', customerId)

    if (error) throw error
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="loader" className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading customer details...</span>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{customer.full_name || customer.email}</h2>
          <p className="text-muted-foreground">{customer.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={customer.subscription_status === 'active' ? 'default' : 'secondary'}>
              {customer.subscription_tier}
            </Badge>
            {customer.customer_risk_score > 50 && (
              <Badge variant="destructive">High Risk ({customer.customer_risk_score})</Badge>
            )}
            {customer.payment_failure_count > 0 && (
              <Badge variant="outline">{customer.payment_failure_count} Payment Failures</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            <Icon name="x" className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleCustomerAction('extend_trial')}>
              <Icon name="clock" className="h-4 w-4 mr-2" />
              Extend Trial
            </Button>
            <Button variant="outline" onClick={() => handleCustomerAction('apply_credit')}>
              <Icon name="plus" className="h-4 w-4 mr-2" />
              Apply Credit
            </Button>
            <Button variant="outline" onClick={() => handleCustomerAction('create_ticket')}>
              <Icon name="message-circle" className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
            <Button variant="outline" onClick={() => handleCustomerAction('reset_failures')}>
              <Icon name="refresh-cw" className="h-4 w-4 mr-2" />
              Reset Failures
            </Button>
            <Button variant="destructive" onClick={() => handleCustomerAction('suspend')}>
              <Icon name="pause" className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
          <TabsTrigger value="events">Subscription Events</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Since:</span>
                  <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subscription:</span>
                  <span>{customer.subscription_tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span>{customer.subscription_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Score:</span>
                  <span className={customer.customer_risk_score > 50 ? 'text-destructive' : 'text-green-600'}>
                    {customer.customer_risk_score}/100
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage & Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Transactions:</span>
                  <span>{customer.billing_transactions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Support Tickets:</span>
                  <span>{customer.support_tickets?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Failures:</span>
                  <span className={customer.payment_failure_count > 0 ? 'text-destructive' : 'text-green-600'}>
                    {customer.payment_failure_count}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customer.billing_transactions?.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">AED {transaction.amount_aed}</p>
                      <Badge variant={transaction.status === 'succeeded' ? 'default' : 'destructive'}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!customer.billing_transactions || customer.billing_transactions.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">No billing transactions found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customer.subscription_events?.map((event) => (
                  <div key={event.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{event.event_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.old_tier && event.new_tier && `${event.old_tier} → ${event.new_tier}`}
                        {event.notes && ` • ${event.notes}`}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {(!customer.subscription_events || customer.subscription_events.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">No subscription events found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customer.support_tickets?.map((ticket) => (
                  <div key={ticket.id} className="flex justify-between items-start p-3 border rounded">
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">{ticket.category}</Badge>
                        <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {(!customer.support_tickets || customer.support_tickets.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">No support tickets found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'extend_trial' && 'Extend Trial'}
              {actionType === 'apply_credit' && 'Apply Credit'}
              {actionType === 'create_ticket' && 'Create Support Ticket'}
              {actionType === 'suspend' && 'Suspend Customer'}
              {actionType === 'reset_failures' && 'Reset Payment Failures'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'extend_trial' && 'Extend the customer\'s trial period'}
              {actionType === 'apply_credit' && 'Apply account credit to customer'}
              {actionType === 'create_ticket' && 'Create a support ticket for this customer'}
              {actionType === 'suspend' && 'Suspend customer account access'}
              {actionType === 'reset_failures' && 'Reset payment failure count and risk score'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'extend_trial' && (
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
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={actionData.reason || ''}
                    onChange={(e) => setActionData({...actionData, reason: e.target.value})}
                    placeholder="Reason for extension..."
                  />
                </div>
              </>
            )}

            {actionType === 'apply_credit' && (
              <>
                <div>
                  <Label htmlFor="amount">Credit Amount (AED)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={actionData.amount || ''}
                    onChange={(e) => setActionData({...actionData, amount: e.target.value})}
                    placeholder="50.00"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={actionData.description || ''}
                    onChange={(e) => setActionData({...actionData, description: e.target.value})}
                    placeholder="Reason for credit..."
                  />
                </div>
              </>
            )}

            {actionType === 'create_ticket' && (
              <>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={actionData.subject || ''}
                    onChange={(e) => setActionData({...actionData, subject: e.target.value})}
                    placeholder="Ticket subject..."
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={actionData.category || ''} onValueChange={(value) => setActionData({...actionData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={actionData.description || ''}
                    onChange={(e) => setActionData({...actionData, description: e.target.value})}
                    placeholder="Ticket description..."
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeCustomerAction}>
              Execute Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}