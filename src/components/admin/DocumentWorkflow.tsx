import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icon } from "@/components/ui/Icon"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface Document {
  id: string
  title: string
  content: string
  category: string
  status: string
  file_path?: string
  created_at: string
  metadata?: any
}

interface DocumentPreviewProps {
  document: Document
}

const DocumentPreview = ({ document }: DocumentPreviewProps) => {
  const [previewContent, setPreviewContent] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const loadPreview = async () => {
    setLoading(true)
    try {
      // For now, show the text content. In a real app, you'd handle different file types
      setPreviewContent(document.content || "No content available")
    } catch (error) {
      console.error('Error loading preview:', error)
      setPreviewContent("Error loading preview")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (document) {
      loadPreview()
    }
  }, [document])

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-muted/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">{document.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{document.category}</Badge>
              <Badge variant={
                document.status === 'approved' ? 'default' : 
                document.status === 'rejected' ? 'destructive' : 'secondary'
              }>
                {document.status}
              </Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(document.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <ScrollArea className="h-96 w-full border rounded p-4 bg-background">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Icon name="loader" className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm">
              {previewContent}
            </div>
          )}
        </ScrollArea>
      </div>
      
      {document.metadata && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Document Metadata</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify(document.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

interface DocumentWorkflowProps {
  documents: Document[]
  onRefresh: () => void
}

export const DocumentWorkflow = ({ documents, onRefresh }: DocumentWorkflowProps) => {
  const { user } = useAuth()
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [workflowAction, setWorkflowAction] = useState<string>("")

  const handleApproveWithComment = async (documentId: string, comment: string = "") => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          metadata: {
            approval_comment: comment,
            workflow_stage: 'completed'
          }
        })
        .eq('id', documentId)

      if (error) throw error

      // Log the activity
      await supabase.rpc('log_activity', {
        p_user_id: user?.id,
        p_action: 'document_approved',
        p_resource_type: 'document',
        p_resource_id: documentId,
        p_metadata: { comment }
      })

      toast.success('Document approved successfully')
      onRefresh()
    } catch (error) {
      console.error('Error approving document:', error)
      toast.error('Failed to approve document')
    }
  }

  const handleRejectWithReason = async (documentId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'rejected',
          metadata: {
            rejection_reason: reason,
            rejected_by: user?.id,
            rejected_at: new Date().toISOString(),
            workflow_stage: 'rejected'
          }
        })
        .eq('id', documentId)

      if (error) throw error

      // Log the activity
      await supabase.rpc('log_activity', {
        p_user_id: user?.id,
        p_action: 'document_rejected',
        p_resource_type: 'document',
        p_resource_id: documentId,
        p_metadata: { reason }
      })

      toast.success('Document rejected')
      onRefresh()
    } catch (error) {
      console.error('Error rejecting document:', error)
      toast.error('Failed to reject document')
    }
  }

  const handleRequestRevision = async (documentId: string, revisionNotes: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'pending',
          metadata: {
            revision_requested: true,
            revision_notes: revisionNotes,
            requested_by: user?.id,
            requested_at: new Date().toISOString(),
            workflow_stage: 'revision_requested'
          }
        })
        .eq('id', documentId)

      if (error) throw error

      toast.success('Revision requested')
      onRefresh()
    } catch (error) {
      console.error('Error requesting revision:', error)
      toast.error('Failed to request revision')
    }
  }

  const pendingDocuments = documents.filter(doc => doc.status === 'pending')
  const approvedDocuments = documents.filter(doc => doc.status === 'approved')
  const rejectedDocuments = documents.filter(doc => doc.status === 'rejected')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Icon name="clock" className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Icon name="check-circle" className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Live documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <Icon name="x-circle" className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Rejected documents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Documents Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Document Review Queue</CardTitle>
          <CardDescription>
            Documents pending review and approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="check-circle" className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents pending review</p>
              </div>
            ) : (
              pendingDocuments.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{doc.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{doc.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Icon name="eye" className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>Document Preview</DialogTitle>
                          <DialogDescription>
                            Review the document content and make approval decisions
                          </DialogDescription>
                        </DialogHeader>
                        <DocumentPreview document={doc} />
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveWithComment(doc.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Icon name="check" className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectWithReason(doc.id, "Quality standards not met")}
                    >
                      <Icon name="x" className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestRevision(doc.id, "Please review and make necessary changes")}
                    >
                      <Icon name="edit" className="h-4 w-4 mr-2" />
                      Request Revision
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Recently processed documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...approvedDocuments, ...rejectedDocuments]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Icon 
                      name={doc.status === 'approved' ? 'check-circle' : 'x-circle'} 
                      className={`h-5 w-5 ${
                        doc.status === 'approved' ? 'text-green-600' : 'text-red-600'
                      }`} 
                    />
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-sm text-muted-foreground">{doc.category}</div>
                    </div>
                  </div>
                  <Badge variant={doc.status === 'approved' ? 'default' : 'destructive'}>
                    {doc.status}
                  </Badge>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  )
}