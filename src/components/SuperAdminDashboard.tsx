import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { DocumentUpload } from "./DocumentUpload"
import { TemplateCreator } from "./TemplateCreator"

export const SuperAdminDashboard = () => {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("documents")
  const [documents, setDocuments] = useState([])
  const [companies, setCompanies] = useState([])
  const [lawyerRequests, setLawyerRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.user_role === 'super_admin') {
      fetchData()
    }
  }, [profile])

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

  // Check if user is super admin
  if (profile?.user_role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You don't have permission to access the super admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Super Admin Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Manage documents, companies, and lawyer requests
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Icon name="file-text" className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Icon name="building" className="h-4 w-4" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Icon name="alert-circle" className="h-4 w-4" />
              Lawyer Requests
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Icon name="upload" className="h-4 w-4" />
              Upload Document
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Icon name="file-plus" className="h-4 w-4" />
              Create Template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <div className="grid gap-4">
              {documents.map((doc: any) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{doc.title}</CardTitle>
                        <CardDescription>Category: {doc.category}</CardDescription>
                      </div>
                      <Badge variant={
                        doc.status === 'approved' ? 'default' : 
                        doc.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {doc.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {doc.content?.substring(0, 200)}...
                    </p>
                    {doc.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => approveDocument(doc.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Icon name="check-circle" className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => rejectDocument(doc.id)}
                        >
                          <Icon name="x-circle" className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="companies" className="space-y-4">
            <div className="grid gap-4">
              {companies.map((company: any) => (
                <Card key={company.id}>
                  <CardHeader>
                    <CardTitle>{company.name}</CardTitle>
                    <CardDescription>{company.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Tier:</span>
                        <br />
                        <Badge variant="outline">{company.subscription_tier}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Credits:</span>
                        <br />
                        {company.used_credits} / {company.total_credits}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <br />
                        <Badge variant={company.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {company.subscription_status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>
                        <br />
                        {new Date(company.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

          <TabsContent value="upload" className="space-y-4">
            <DocumentUpload />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <TemplateCreator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}