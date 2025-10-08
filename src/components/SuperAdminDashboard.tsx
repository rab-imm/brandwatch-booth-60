import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/Header"
import { AdminErrorBoundary } from "./admin/AdminErrorBoundary"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "./admin/AdminSidebar"
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
import { BulkUserOperations } from './admin/BulkUserOperations';
import { CustomReportBuilder } from './admin/CustomReportBuilder';
import { PaymentFailureManager } from './admin/PaymentFailureManager';
import { RetentionManager } from './admin/RetentionManager';
import { TrialManagement } from './admin/TrialManagement';
import { UserImpersonation } from './admin/UserImpersonation';
import { WebhookManager } from './admin/WebhookManager';
import { BillingAnalytics } from './admin/BillingAnalytics';

export const SuperAdminDashboard = () => {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState("overview")
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

  const renderActiveSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <AdminErrorBoundary>
            <AdminOverviewDashboard />
          </AdminErrorBoundary>
        )
      
      case "documents":
        return (
          <AdminErrorBoundary>
            <div className="space-y-6">
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
            </div>
          </AdminErrorBoundary>
        )
      
      case "users":
        return (
          <AdminErrorBoundary>
            <UserManagement />
          </AdminErrorBoundary>
        )
      
      case "bulk-operations":
        return (
          <AdminErrorBoundary>
            <BulkUserOperations />
          </AdminErrorBoundary>
        )
      
      case "impersonation":
        return (
          <AdminErrorBoundary>
            <UserImpersonation />
          </AdminErrorBoundary>
        )
      
      case "workflow":
        return (
          <AdminErrorBoundary>
            <DocumentWorkflow documents={filteredDocuments} onRefresh={fetchData} />
          </AdminErrorBoundary>
        )
      
      case "companies":
        return (
          <AdminErrorBoundary>
            <div className="space-y-6">
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
            </div>
          </AdminErrorBoundary>
        )
      
      case "billing":
        return (
          <AdminErrorBoundary>
            <SuperAdminBillingDashboard />
          </AdminErrorBoundary>
        )
      
      case "billing-analytics":
        return (
          <AdminErrorBoundary>
            <BillingAnalytics />
          </AdminErrorBoundary>
        )
      
      case "payment-failures":
        return (
          <AdminErrorBoundary>
            <PaymentFailureManager />
          </AdminErrorBoundary>
        )
      
      case "trials":
        return (
          <AdminErrorBoundary>
            <TrialManagement />
          </AdminErrorBoundary>
        )
      
      case "retention":
        return (
          <AdminErrorBoundary>
            <RetentionManager />
          </AdminErrorBoundary>
        )
      
      case "requests":
        return (
          <AdminErrorBoundary>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Lawyer Requests</h2>
              <div className="grid gap-6">
                {lawyerRequests.map((request: any) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <CardTitle>{request.subject}</CardTitle>
                      <CardDescription>
                        From: {request.name} ({request.email})
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{request.message}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                          {request.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </AdminErrorBoundary>
        )
      
      case "upload":
        return (
          <AdminErrorBoundary>
            <DocumentUpload />
          </AdminErrorBoundary>
        )
      
      case "templates":
        return (
          <AdminErrorBoundary>
            <TemplateCreator />
          </AdminErrorBoundary>
        )
      
      case "analytics":
        return (
          <AdminErrorBoundary>
            <TemplateAnalytics />
          </AdminErrorBoundary>
        )
      
      case "advanced-analytics":
        return (
          <AdminErrorBoundary>
            <AdvancedAnalytics />
          </AdminErrorBoundary>
        )
      
      case "realtime":
        return (
          <AdminErrorBoundary>
            <RealtimeDashboard />
          </AdminErrorBoundary>
        )
      
      case "notifications":
        return (
          <AdminErrorBoundary>
            <NotificationManagement />
          </AdminErrorBoundary>
        )
      
      case "settings":
        return (
          <AdminErrorBoundary>
            <SystemConfiguration />
          </AdminErrorBoundary>
        )
      
      case "audit":
        return (
          <AdminErrorBoundary>
            <AuditLogs />
          </AdminErrorBoundary>
        )
      
      case "security":
        return (
          <AdminErrorBoundary>
            <SecurityMonitoring />
          </AdminErrorBoundary>
        )
      
      case "webhooks":
        return (
          <AdminErrorBoundary>
            <WebhookManager />
          </AdminErrorBoundary>
        )
      
      case "custom-reports":
        return (
          <AdminErrorBoundary>
            <CustomReportBuilder />
          </AdminErrorBoundary>
        )
      
      default:
        return (
          <AdminErrorBoundary>
            <AdminOverviewDashboard />
          </AdminErrorBoundary>
        )
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">Super Admin Dashboard</h1>
                <span className="text-sm text-muted-foreground">
                  • {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}
                </span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
            >
              <Icon name="arrow-left" className="h-4 w-4" />
              Back to Website
            </Button>
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
            {renderActiveSection()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}