import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import { ComplianceScoreCircle } from "./ComplianceScoreCircle"
import { ClauseDetectionGrid } from "./ClauseDetectionGrid"
import { KeyIssuesSummary } from "./KeyIssuesSummary"
import { ContractTextViewer } from "./ContractTextViewer"
import { ClauseAnnotationPanel } from "./ClauseAnnotationPanel"
import { StructuredContractSummary, StructuredSummary } from "./StructuredContractSummary"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface AnalysisContext {
  questionnaire: {
    contractType: string | null
    userRole: string | null
    analysisGoal: string | null
  } | null
  selectedParty: {
    role: string
    name?: string
    type?: 'company' | 'individual' | 'organization' | 'unknown'
  } | null
}

interface DashboardProps {
  scanResult: any
  onExport?: () => void
  onSaveDocument?: () => void
  analysisContext?: AnalysisContext
  onStartNewScan?: () => void
}

interface Comment {
  id: string
  text: string
  timestamp: string
}

export const DocumentScannerDashboard = ({ scanResult, onExport, onSaveDocument, analysisContext, onStartNewScan }: DashboardProps) => {
  const [selectedClause, setSelectedClause] = useState<any>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatState, setChatState] = useState<{
    messages: Array<{ role: string; content: string; timestamp: string }>;
    isLoading: boolean;
    error: string | null;
  }>({
    messages: [],
    isLoading: false,
    error: null
  })
  const [chatInput, setChatInput] = useState('')
  
  // Annotation panel state
  const [selectedRiskFinding, setSelectedRiskFinding] = useState<any>(null)
  const [userComments, setUserComments] = useState<Record<string, Comment[]>>({})
  const [reviewedClauses, setReviewedClauses] = useState<Set<string>>(new Set())
  
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Handle adding a comment to a clause
  const handleSaveComment = useCallback((clauseRef: string, commentText: string) => {
    const newComment: Comment = {
      id: crypto.randomUUID(),
      text: commentText,
      timestamp: new Date().toISOString()
    }
    setUserComments(prev => ({
      ...prev,
      [clauseRef]: [...(prev[clauseRef] || []), newComment]
    }))
    toast({
      title: "Comment saved",
      description: "Your comment has been added to this clause."
    })
  }, [toast])
  
  // Handle toggling reviewed status
  const handleToggleReviewed = useCallback((clauseRef: string, reviewed: boolean) => {
    setReviewedClauses(prev => {
      const newSet = new Set(prev)
      if (reviewed) {
        newSet.add(clauseRef)
      } else {
        newSet.delete(clauseRef)
      }
      return newSet
    })
  }, [])

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !scanResult) return
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the document chat feature",
        variant: "destructive"
      })
      return
    }

    const userMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    }

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null
    }))
    
    setChatInput('')

    try {
      const { data, error } = await supabase.functions.invoke('ocr-document-chat', {
        body: {
          question: chatInput,
          documentText: scanResult.extracted_text,
          documentAnalysis: scanResult.metadata?.document_analysis,
          complianceSummary: scanResult.metadata?.compliance_summary,
          conversationHistory: chatState.messages
        }
      })

      if (error) throw error

      const assistantMessage = {
        role: 'assistant',
        content: data.answer,
        timestamp: data.timestamp
      }

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false
      }))

    } catch (error) {
      console.error('Chat error:', error)
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to get response. Please try again.'
      }))
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  if (!scanResult) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <Icon name="search" className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Document Scanned</h3>
          <p className="text-muted-foreground">Upload a document to begin analysis</p>
        </div>
      </div>
    )
  }
  
  // Calculate compliance score
  const complianceScore = scanResult.metadata?.compliance_summary?.overall_compliance_percentage || 0
  const riskScore = scanResult.substantive_risk_analysis?.overall_risk_score || 0
  
  // Transform clauses for grid
  const clauseCards = (scanResult.metadata?.detected_clauses || []).map((clause: any) => ({
    type: clause.type,
    displayName: clause.type.replace(/_/g, ' ').toUpperCase(),
    icon: getClauseIcon(clause.type),
    color: getClauseColor(clause.type),
    confidence: clause.ai_confidence,
    text: clause.text
  }))
  
  // Extract key issues
  const keyIssues = [
    ...(scanResult.metadata?.compliance_summary?.violations || [])
      .filter((v: any) => v.severity === 'critical' || v.severity === 'high')
      .slice(0, 3)
      .map((v: any) => ({
        title: v.rule.requirement,
        severity: v.severity,
        description: v.details,
        icon: 'alert-triangle'
      })),
    ...(scanResult.substantive_risk_analysis?.risk_findings || [])
      .filter((r: any) => r.severity === 'critical' || r.severity === 'high')
      .slice(0, 3)
      .map((r: any) => ({
        title: r.risk_type.replace(/_/g, ' ').toUpperCase(),
        severity: r.severity,
        description: r.substantive_issue,
        icon: 'shield'
      }))
  ]
  
  // Transform structured summary based on selected party
  const transformedStructuredSummary = useMemo((): StructuredSummary | null => {
    const raw = scanResult.structured_summary
    if (!raw?.contract_overview) return null

    const selectedRole = analysisContext?.selectedParty?.role?.toLowerCase()
    const partyARole = raw.contract_overview.party_a_role?.toLowerCase() || ''
    const partyBRole = raw.contract_overview.party_b_role?.toLowerCase() || ''
    
    // Determine if user is Party A or Party B based on selected role
    const isPartyA = selectedRole && (
      partyARole.includes(selectedRole) || 
      selectedRole.includes(partyARole) ||
      selectedRole === 'party a'
    )
    const isPartyB = selectedRole && !isPartyA && (
      partyBRole.includes(selectedRole) || 
      selectedRole.includes(partyBRole) ||
      selectedRole === 'party b'
    )
    
    // Default to Party A perspective if no clear match
    const userIsPartyA = !selectedRole || isPartyA || !isPartyB

    return {
      contractOverview: {
        description: raw.contract_overview.description || '',
        userRole: userIsPartyA ? raw.contract_overview.party_a_role : raw.contract_overview.party_b_role,
        counterparty: userIsPartyA ? raw.contract_overview.party_b_role : raw.contract_overview.party_a_role
      },
      financials: {
        payments: userIsPartyA 
          ? (raw.financial_terms?.party_a_payments || [])
          : (raw.financial_terms?.party_b_payments || []),
        receipts: userIsPartyA 
          ? (raw.financial_terms?.party_a_receipts || [])
          : (raw.financial_terms?.party_b_receipts || [])
      },
      keyDates: {
        startDate: raw.key_dates?.start_date || null,
        endDate: raw.key_dates?.end_date || null,
        noticePeriod: raw.key_dates?.notice_period || null,
        renewalTerms: raw.key_dates?.renewal_terms || null
      },
      termination: {
        userRights: userIsPartyA 
          ? (raw.termination?.party_a_rights || [])
          : (raw.termination?.party_b_rights || []),
        counterpartyRights: userIsPartyA 
          ? (raw.termination?.party_b_rights || [])
          : (raw.termination?.party_a_rights || []),
        penalties: raw.termination?.penalties || [],
        refundRules: raw.termination?.refund_rules || []
      },
      autoRenewal: {
        hasAutoRenewal: raw.auto_renewal?.has_auto_renewal || false,
        details: raw.auto_renewal?.details || null
      },
      obligations: {
        userObligations: userIsPartyA 
          ? (raw.obligations?.party_a_obligations || [])
          : (raw.obligations?.party_b_obligations || []),
        counterpartyObligations: userIsPartyA 
          ? (raw.obligations?.party_b_obligations || [])
          : (raw.obligations?.party_a_obligations || [])
      }
    }
  }, [scanResult.structured_summary, analysisContext?.selectedParty])
  
  return (
    <div className="h-full flex flex-col">
      {/* Header Actions */}
      <div className="border-b bg-card p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {scanResult.metadata?.document_analysis?.document_type || 'Document'} Analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            Scanned {new Date(scanResult.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {onStartNewScan && (
            <Button variant="ghost" onClick={onStartNewScan}>
              <Icon name="plus" className="h-4 w-4 mr-2" />
              New Scan
            </Button>
          )}
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Icon name="download" className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          )}
          {onSaveDocument && (
            <Button onClick={onSaveDocument}>
              <Icon name="save" className="h-4 w-4 mr-2" />
              Save Document
            </Button>
          )}
        </div>
      </div>
      
      {/* Analysis Context Banner */}
      {(analysisContext?.questionnaire || analysisContext?.selectedParty) && (
        <div className="border-b bg-primary/5 px-4 py-3 flex items-center gap-6 flex-wrap">
          {analysisContext?.selectedParty && (
            <div className="flex items-center gap-2">
              <Icon name="user" className="h-4 w-4 text-primary" />
              <span className="text-sm">
                <span className="text-muted-foreground">Your role:</span>{' '}
                <span className="font-medium">{analysisContext.selectedParty.role}</span>
              </span>
            </div>
          )}
          {analysisContext?.questionnaire?.contractType && (
            <div className="flex items-center gap-2">
              <Icon name="file-text" className="h-4 w-4 text-primary" />
              <span className="text-sm">
                <span className="text-muted-foreground">Type:</span>{' '}
                <span className="font-medium capitalize">{analysisContext.questionnaire.contractType.replace(/_/g, ' ')}</span>
              </span>
            </div>
          )}
          {analysisContext?.questionnaire?.analysisGoal && (
            <div className="flex items-center gap-2">
              <Icon name="target" className="h-4 w-4 text-primary" />
              <span className="text-sm">
                <span className="text-muted-foreground">Focus:</span>{' '}
                <span className="font-medium capitalize">{analysisContext.questionnaire.analysisGoal}</span>
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Resizable Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Main Analysis Panel */}
        <ResizablePanel defaultSize={isChatOpen ? 60 : 100} minSize={30}>
          <ScrollArea className="h-full">
            <div className="container py-6 space-y-6">
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Compliance Score */}
                <Card>
                  <CardContent className="pt-6 flex justify-center">
                    <ComplianceScoreCircle
                      score={Math.round(complianceScore)}
                      label="Compliance Score"
                      subtitle="Overall document compliance"
                      tooltipContent={{
                        title: "Compliance Score",
                        description: "Measures how well this document adheres to UAE legal requirements and standard contract provisions.",
                        factors: [
                          "Required clauses present",
                          "UAE Civil Code compliance",
                          "PDPL (Privacy) compliance",
                          "Standard legal formatting",
                          "Regulatory requirements met"
                        ]
                      }}
                    />
                  </CardContent>
                </Card>
                
                {/* Risk Score */}
                <Card>
                  <CardContent className="pt-6 flex justify-center">
                    <ComplianceScoreCircle
                      score={Math.round(100 - riskScore)}
                      label="Risk Assessment"
                      subtitle="Substantive legal risks"
                      tooltipContent={{
                        title: "Risk Assessment",
                        description: "Evaluates substantive legal risks that could affect enforceability or lead to disputes.",
                        factors: [
                          "Unfair or one-sided terms",
                          "Hidden obligations",
                          "Employment misclassification",
                          "Penalty proportionality",
                          "Good faith violations"
                        ]
                      }}
                    />
                  </CardContent>
                </Card>
                
                {/* Document Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Document Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-semibold">{scanResult.metadata?.document_analysis?.document_subtype || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Jurisdiction</p>
                      <p className="font-semibold">{scanResult.metadata?.document_analysis?.jurisdiction || 'UAE'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Word Count</p>
                      <p className="font-semibold">{scanResult.word_count?.toLocaleString() || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* AI Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="star" className="h-5 w-5" />
                    AI Summary and Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[400px]">
                    <div className="prose prose-sm max-w-none dark:prose-invert pr-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {scanResult.ai_summary || 'No summary available'}
                      </ReactMarkdown>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* Structured Contract Breakdown */}
              {transformedStructuredSummary && (
                <StructuredContractSummary 
                  summary={transformedStructuredSummary}
                  selectedParty={analysisContext?.selectedParty}
                  counterpartyLabel={transformedStructuredSummary.contractOverview.counterparty}
                />
              )}
              
              {/* Key Issues */}
              {keyIssues.length > 0 && (
                <KeyIssuesSummary issues={keyIssues} />
              )}
              
              {/* Detected Clauses */}
              {clauseCards.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="grid" className="h-5 w-5" />
                      Detected Clauses
                    </CardTitle>
                      <Badge variant="secondary">
                        {clauseCards.length} clauses found
                      </Badge>
                    </div>
                    <CardDescription>
                      Click on any clause to view details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[400px]">
                      <ClauseDetectionGrid 
                        clauses={clauseCards}
                        onClauseClick={setSelectedClause}
                      />
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
              
              {/* Full Contract Text with Highlighted Clauses */}
              {scanResult.extracted_text && (
                <ContractTextViewer
                  contractText={scanResult.extracted_text}
                  riskFindings={scanResult.substantive_risk_analysis?.risk_findings || []}
                  onClauseClick={setSelectedRiskFinding}
                  selectedClause={selectedRiskFinding}
                  userComments={Object.fromEntries(
                    Object.entries(userComments).map(([key, comments]) => [key, comments.map(c => c.text)])
                  )}
                />
              )}
            </div>
          </ScrollArea>
        </ResizablePanel>

        {/* Resizable Handle */}
        {isChatOpen && <ResizableHandle withHandle />}

        {/* Chat Panel */}
        {isChatOpen && (
          <ResizablePanel defaultSize={40} minSize={30} maxSize={70}>
            <div className="h-full flex flex-col bg-card border-l">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon name="message-circle" className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Document Q&A</h3>
                    <p className="text-sm text-muted-foreground">
                      Ask questions about this document
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(false)}
                >
                  <Icon name="x" className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-4">
                  {chatState.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 rounded-full bg-primary/10 mb-4">
                        <Icon name="sparkles" className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Start a Conversation</h3>
                      <p className="text-muted-foreground text-sm max-w-sm">
                        Ask me anything about this document - compliance issues, clauses, risks, or recommendations.
                      </p>
                    </div>
                  ) : (
                    chatState.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon name="bot" className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`rounded-lg px-4 py-3 max-w-[85%] ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </div>
                          <div className={`text-xs mt-1 ${
                            msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        {msg.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <Icon name="user" className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {chatState.isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon name="bot" className="h-4 w-4 text-primary" />
                      </div>
                      <div className="rounded-lg px-4 py-3 bg-muted">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {chatState.error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      <Icon name="alert-circle" className="h-4 w-4" />
                      {chatState.error}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="border-t p-4 bg-muted/30">
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question about this document..."
                    disabled={chatState.isLoading}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={!chatInput.trim() || chatState.isLoading}
                    size="icon"
                  >
                    <Icon name="send" className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>

      {/* Floating Chat Button - Only show when chat is closed */}
      {scanResult && !isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 px-5 py-3 group"
          aria-label="Open Document Q&A Assistant"
        >
          <Icon name="message-circle" className="h-5 w-5" />
          <span className="font-medium hidden sm:inline">Ask Questions</span>
        </button>
      )}
      
      {/* Clause Detail Modal */}
      <Dialog open={!!selectedClause} onOpenChange={() => setSelectedClause(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon 
                name={selectedClause?.icon || 'file-text'} 
                className="h-5 w-5" 
                style={{ color: selectedClause?.color }}
              />
              {selectedClause?.displayName}
            </DialogTitle>
            <DialogDescription>
              Clause details and extracted text
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedClause?.confidence && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">AI Confidence</span>
                <Badge variant="secondary">
                  {Math.round(selectedClause.confidence * 100)}% match
                </Badge>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-semibold mb-2">Extracted Clause Text</h4>
              <ScrollArea className="max-h-[400px]">
                <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                  {selectedClause?.text || 'No text available'}
                </div>
              </ScrollArea>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (selectedClause?.text) {
                    setChatInput(`Tell me more about this ${selectedClause.displayName} clause: "${selectedClause.text.substring(0, 100)}..."`)
                    setIsChatOpen(true)
                    setSelectedClause(null)
                  }
                }}
              >
                <Icon name="message-circle" className="h-4 w-4 mr-2" />
                Ask AI About This
              </Button>
              <Button variant="secondary" onClick={() => setSelectedClause(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Risk Finding Annotation Sheet */}
      <Sheet open={!!selectedRiskFinding} onOpenChange={(open) => !open && setSelectedRiskFinding(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0">
          {selectedRiskFinding && (
            <ClauseAnnotationPanel
              finding={selectedRiskFinding}
              onClose={() => setSelectedRiskFinding(null)}
              comments={userComments[selectedRiskFinding.clause_reference] || []}
              onSaveComment={(comment) => handleSaveComment(selectedRiskFinding.clause_reference, comment)}
              onScrollToClause={() => {
                const element = document.querySelector(`[data-clause-ref="${selectedRiskFinding.clause_reference}"]`)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              }}
              isReviewed={reviewedClauses.has(selectedRiskFinding.clause_reference)}
              onToggleReviewed={(reviewed) => handleToggleReviewed(selectedRiskFinding.clause_reference, reviewed)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Helper functions
function getClauseIcon(type: string): string {
  const icons: Record<string, string> = {
    termination: 'close',
    confidentiality: 'lock',
    payment: 'credit-card',
    liability: 'shield',
    intellectual_property: 'bulb',
    dispute_resolution: 'scale',
    warranties: 'check',
    duration: 'clock',
    parties: 'users',
    obligations: 'list',
    force_majeure: 'alert-triangle',
    non_compete: 'close',
    amendments: 'edit',
    notices: 'bell',
    definitions: 'book'
  }
  return icons[type] || 'file-text'
}

function getClauseColor(type: string): string {
  const colors: Record<string, string> = {
    termination: '#ef4444',
    confidentiality: '#8b5cf6',
    payment: '#10b981',
    liability: '#f59e0b',
    intellectual_property: '#06b6d4',
    dispute_resolution: '#6366f1',
    warranties: '#84cc16',
    duration: '#ec4899',
    parties: '#14b8a6',
    obligations: '#64748b',
    force_majeure: '#f97316',
    non_compete: '#dc2626',
    amendments: '#0ea5e9',
    notices: '#a855f7',
    definitions: '#22c55e'
  }
  return colors[type] || '#94a3b8'
}
