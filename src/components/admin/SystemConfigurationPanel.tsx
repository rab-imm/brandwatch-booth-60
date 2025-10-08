import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { IconSettings, IconDeviceFloppy } from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const SystemConfigurationPanel = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [creditPricing, setCreditPricing] = useState<any>({})
  const [revenueSharing, setRevenueSharing] = useState<any>({})
  const [rolloverPolicy, setRolloverPolicy] = useState<any>({})

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const fetchConfigurations = async () => {
    const { data } = await supabase
      .from('system_config' as any)
      .select('*')
    
    data?.forEach((config: any) => {
      if (config.config_key === 'credit_pricing') {
        setCreditPricing(config.config_value)
      } else if (config.config_key === 'revenue_sharing') {
        setRevenueSharing(config.config_value)
      } else if (config.config_key === 'credit_rollover_policy') {
        setRolloverPolicy(config.config_value)
      }
    })
  }

  const saveConfiguration = async (configKey: string, configValue: any) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('system_config' as any)
        .update({ config_value: configValue, updated_at: new Date().toISOString() })
        .eq('config_key', configKey)

      if (error) throw error

      toast({
        title: "Configuration Saved",
        description: "System configuration has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSettings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Manage system-wide settings including credit pricing and revenue sharing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credits">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credits">Credit Pricing</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Sharing</TabsTrigger>
              <TabsTrigger value="rollover">Credit Rollover</TabsTrigger>
            </TabsList>

            <TabsContent value="credits" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="chat_query">Chat Query (credits)</Label>
                  <Input
                    id="chat_query"
                    type="number"
                    value={creditPricing.chat_query || 1}
                    onChange={(e) => setCreditPricing({ ...creditPricing, chat_query: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="letter_generation">Letter Generation (credits)</Label>
                  <Input
                    id="letter_generation"
                    type="number"
                    value={creditPricing.letter_generation || 5}
                    onChange={(e) => setCreditPricing({ ...creditPricing, letter_generation: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf_export">PDF Export (credits)</Label>
                  <Input
                    id="pdf_export"
                    type="number"
                    value={creditPricing.pdf_export || 1}
                    onChange={(e) => setCreditPricing({ ...creditPricing, pdf_export: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="digital_signature">Digital Signature (credits)</Label>
                  <Input
                    id="digital_signature"
                    type="number"
                    value={creditPricing.digital_signature || 3}
                    onChange={(e) => setCreditPricing({ ...creditPricing, digital_signature: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template_download_paid">Paid Template Download (credits)</Label>
                  <Input
                    id="template_download_paid"
                    type="number"
                    value={creditPricing.template_download_paid || 2}
                    onChange={(e) => setCreditPricing({ ...creditPricing, template_download_paid: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={() => saveConfiguration('credit_pricing', creditPricing)} disabled={loading}>
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                Save Credit Pricing
              </Button>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="creator_percentage">Creator Percentage (%)</Label>
                  <Input
                    id="creator_percentage"
                    type="number"
                    value={revenueSharing.creator_percentage || 70}
                    onChange={(e) => setRevenueSharing({ ...revenueSharing, creator_percentage: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform_percentage">Platform Percentage (%)</Label>
                  <Input
                    id="platform_percentage"
                    type="number"
                    value={revenueSharing.platform_percentage || 30}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Auto-calculated: 100 - Creator %</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_payout_aed">Minimum Payout (AED)</Label>
                  <Input
                    id="minimum_payout_aed"
                    type="number"
                    value={revenueSharing.minimum_payout_aed || 100}
                    onChange={(e) => setRevenueSharing({ ...revenueSharing, minimum_payout_aed: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payout_schedule">Payout Schedule</Label>
                  <Input
                    id="payout_schedule"
                    value={revenueSharing.payout_schedule || 'monthly'}
                    onChange={(e) => setRevenueSharing({ ...revenueSharing, payout_schedule: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={() => {
                const updatedRevenue = {
                  ...revenueSharing,
                  platform_percentage: 100 - (revenueSharing.creator_percentage || 70)
                }
                setRevenueSharing(updatedRevenue)
                saveConfiguration('revenue_sharing', updatedRevenue)
              }} disabled={loading}>
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                Save Revenue Sharing
              </Button>
            </TabsContent>

            <TabsContent value="rollover" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rollover_enabled">Rollover Enabled</Label>
                  <select
                    id="rollover_enabled"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={rolloverPolicy.enabled ? 'true' : 'false'}
                    onChange={(e) => setRolloverPolicy({ ...rolloverPolicy, enabled: e.target.value === 'true' })}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_rollover_percentage">Max Rollover (%)</Label>
                  <Input
                    id="max_rollover_percentage"
                    type="number"
                    value={rolloverPolicy.max_rollover_percentage || 50}
                    onChange={(e) => setRolloverPolicy({ ...rolloverPolicy, max_rollover_percentage: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rollover_expiry_months">Rollover Expiry (months)</Label>
                  <Input
                    id="rollover_expiry_months"
                    type="number"
                    value={rolloverPolicy.rollover_expiry_months || 3}
                    onChange={(e) => setRolloverPolicy({ ...rolloverPolicy, rollover_expiry_months: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={() => saveConfiguration('credit_rollover_policy', rolloverPolicy)} disabled={loading}>
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                Save Rollover Policy
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}