import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { SavedDocumentViewer } from "./SavedDocumentViewer"
import { formatDistanceToNow } from "date-fns"

interface SavedDocument {
  id: string
  user_id: string
  company_id: string | null
  ocr_history_id: string
  file_name: string
  file_type: string
  custom_title: string | null
  tags: any
  notes: string | null
  scan_results: any
  created_at: string
  updated_at: string
}

export const SavedDocuments = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<SavedDocument | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchSavedDocuments()
    }
  }, [user])

  const fetchSavedDocuments = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('saved_ocr_documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSavedDocuments(data || [])
    } catch (error: any) {
      console.error('Error fetching saved documents:', error)
      toast({
        title: "Error",
        description: "Failed to load saved documents",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_ocr_documents')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSavedDocuments(prev => prev.filter(doc => doc.id !== id))
      toast({
        title: "Deleted",
        description: "Document removed from saved documents"
      })
    } catch (error: any) {
      console.error('Error deleting document:', error)
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      })
    }
  }

  const handleViewDocument = (doc: SavedDocument) => {
    setSelectedDocument(doc)
    setIsViewerOpen(true)
  }

  const filteredDocuments = savedDocuments.filter(doc => {
    const searchLower = searchQuery.toLowerCase()
    return (
      doc.file_name.toLowerCase().includes(searchLower) ||
      doc.custom_title?.toLowerCase().includes(searchLower) ||
      doc.notes?.toLowerCase().includes(searchLower)
    )
  })

  const getComplianceScore = (doc: SavedDocument): number | null => {
    return doc.scan_results?.compliance_check?.compliance_score || null
  }

  const getComplianceColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <Icon name="loader" className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading saved documents...</p>
        </div>
      </div>
    )
  }

  if (savedDocuments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Icon name="bookmark" className="h-16 w-16 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">No Saved Documents</CardTitle>
          <CardDescription className="mb-4">
            Save OCR scan results from the "Scan Document" tab to access them here later
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search saved documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => {
            const complianceScore = getComplianceScore(doc)
            
            return (
              <Card 
                key={doc.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleViewDocument(doc)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {doc.custom_title || doc.file_name}
                      </CardTitle>
                      {doc.custom_title && (
                        <CardDescription className="text-xs truncate">
                          {doc.file_name}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(doc.id)
                      }}
                    >
                      <Icon name="trash-2" className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {doc.file_type.includes('pdf') ? 'PDF' : 'Image'}
                    </Badge>
                    {complianceScore !== null && (
                      <Badge variant="outline" className="text-xs">
                        <Icon name="shield-check" className="h-3 w-3 mr-1" />
                        <span className={getComplianceColor(complianceScore)}>
                          {complianceScore}% Compliant
                        </span>
                      </Badge>
                    )}
                  </div>
                  
                  {doc.scan_results?.statistics && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="file-text" className="h-3 w-3" />
                        {doc.scan_results.statistics.words} words
                      </span>
                      {doc.scan_results.statistics.clauses_detected && (
                        <span className="flex items-center gap-1">
                          <Icon name="list" className="h-3 w-3" />
                          {doc.scan_results.statistics.clauses_detected} clauses
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="clock" className="h-3 w-3" />
                    Saved {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                  </div>

                  {doc.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {doc.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <SavedDocumentViewer
        document={selectedDocument}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false)
          setSelectedDocument(null)
        }}
        onDelete={(id) => {
          handleDelete(id)
          setIsViewerOpen(false)
          setSelectedDocument(null)
        }}
      />
    </>
  )
}
