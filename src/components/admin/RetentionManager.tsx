import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface RetentionCampaign {
  id: string
  name: string
  type: string
  status: string
  target_segment: string
  trigger_conditions: any
  created_at: string
  metrics: {
    sent: number
    opened: number
    clicked: number
    converted: number
  }
}

interface ChurnRiskCustomer {
  user_id: string
  email: string
  full_name: string
  risk_score: number
  predicted_churn_date: string
  last_activity: string
  subscription_tier: string
}

export const RetentionManager = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<RetentionCampaign[]>([])
  const [churnRiskCustomers, setChurnRiskCustomers] = useState<ChurnRiskCustomer[]>([])
  const [automationEnabled, setAutomationEnabled] = useState(false)

  useEffect(() => {
    fetchRetentionData()
  }, [])

  const fetchRetentionData = async () => {
    try {
      setLoading(true)

      // Fetch retention campaigns
      const { data: campaignsData, error: campaignsError } = await supabase.functions.invoke('customer-support-api', {
        body: { action: 'get_retention_campaigns' }
      })

      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError)
      } else if (campaignsData?.campaigns) {
        setCampaigns(campaignsData.campaigns)
      }

      // Fetch churn risk analysis
      const { data: churnData, error: churnError } = await supabase.functions.invoke('billing-analytics', {
        body: { type: 'churn_analysis' }
      })

      if (churnError) {
        console.error('Error fetching churn data:', churnError)
      } else if (churnData?.at_risk_customers) {
        setChurnRiskCustomers(churnData.at_risk_customers)
      }

      // Get automation settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('billing_alerts')
        .select('metadata')
        .eq('alert_type', 'automation_settings')
        .maybeSingle()

      if (!settingsError && settingsData?.metadata) {
        const metadata = settingsData.metadata as any
        if (metadata?.retention_automation?.enabled) {
          setAutomationEnabled(metadata.retention_automation.enabled)
        }
      }

    } catch (error) {
      console.error('Error fetching retention data:', error)
      toast({
        title: "Error",
        description: "Failed to load retention data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleAutomation = async (enabled: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('customer-support-api', {
        body: { 
          action: 'update_automation_settings',
          settings: { retention_automation: { enabled } }
        }
      })

      if (error) throw error

      setAutomationEnabled(enabled)
      toast({
        title: "Success",
        description: `Retention automation ${enabled ? 'enabled' : 'disabled'}`
      })

    } catch (error) {
      console.error('Error updating automation:', error)
      toast({
        title: "Error",
        description: "Failed to update automation settings",
        variant: "destructive"
      })
    }
  }

  const createCampaign = async (campaignType: string) => {
    try {
      const { error } = await supabase.functions.invoke('customer-support-api', {
        body: { 
          action: 'create_retention_campaign',
          campaign_type: campaignType
        }
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Retention campaign created successfully"
      })

      fetchRetentionData()

    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: "Error",
        description: "Failed to create retention campaign",
        variant: "destructive"
      })
    }
  }

  const sendPersonalizedOutreach = async (customerId: string) => {
    try {
      const { error } = await supabase.functions.invoke('customer-support-api', {
        body: { 
          action: 'send_personalized_outreach',
          customer_id: customerId
        }
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Personalized outreach sent successfully"
      })

    } catch (error) {
      console.error('Error sending outreach:', error)
      toast({
        title: "Error",
        description: "Failed to send personalized outreach",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="loader" className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading retention data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Customer Retention Management</h2>
          <p className="text-muted-foreground">Automated retention and growth strategies</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="automation-toggle">Automation</Label>
            <Switch
              id="automation-toggle"
              checked={automationEnabled}
              onCheckedChange={toggleAutomation}
            />
          </div>
          <Button onClick={fetchRetentionData} variant="outline">
            <Icon name="refresh-cw" className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="churn-risk" className="space-y-4">
        <TabsList>
          <TabsTrigger value="churn-risk">Churn Risk Analysis</TabsTrigger>
          <TabsTrigger value="campaigns">Retention Campaigns</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="insights">Growth Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="churn-risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High-Risk Customers</CardTitle>
              <CardDescription>Customers with high churn probability requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {churnRiskCustomers.map((customer) => (
                  <div key={customer.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{customer.full_name || customer.email}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                        <Badge variant={customer.risk_score > 80 ? 'destructive' : 'outline'}>
                          {customer.risk_score}% risk
                        </Badge>
                        <Badge variant="secondary">{customer.subscription_tier}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Predicted churn: {new Date(customer.predicted_churn_date).toLocaleDateString()}</p>
                        <p>Last activity: {new Date(customer.last_activity).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendPersonalizedOutreach(customer.user_id)}
                      >
                        <Icon name="mail" className="h-4 w-4 mr-2" />
                        Send Outreach
                      </Button>
                      <Button variant="outline" size="sm">
                        <Icon name="user" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {churnRiskCustomers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="shield-check" className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No high-risk customers identified</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Active Retention Campaigns</h3>
            <div className="space-x-2">
              <Button onClick={() => createCampaign('winback')} variant="outline" size="sm">
                Create Win-back Campaign
              </Button>
              <Button onClick={() => createCampaign('upgrade')} variant="outline" size="sm">
                Create Upgrade Campaign
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription>{campaign.type} • {campaign.target_segment}</CardDescription>
                    </div>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Sent</div>
                      <div className="text-2xl font-bold">{campaign.metrics.sent}</div>
                    </div>
                    <div>
                      <div className="font-medium">Opened</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {campaign.metrics.opened}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({campaign.metrics.sent > 0 ? Math.round((campaign.metrics.opened / campaign.metrics.sent) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Clicked</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {campaign.metrics.clicked}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({campaign.metrics.opened > 0 ? Math.round((campaign.metrics.clicked / campaign.metrics.opened) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Converted</div>
                      <div className="text-2xl font-bold text-green-600">
                        {campaign.metrics.converted}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({campaign.metrics.sent > 0 ? Math.round((campaign.metrics.converted / campaign.metrics.sent) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {campaigns.length === 0 && (
              <Card className="md:col-span-2">
                <CardContent className="text-center py-8">
                  <Icon name="megaphone" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active retention campaigns</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Retention Rules</CardTitle>
              <CardDescription>Configure automated responses to customer behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Churn Risk Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically identify customers at risk of churning
                    </p>
                  </div>
                  <Switch checked={automationEnabled} onCheckedChange={toggleAutomation} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Win-back Campaigns</h4>
                    <p className="text-sm text-muted-foreground">
                      Send automated win-back emails to cancelled customers
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Usage Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Alert customers when they're approaching usage limits
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Upgrade Recommendations</h4>
                    <p className="text-sm text-muted-foreground">
                      Suggest upgrades based on usage patterns
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Retention Rate</CardTitle>
                <CardDescription>30-day customer retention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">87.5%</div>
                <p className="text-xs text-muted-foreground">+2.3% vs last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Lifetime Value</CardTitle>
                <CardDescription>Customer LTV</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AED 2,450</div>
                <p className="text-xs text-muted-foreground">+12% vs last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Churn Rate</CardTitle>
                <CardDescription>Monthly churn rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">3.2%</div>
                <p className="text-xs text-muted-foreground">-0.8% vs last month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Growth Recommendations</CardTitle>
              <CardDescription>AI-powered suggestions to improve retention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Icon name="lightbulb" className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Implement usage-based upgrade prompts</p>
                    <p className="text-sm text-muted-foreground">
                      Customers who use 80%+ of their plan limits are 3x more likely to upgrade
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Icon name="trending-up" className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Launch onboarding improvement program</p>
                    <p className="text-sm text-muted-foreground">
                      Users who complete onboarding have 60% higher retention rates
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Icon name="heart" className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Create customer success check-ins</p>
                    <p className="text-sm text-muted-foreground">
                      Proactive outreach at day 7, 30, and 90 reduces churn by 25%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}