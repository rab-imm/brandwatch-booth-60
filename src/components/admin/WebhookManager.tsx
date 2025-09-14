import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface WebhookEvent {
  id: string
  event_type: string
  status: string
  retry_count: number
  last_attempt: string
  data: any
  error_message?: string
}

interface WebhookConfig {
  id: string
  event_type: string
  enabled: boolean
  endpoint_url: string
  secret: string
}

export const WebhookManager = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([])
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookConfig[]>([])

  useEffect(() => {
    fetchWebhookData()
  }, [])

  const fetchWebhookData = async () => {
    try {
      setLoading(true)

      // For now, use mock data since webhook tables don't exist yet
      // In a real implementation, these would be actual database queries
      const mockEvents: WebhookEvent[] = [
        {
          id: '1',
          event_type: 'subscription.created',
          status: 'success',
          retry_count: 0,
          last_attempt: new Date().toISOString(),
          data: {}
        },
        {
          id: '2',
          event_type: 'payment.failed',
          status: 'failed',
          retry_count: 2,
          last_attempt: new Date().toISOString(),
          data: {},
          error_message: 'Connection timeout'
        }
      ]

      const mockConfigs: WebhookConfig[] = [
        {
          id: '1',
          event_type: 'subscription.created',
          enabled: true,
          endpoint_url: 'https://api.example.com/webhooks/subscription',
          secret: 'wh_sec_***'
        },
        {
          id: '2',
          event_type: 'payment.failed',
          enabled: true,
          endpoint_url: 'https://api.example.com/webhooks/payment',
          secret: 'wh_sec_***'
        }
      ]

      setWebhookEvents(mockEvents)
      setWebhookConfigs(mockConfigs)

    } catch (error) {
      console.error('Error fetching webhook data:', error)
      toast({
        title: "Error",
        description: "Failed to load webhook data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleWebhook = async (configId: string, enabled: boolean) => {
    try {
      // Mock implementation - in real app this would update the database
      setWebhookConfigs(configs => 
        configs.map(config => 
          config.id === configId ? { ...config, enabled } : config
        )
      )

      toast({
        title: "Success",
        description: `Webhook ${enabled ? 'enabled' : 'disabled'} successfully`
      })

    } catch (error) {
      console.error('Error updating webhook:', error)
      toast({
        title: "Error",
        description: "Failed to update webhook configuration",
        variant: "destructive"
      })
    }
  }

  const retryWebhook = async (eventId: string) => {
    try {
      const { error } = await supabase.functions.invoke('billing-webhook-handler', {
        body: { action: 'retry', event_id: eventId }
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Webhook retry initiated"
      })

      fetchWebhookData()

    } catch (error) {
      console.error('Error retrying webhook:', error)
      toast({
        title: "Error",
        description: "Failed to retry webhook",
        variant: "destructive"
      })
    }
  }

  const testWebhook = async (configId: string) => {
    try {
      const { error } = await supabase.functions.invoke('billing-webhook-handler', {
        body: { action: 'test', config_id: configId }
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Test webhook sent successfully"
      })

    } catch (error) {
      console.error('Error testing webhook:', error)
      toast({
        title: "Error",
        description: "Failed to send test webhook",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="loader" className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading webhook data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Webhook Management</h2>
          <p className="text-muted-foreground">Monitor and configure webhook events</p>
        </div>
        <Button onClick={fetchWebhookData} variant="outline">
          <Icon name="refresh-cw" className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Webhook Configurations */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configurations</CardTitle>
            <CardDescription>Manage webhook endpoints and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {webhookConfigs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{config.event_type}</h4>
                    <p className="text-sm text-muted-foreground">{config.endpoint_url}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`webhook-${config.id}`} className="text-sm">
                      {config.enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id={`webhook-${config.id}`}
                      checked={config.enabled}
                      onCheckedChange={(enabled) => toggleWebhook(config.id, enabled)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(config.id)}
                    >
                      Test
                    </Button>
                  </div>
                </div>
              ))}
              {webhookConfigs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="webhook" className="h-12 w-12 mx-auto mb-4" />
                  <p>No webhook configurations found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Webhook Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Webhook Events</CardTitle>
            <CardDescription>Monitor webhook delivery status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {webhookEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm">{event.event_type}</h4>
                      <Badge 
                        variant={
                          event.status === 'success' ? 'default' : 
                          event.status === 'failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.last_attempt).toLocaleString()}
                    </p>
                    {event.retry_count > 0 && (
                      <p className="text-xs text-orange-600">
                        Retried {event.retry_count} times
                      </p>
                    )}
                    {event.error_message && (
                      <p className="text-xs text-red-600 mt-1">
                        {event.error_message}
                      </p>
                    )}
                  </div>
                  {event.status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryWebhook(event.id)}
                    >
                      <Icon name="rotate-cw" className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              {webhookEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="clock" className="h-12 w-12 mx-auto mb-4" />
                  <p>No recent webhook events</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhook Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Statistics</CardTitle>
          <CardDescription>Performance metrics for webhook delivery</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {webhookEvents.filter(e => e.status === 'success').length}
              </div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {webhookEvents.filter(e => e.status === 'failed').length}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {webhookEvents.filter(e => e.retry_count > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Retried</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round((webhookEvents.filter(e => e.status === 'success').length / Math.max(webhookEvents.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}