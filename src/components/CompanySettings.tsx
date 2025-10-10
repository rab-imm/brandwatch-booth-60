import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

interface CompanyData {
  id: string
  name: string
  email: string
  subscription_tier: string
  subscription_status: string
  total_credits: number
  used_credits: number
  credits_reset_date: string
  created_at: string
}

interface CompanySettingsProps {
  companyId: string
}

export function CompanySettings({ companyId }: CompanySettingsProps) {
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    fetchCompanyData()
  }, [companyId])

  const fetchCompanyData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()

      if (error) throw error
      setCompany(data)
      setFormData({
        name: data.name,
        email: data.email
      })
    } catch (error) {
      console.error('Error fetching company data:', error)
      toast.error('Failed to load company settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          email: formData.email
        })
        .eq('id', companyId)

      if (error) throw error

      toast.success('Settings updated successfully')
      setEditing(false)
      fetchCompanyData()
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="loader" className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Company not found</p>
        </CardContent>
      </Card>
    )
  }

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'default'
      case 'premium_business':
      case 'premium': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Company Settings</h2>
        <p className="text-muted-foreground">Manage your company profile and preferences</p>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Basic details about your company</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            {editing ? (
              <Input
                id="company-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            ) : (
              <p className="text-lg font-medium">{company.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-email">Company Email</Label>
            {editing ? (
              <Input
                id="company-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            ) : (
              <p className="text-lg">{company.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Company ID</Label>
            <p className="text-sm font-mono text-muted-foreground">{company.id}</p>
          </div>

          <div className="space-y-2">
            <Label>Member Since</Label>
            <p className="text-sm">{new Date(company.created_at).toLocaleDateString()}</p>
          </div>

          <div className="flex gap-2 pt-4">
            {editing ? (
              <>
                <Button onClick={handleSave}>
                  <Icon name="check" className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditing(false)
                  setFormData({ name: company.name, email: company.email })
                }}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Icon name="edit" className="h-4 w-4 mr-2" />
                Edit Information
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Details */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
          <CardDescription>Your current plan and billing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Current Plan</Label>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold capitalize">{company.subscription_tier.replace('_', ' ')}</p>
                <Badge variant={getTierBadgeVariant(company.subscription_tier)}>
                  {company.subscription_status}
                </Badge>
              </div>
            </div>
            <Button variant="outline">
              <Icon name="arrow-up-right" className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Total Credits</Label>
              <p className="text-2xl font-bold">{company.total_credits.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Credits Used</Label>
              <p className="text-2xl font-bold">{company.used_credits.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Credits Remaining</Label>
              <p className="text-2xl font-bold text-primary">
                {(company.total_credits - company.used_credits).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Next Reset</Label>
              <p className="text-lg font-medium">
                {new Date(company.credits_reset_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline">
              <Icon name="credit-card" className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
            <Button variant="outline">
              <Icon name="file-text" className="h-4 w-4 mr-2" />
              View Invoices
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your company account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Company</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your company and all associated data
              </p>
            </div>
            <Button variant="destructive" onClick={() => {
              toast.error('Please contact support to delete your company')
            }}>
              Delete Company
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}