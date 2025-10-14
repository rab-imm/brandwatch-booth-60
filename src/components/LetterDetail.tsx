import { useState, useEffect } from "react"
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
import { ShareLetterDialog } from "@/components/ShareLetterDialog"
import { PrepareDocumentSignature } from "@/components/signature/PrepareDocumentSignature"
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

interface LetterDetailProps {
  letterId: string
  onBack: () => void
}

export function LetterDetail({ letterId, onBack }: LetterDetailProps) {
  const { user, profile, refetchProfile } = useAuth()
  const { toast } = useToast()

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
      onBack()
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
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!letter) {
    return null
  }

  if (showSignaturePrep) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setShowSignaturePrep(false)}>
          <Icon name="arrow-left" className="w-4 h-4 mr-2" />
          Back to Letter
        </Button>
        <PrepareDocumentSignature
          letterId={letter.id}
          letterContent={letter.content}
          letterTitle={letter.title}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <Icon name="arrow-left" className="w-4 h-4 mr-2" />
        Back to Letters
      </Button>

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
            {(letter.status === 'draft' || isEditing) && (
              <div className="flex flex-wrap gap-2">
                {letter.status === 'draft' && !isEditing && (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Icon name="edit" className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button onClick={() => setFinalizeDialogOpen(true)}>
                      <Icon name="check" className="w-4 h-4 mr-2" />
                      Finalize
                    </Button>
                  </>
                )}

                {isEditing && (
                  <>
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
                  </>
                )}
              </div>
            )}

            {/* Primary Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="premium"
                onClick={() => setShowSignaturePrep(true)}
                size="lg"
                className="gap-2"
              >
                <Icon name="pen-tool" className="w-4 h-4" />
                Send for Signature
              </Button>
              
              <Button
                variant="default"
                onClick={() => setShareDialogOpen(true)}
                size="lg"
                className="gap-2"
              >
                <Icon name="share" className="w-4 h-4" />
                Share Document
              </Button>
              
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={isExporting}
                size="lg"
                className="gap-2"
              >
                {isExporting ? (
                  <>
                    <Icon name="loader" className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Icon name="download" className="w-4 h-4" />
                    Export PDF (1 credit)
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Share Document Dialog */}
      <ShareLetterDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        letterId={letter.id}
        letterTitle={letter.title}
      />
    </div>
  )
}
