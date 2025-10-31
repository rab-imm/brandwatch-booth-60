import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShareLetterDialog } from "@/components/ShareLetterDialog"
import { PrepareDocumentSignature } from "@/components/signature/PrepareDocumentSignature"
import { SignatureRequestStatus } from "@/components/signature/SignatureRequestStatus"
import { SignedDocumentViewer } from "@/components/signature/SignedDocumentViewer"
import { ManageShareLinks } from "@/components/ManageShareLinks"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDistanceToNow } from "date-fns"

interface Letter {
  id: string
  title: string
  letter_type: string
  status: string
  content: string
  created_at: string
  updated_at: string
  finalized_at: string | null
  credits_used: number
  metadata: any
}

const LETTER_TYPE_LABELS: { [key: string]: string } = {
  employment_termination: "Employment Termination",
  employment_contract: "Employment Contract",
  lease_agreement: "Lease Agreement",
  lease_termination: "Lease Termination",
  demand_letter: "Demand Letter",
  nda: "Non-Disclosure Agreement",
  settlement_agreement: "Settlement Agreement",
  power_of_attorney: "Power of Attorney",
  general_legal: "General Legal",
  workplace_complaint: "Workplace Complaint",
}

export default function LetterDetailPage() {
  const { letterId } = useParams()
  const navigate = useNavigate()
  const { user, profile, refetchProfile } = useAuth()
  const { toast } = useToast()

  // Check for tab query parameter
  const searchParams = new URLSearchParams(window.location.search)
  const initialTab = searchParams.get('tab') || 'letter'

  const [letter, setLetter] = useState<Letter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedContent, setEditedContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [showSignaturePrep, setShowSignaturePrep] = useState(false)

  useEffect(() => {
    if (letterId && user) {
      fetchLetter()
    }
  }, [letterId, user])

  const fetchLetter = async () => {
    if (!letterId || !user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('legal_letters')
        .select('*')
        .eq('id', letterId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      setLetter(data)
      setEditedTitle(data.title)
      setEditedContent(data.content)
    } catch (error: any) {
      console.error("Error fetching letter:", error)
      toast({
        title: "Failed to load letter",
        description: error.message,
        variant: "destructive"
      })
      navigate('/letters')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!letter || !user) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('legal_letters')
        .update({
          title: editedTitle,
          content: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', letter.id)
        .eq('user_id', user.id)

      if (error) throw error

      setLetter({
        ...letter,
        title: editedTitle,
        content: editedContent,
        updated_at: new Date().toISOString()
      })

      setIsEditing(false)
      toast({
        title: "Letter saved",
        description: "Your changes have been saved"
      })
    } catch (error: any) {
      console.error("Error saving letter:", error)
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinalize = async () => {
    if (!letter || !user) return

    try {
      const { error } = await supabase
        .from('legal_letters')
        .update({
          status: 'finalized',
          finalized_at: new Date().toISOString()
        })
        .eq('id', letter.id)
        .eq('user_id', user.id)

      if (error) throw error

      setLetter({
        ...letter,
        status: 'finalized',
        finalized_at: new Date().toISOString()
      })

      toast({
        title: "Letter finalized",
        description: "This letter can no longer be edited"
      })
    } catch (error: any) {
      console.error("Error finalizing letter:", error)
      toast({
        title: "Finalize failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setFinalizeDialogOpen(false)
    }
  }

  const handleExportPDF = async () => {
    if (!letter || !profile) return

    const creditsNeeded = 1
    const creditsAvailable = profile.max_credits_per_period - profile.queries_used

    if (creditsAvailable < creditsNeeded) {
      toast({
        title: "Insufficient credits",
        description: `You need ${creditsNeeded} credit but only have ${creditsAvailable} available`,
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    try {
      const { data, error } = await supabase.functions.invoke('export-letter-pdf', {
        body: { letterId: letter.id }
      })

      if (error) throw error

      if (data.error) {
        throw new Error(data.error)
      }

      // Create download link
      const htmlContent = atob(data.pdfData)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.filename.replace('.pdf', '.html')
      link.click()
      URL.revokeObjectURL(url)

      await refetchProfile()

      toast({
        title: "PDF exported!",
        description: `${creditsNeeded} credit deducted from your account`
      })
    } catch (error: any) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Export failed",
        description: error.message || "Failed to export PDF. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!letter) return null

  if (showSignaturePrep) {
    return (
      <PrepareDocumentSignature
        letterId={letter.id}
        letterContent={letter.content}
        letterTitle={letter.title}
      />
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/letters')} className="mb-4">
          <Icon name="arrow-left" className="w-4 h-4 mr-2" />
          Back to Letters
        </Button>
      </div>

      {/* Signed Document Banner */}
      {letter.status === 'signed' && (
        <Card className="mb-6 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Icon name="check-circle" className="w-8 h-8 text-emerald-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-emerald-900 dark:text-emerald-100">
                  Fully Executed Document
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  This document has been signed by all parties{letter.finalized_at && 
                    ` on ${new Date(letter.finalized_at).toLocaleDateString()}`
                  }
                </p>
              </div>
              <Badge className="bg-emerald-600">
                Signed
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="letter">Letter</TabsTrigger>
          {letter.status === 'signed' && (
            <TabsTrigger value="signed">Signed Document</TabsTrigger>
          )}
          <TabsTrigger value="signature">Request Signature</TabsTrigger>
          <TabsTrigger value="share">Share & Links</TabsTrigger>
        </TabsList>

        <TabsContent value="letter">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-2xl font-bold mb-2"
                    />
                  ) : (
                    <CardTitle className="text-2xl mb-2">{letter.title}</CardTitle>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="secondary">
                      {LETTER_TYPE_LABELS[letter.letter_type] || letter.letter_type}
                    </Badge>
                    <Badge variant={letter.status === 'draft' ? 'outline' : 'default'}>
                      {letter.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Icon name="clock" className="w-4 h-4" />
                      Created {formatDistanceToNow(new Date(letter.created_at), { addSuffix: true })}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Icon name="zap" className="w-4 h-4" />
                      {letter.credits_used} credits
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={20}
                  className="font-serif"
                />
              ) : (
                <div className="bg-card border rounded-lg p-6">
                  <pre className="whitespace-pre-wrap font-serif text-sm">
                    {letter.content}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 pt-6 border-t">
                {/* Edit Controls */}
                {letter.status === 'draft' && !isEditing && (
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Icon name="edit" className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button onClick={() => setFinalizeDialogOpen(true)}>
                      <Icon name="check" className="w-4 h-4 mr-2" />
                      Finalize
                    </Button>
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => {
                      setEditedTitle(letter.title)
                      setEditedContent(letter.content)
                      setIsEditing(false)
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Icon name="loader" className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Icon name="save" className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Primary Actions */}
                <div className="flex gap-3 flex-wrap items-center">
                  <Button
                    variant="premium"
                    size="lg"
                    onClick={() => setShowSignaturePrep(true)}
                  >
                    <Icon name="pen-tool" className="w-4 h-4 mr-2" />
                    Send for Signature
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Icon name="share" className="w-4 h-4 mr-2" />
                    Share Document
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Icon name="loader" className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Icon name="download" className="w-4 h-4 mr-2" />
                        Export PDF (1 credit)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signed">
          <SignedDocumentViewer
            letterId={letter.id}
            letterTitle={letter.title}
            letterContent={letter.content}
          />
        </TabsContent>

        <TabsContent value="signature">
          <div className="space-y-6">
            <SignatureRequestStatus letterId={letter.id} />
            
            <Card>
              <CardHeader>
                <CardTitle>Create New Signature Request</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Prepare this document for electronic signature by adding recipients and signature fields.
                </p>
                <Button onClick={() => setShowSignaturePrep(true)}>
                  <Icon name="edit" className="w-4 w-4 mr-2" />
                  Prepare Document for Signing
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="share">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Share This Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShareDialogOpen(true)}>
                  <Icon name="share" className="w-4 h-4 mr-2" />
                  Create Share Link
                </Button>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-lg font-semibold mb-4">Active Share Links</h3>
              <ManageShareLinks letterId={letter.id} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <ShareLetterDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        letterId={letter.id}
        letterTitle={letter.title}
      />

      {/* Finalize Confirmation Dialog */}
      <AlertDialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize Letter</AlertDialogTitle>
            <AlertDialogDescription>
              Once finalized, this letter cannot be edited. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize}>
              Finalize
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
