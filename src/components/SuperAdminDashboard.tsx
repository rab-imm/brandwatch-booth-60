import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/Header"
import { AdminErrorBoundary } from "./admin/AdminErrorBoundary"
import { DocumentUpload } from "./DocumentUpload"
import { TemplateCreator } from "./TemplateCreator"
import { TemplateAnalytics } from "./TemplateAnalytics"
import { RealtimeDashboard } from "./RealtimeDashboard"
import { BulkActionBar } from "./admin/BulkActionBar"
import { AdminSearchFilter } from "./admin/AdminSearchFilter"
import { EnhancedDataTable } from "./admin/EnhancedDataTable"
import { AdminOverviewDashboard } from "./admin/AdminOverviewDashboard"
import { UserManagement } from "./admin/UserManagement"
import { DocumentWorkflow } from "./admin/DocumentWorkflow"
import { AdvancedAnalytics } from "./admin/AdvancedAnalytics"
import { NotificationManagement } from './admin/NotificationManagement';
import { SystemConfiguration } from './admin/SystemConfiguration';
import { AuditLogs } from './admin/AuditLogs';
import { SecurityMonitoring } from './admin/SecurityMonitoring';
import { SuperAdminBillingDashboard } from './admin/SuperAdminBillingDashboard';

export const SuperAdminDashboard = () => {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [documents, setDocuments] = useState([])
  const [companies, setCompanies] = useState([])
  const [lawyerRequests, setLawyerRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])

  useEffect(() => {
    if (profile?.user_role === 'super_admin') {
      fetchData()
    }
  }, [profile])

  useEffect(() => {
    setFilteredDocuments(documents)
  }, [documents])

  useEffect(() => {
    setFilteredCompanies(companies)
  }, [companies])

  const fetchData = async () => {
    try {
      const [docsRes, companiesRes, requestsRes] = await Promise.all([
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('companies').select('*').order('created_at', { ascending: false }),
        supabase.from('lawyer_requests').select('*').order('created_at', { ascending: false })
      ])

      setDocuments(docsRes.data || [])
      setCompanies(companiesRes.data || [])
      setLawyerRequests(requestsRes.data || [])
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const approveDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: 'approved', 
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (error) throw error

      toast({
        title: "Document Approved",
        description: "Document has been approved and is now live",
      })
      
      fetchData()
    } catch (error) {
      console.error('Error approving document:', error)
      toast({
        title: "Error",
        description: "Failed to approve document",
        variant: "destructive"
      })
    }
  }

  const rejectDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: 'rejected' })
        .eq('id', documentId)

      if (error) throw error

      toast({
        title: "Document Rejected",
        description: "Document has been rejected",
      })
      
      fetchData()
    } catch (error) {
      console.error('Error rejecting document:', error)
      toast({
        title: "Error",
        description: "Failed to reject document",
        variant: "destructive"
      })
    }
  }

  // Bulk operations
  const handleBulkApproveDocuments = async () => {
    const { error } = await supabase
      .from('documents')
      .update({ 
        status: 'approved', 
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      })
      .in('id', selectedDocuments)

    if (error) throw error
    fetchData()
  }

  const handleBulkRejectDocuments = async () => {
    const { error } = await supabase
      .from('documents')
      .update({ status: 'rejected' })
      .in('id', selectedDocuments)

    if (error) throw error
    fetchData()
  }

  const handleDocumentFilter = (filters: Record<string, any>) => {
    let filtered = [...documents]
    
    if (filters.search) {
      filtered = filtered.filter((doc: any) => 
        doc.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        doc.content?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }
    
    if (filters.status) {
      filtered = filtered.filter((doc: any) => doc.status === filters.status)
    }
    
    if (filters.category) {
      filtered = filtered.filter((doc: any) => doc.category === filters.category)
    }
    
    setFilteredDocuments(filtered)
  }

  const handleCompanyFilter = (filters: Record<string, any>) => {
    let filtered = [...companies]
    
    if (filters.search) {
      filtered = filtered.filter((company: any) => 
        company.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        company.email?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }
    
    if (filters.subscription_tier) {
      filtered = filtered.filter((company: any) => company.subscription_tier === filters.subscription_tier)
    }
    
    setFilteredCompanies(filtered)
  }

  // Document table columns
  const documentColumns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value: string, item: any) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{item.category}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={
          value === 'approved' ? 'default' : 
          value === 'rejected' ? 'destructive' : 'secondary'
        }>
          {value}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, item: any) => (
        <div className="flex gap-2">
          {item.status === 'pending' && (
            <>
              <Button 
                size="sm" 
                onClick={() => approveDocument(item.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Icon name="check-circle" className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => rejectDocument(item.id)}
              >
                <Icon name="x-circle" className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ]

  // Company table columns
  const companyColumns = [
    {
      key: 'name',
      label: 'Company',
      sortable: true,
      render: (value: string, item: any) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{item.email}</div>
        </div>
      )
    },
    {
      key: 'subscription_tier',
      label: 'Tier',
      render: (value: string) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'credits',
      label: 'Credits',
      render: (value: any, item: any) => (
        <div className="text-sm">
          {item.used_credits} / {item.total_credits}
        </div>
      )
    },
    {
      key: 'subscription_status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    }
  ]

  // Filter configurations
  const documentFilterConfigs = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select' as const,
      options: [
        { value: 'employment', label: 'Employment' },
        { value: 'contracts', label: 'Contracts' },
        { value: 'corporate', label: 'Corporate' },
        { value: 'real_estate', label: 'Real Estate' },
        { value: 'intellectual_property', label: 'IP' }
      ]
    }
  ]

  const companyFilterConfigs = [
    {
      key: 'subscription_tier',
      label: 'Tier',
      type: 'select' as const,
      options: [
        { value: 'free', label: 'Free' },
        { value: 'essential', label: 'Essential' },
        { value: 'premium', label: 'Premium' },
        { value: 'sme', label: 'SME' }
      ]
    }
  ]

  // Check if user is super admin
  if (profile?.user_role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You don't have permission to access the super admin dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center">
            <Icon name="loader" className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading admin data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform-wide settings and monitor system activity</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-13">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Icon name="layout-dashboard" className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Icon name="file-text" className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Icon name="building" className="h-4 w-4" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Icon name="users" className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <Icon name="credit-card" className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Icon name="alert-circle" className="h-4 w-4" />
              Lawyer Requests
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Icon name="workflow" className="h-4 w-4" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Icon name="upload" className="h-4 w-4" />
              Upload Document
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Icon name="file-plus" className="h-4 w-4" />
              Create Template
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Icon name="bar-chart" className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="advanced-analytics" className="flex items-center gap-2">
              <Icon name="trending-up" className="h-4 w-4" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Icon name="activity" className="h-4 w-4" />
              Real-time
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Icon name="bell" className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Icon name="settings" className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Icon name="eye" className="h-4 w-4" />
              Audit
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Icon name="shield" className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminOverviewDashboard />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <AdminSearchFilter
              onFilterChange={handleDocumentFilter}
              filterConfigs={documentFilterConfigs}
            />
            
            <EnhancedDataTable
              data={filteredDocuments}
              columns={documentColumns}
              onSelectionChange={setSelectedDocuments}
              selectedItems={selectedDocuments}
              loading={loading}
              emptyMessage="No documents found"
            />
            
            <BulkActionBar
              selectedItems={selectedDocuments}
              onClearSelection={() => setSelectedDocuments([])}
              onBulkApprove={handleBulkApproveDocuments}
              onBulkReject={handleBulkRejectDocuments}
              itemType="documents"
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6">
            <DocumentWorkflow documents={filteredDocuments} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            <AdminSearchFilter
              onFilterChange={handleCompanyFilter}
              filterConfigs={companyFilterConfigs}
            />
            
            <EnhancedDataTable
              data={filteredCompanies}
              columns={companyColumns}
              onSelectionChange={setSelectedCompanies}
              selectedItems={selectedCompanies}
              loading={loading}
              emptyMessage="No companies found"
            />
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <div className="grid gap-4">
              {lawyerRequests.map((request: any) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{request.subject}</CardTitle>
                        <CardDescription>
                          Specialization: {request.specialization || 'General'}
                        </CardDescription>
                      </div>
                      <Badge variant={
                        request.status === 'assigned' ? 'default' :
                        request.status === 'pending' ? 'secondary' : 'outline'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {request.description}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span>Priority: {request.priority}</span>
                      <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <AdminErrorBoundary>
              <SuperAdminBillingDashboard />
            </AdminErrorBoundary>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <AdminErrorBoundary>
              <DocumentUpload />
            </AdminErrorBoundary>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <AdminErrorBoundary>
              <TemplateCreator />
            </AdminErrorBoundary>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AdminErrorBoundary>
              <TemplateAnalytics />
            </AdminErrorBoundary>
          </TabsContent>

          <TabsContent value="advanced-analytics" className="space-y-4">
            <AdminErrorBoundary>
              <AdvancedAnalytics />
            </AdminErrorBoundary>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-4">
            <AdminErrorBoundary>
              <RealtimeDashboard />
            </AdminErrorBoundary>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <AdminErrorBoundary>
              <NotificationManagement />
            </AdminErrorBoundary>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <AdminErrorBoundary>
              <SystemConfiguration />
            </AdminErrorBoundary>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <AdminErrorBoundary>
              <AuditLogs />
            </AdminErrorBoundary>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <AdminErrorBoundary>
              <SecurityMonitoring />
            </AdminErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}