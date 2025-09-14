import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { CustomerDetailView } from "./CustomerDetailView"
import { PaymentFailureManager } from "./PaymentFailureManager"
import { TrialManagement } from "./TrialManagement"

interface BillingStats {
  totalRevenue: number
  activeSubscriptions: number
  activeTrials: number
  paymentFailures: number
  subscriptionDistribution: Record<string, number>
}

interface Customer {
  user_id: string
  email: string
  full_name: string
  subscription_tier: string
  subscription_status: string
  customer_risk_score: number
  payment_failure_count: number
  created_at: string
}

export const SuperAdminBillingDashboard = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [billingAlerts, setBillingAlerts] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [showCustomerDetail, setShowCustomerDetail] = useState(false)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      setLoading(true)

      // Fetch billing analytics
      const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('billing-analytics', {
        body: { type: 'overview' }
      })

      if (analyticsError) throw analyticsError
      if (analyticsData?.overview) {
        setBillingStats(analyticsData.overview)
      }

      // Fetch customer data
      const { data: customerData, error: customerError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, subscription_tier, subscription_status, customer_risk_score, payment_failure_count, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (customerError) {
        console.error('Error fetching customers:', customerError)
      } else {
        setCustomers(customerData || [])
      }

      // Fetch billing alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('billing_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (alertsError) {
        console.error('Error fetching alerts:', alertsError)
      } else {
        setBillingAlerts(alertsData || [])
      }

    } catch (error) {
      console.error('Error fetching billing data:', error)
      toast({
        title: "Error",
        description: "Failed to load billing data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="loader" className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading billing data...</span>
      </div>
    )
    }
  }

  if (showCustomerDetail && selectedCustomerId) {
    return (
      <CustomerDetailView
        customerId={selectedCustomerId}
        onClose={() => {
          setShowCustomerDetail(false)
          setSelectedCustomerId(null)
        }}
      />
    )

  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId)
    setShowCustomerDetail(true)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Billing & Revenue Management</h2>
          <p className="text-muted-foreground">Monitor revenue, subscriptions, and customer health</p>
        </div>
        <Button onClick={fetchBillingData} variant="outline">
          <Icon name="refresh-cw" className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Overview Stats */}
      {billingStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Icon name="dollar-sign" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">AED {billingStats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">This period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Icon name="users" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{billingStats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Paying customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
              <Icon name="clock" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{billingStats.activeTrials}</div>
              <p className="text-xs text-muted-foreground">Trial users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Issues</CardTitle>
              <Icon name="alert-triangle" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{billingStats.paymentFailures}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="payment-failures">Payment Failures</TabsTrigger>
          <TabsTrigger value="trials">Trial Management</TabsTrigger>
          <TabsTrigger value="alerts">Billing Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>Monitor customer subscriptions and payment health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div key={customer.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{customer.full_name || customer.email}</p>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                      <Badge variant={customer.subscription_status === 'active' ? 'default' : 'secondary'}>
                        {customer.subscription_tier}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {customer.customer_risk_score > 50 && (
                        <Badge variant="destructive">High Risk</Badge>
                      )}
                      {customer.payment_failure_count > 0 && (
                        <Badge variant="outline">{customer.payment_failure_count} failures</Badge>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleViewCustomer(customer.user_id)}>
                        <Icon name="external-link" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Alerts</CardTitle>
              <CardDescription>Payment failures and customer issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Icon 
                        name={alert.severity === 'high' ? 'alert-triangle' : alert.severity === 'critical' ? 'alert-circle' : 'info'} 
                        className={`h-5 w-5 mt-0.5 ${
                          alert.severity === 'high' ? 'text-orange-500' : 
                          alert.severity === 'critical' ? 'text-red-500' : 'text-blue-500'
                        }`} 
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
                {billingAlerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="check-circle" className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No active billing alerts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed financial reporting and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Icon name="bar-chart" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Advanced analytics dashboard coming soon</p>
                <Button className="mt-4" onClick={() => fetchBillingData()}>
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}