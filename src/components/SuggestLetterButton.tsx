import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useChatContext } from "@/contexts/ChatContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface SuggestLetterButtonProps {
  conversationId?: string
}

export const SuggestLetterButton = ({ conversationId }: SuggestLetterButtonProps) => {
  const { messages } = useChatContext()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [analysis, setAnalysis] = useState<{
    letterType: string
    suggestedTitle: string
    confidence: number
    reasoning: string
  } | null>(null)

  const handleAnalyze = async () => {
    if (!conversationId || messages.length === 0) {
      toast({
        title: "No conversation to analyze",
        description: "Start a conversation first to get letter suggestions",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)

    try {
      const { data, error } = await supabase.functions.invoke('analyze-message-for-letter', {
        body: {
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      })

      if (error) throw error

      if (data.shouldSuggestLetter) {
        setAnalysis({
          letterType: data.letterType,
          suggestedTitle: data.suggestedTitle,
          confidence: data.confidence,
          reasoning: data.reasoning
        })
        setShowDialog(true)
      } else {
        toast({
          title: "No letter needed",
          description: data.reasoning || "The conversation doesn't seem to require a formal letter at this time.",
        })
      }
    } catch (error: any) {
      console.error('Error analyzing conversation:', error)
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze conversation. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCreateLetter = () => {
    if (!analysis) return

    const conversationContext = messages.map(m => `${m.role}: ${m.content}`).join('\n\n')

    navigate('/letters/create', {
      state: {
        letterType: analysis.letterType,
        suggestedTitle: analysis.suggestedTitle,
        conversationContext
      }
    })
  }

  return (
    <>
      <Button
        onClick={handleAnalyze}
        variant="outline"
        size="sm"
        disabled={isAnalyzing || messages.length === 0}
        className="border-primary/20 text-primary hover:bg-primary/10"
      >
        {isAnalyzing ? (
          <>
            <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Icon name="file-text" className="h-4 w-4 mr-2" />
            Suggest Letter
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="file-text" className="w-5 h-5 text-primary" />
              Letter Suggestion
            </DialogTitle>
            <DialogDescription>
              Based on your conversation, we recommend creating a formal letter
            </DialogDescription>
          </DialogHeader>

          {analysis && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Letter Type</span>
                  <Badge variant="secondary">
                    {analysis.letterType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{analysis.confidence}%</span>
                  </div>
                  <Progress value={analysis.confidence} className="h-2" />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Why this letter?</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.reasoning}
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                <Icon name="zap" className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Creating this letter will use 5 credits
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateLetter} className="flex-1 gap-2">
                  <Icon name="file-plus" className="w-4 h-4" />
                  Create Letter
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
