import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { formatDistanceToNow } from "date-fns"

interface SavedDocument {
  id: string
  file_name: string
  file_type: string
  custom_title: string | null
  scan_results: any
  created_at: string
}

interface SavedDocumentViewerProps {
  document: SavedDocument | null
  isOpen: boolean
  onClose: () => void
  onDelete: (id: string) => void
}

export const SavedDocumentViewer = ({ document, isOpen, onClose, onDelete }: SavedDocumentViewerProps) => {
  const [complianceCheckExpanded, setComplianceCheckExpanded] = useState(true)
  const [complianceIssuesExpanded, setComplianceIssuesExpanded] = useState(false)
  const [missingClausesExpanded, setMissingClausesExpanded] = useState(false)
  const [expandedViolations, setExpandedViolations] = useState<Set<number>>(new Set())
  const [expandedMissingClauses, setExpandedMissingClauses] = useState<Set<number>>(new Set())

  if (!document) return null

  const result = document.scan_results

  const toggleExpanded = (index: number, currentSet: Set<number>, setter: (set: Set<number>) => void) => {
    const newSet = new Set(currentSet)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setter(newSet)
  }

  const getClauseIcon = (type: string): string => {
    const icons: Record<string, string> = {
      termination: 'x-circle',
      confidentiality: 'lock',
      payment: 'credit-card',
      liability: 'shield',
      intellectual_property: 'lightbulb',
      dispute_resolution: 'scale',
      warranties: 'check-circle',
      duration: 'clock',
      parties: 'users',
      obligations: 'list',
      force_majeure: 'alert-triangle',
      non_compete: 'ban',
      amendments: 'edit',
      notices: 'bell',
      definitions: 'book'
    }
    return icons[type] || 'tag'
  }

  const getClauseColor = (type: string): string => {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'essential': return 'bg-red-100 text-red-800 border-red-200'
      case 'recommended': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'optional': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="file-text" className="h-5 w-5" />
            {document.custom_title || document.file_name}
          </DialogTitle>
          <DialogDescription>
            Saved {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-180px)] pr-4">
          <div className="space-y-6">
            {/* Compliance Check Section */}
            {result?.compliance_check && (
              <Collapsible open={complianceCheckExpanded} onOpenChange={setComplianceCheckExpanded}>
                <Card className="border-2 border-primary/20">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon name="shield-check" className="h-6 w-6 text-primary" />
                          </div>
                          <div className="text-left">
                            <CardTitle className="text-xl">UAE Governance Compliance Check</CardTitle>
                            <CardDescription>UAE Federal Laws & Regulations</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-3xl font-bold text-primary">
                              {result.compliance_check.compliance_score}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {result.compliance_check.total_violations} issues found
                            </div>
                          </div>
                          <Icon 
                            name={complianceCheckExpanded ? "chevron-up" : "chevron-down"} 
                            className="h-5 w-5 text-muted-foreground" 
                          />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-6">
                      {/* AI Summary */}
                      {result.compliance_check.ai_summary && (
                        <div className="prose prose-sm max-w-none p-4 rounded-lg bg-muted/50">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {result.compliance_check.ai_summary}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Compliance Issues */}
                      {result.compliance_check.violations && result.compliance_check.violations.length > 0 && (
                        <Collapsible open={complianceIssuesExpanded} onOpenChange={setComplianceIssuesExpanded}>
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer">
                              <div className="flex items-center gap-3">
                                <Icon name="alert-triangle" className="h-5 w-5 text-destructive" />
                                <div className="text-left">
                                  <h3 className="font-semibold">Compliance Issues</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {result.compliance_check.critical_count} critical, {result.compliance_check.high_count} high priority
                                  </p>
                                </div>
                              </div>
                              <Icon 
                                name={complianceIssuesExpanded ? "chevron-up" : "chevron-down"} 
                                className="h-5 w-5 text-muted-foreground" 
                              />
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="mt-4 space-y-3">
                              {result.compliance_check.violations.map((violation: any, index: number) => (
                                <div
                                  key={index}
                                  className={`p-4 rounded-lg border-2 ${getSeverityColor(violation.severity)} cursor-pointer hover:shadow-md transition-shadow`}
                                  onClick={() => toggleExpanded(index, expandedViolations, setExpandedViolations)}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs font-medium">
                                          {violation.rule.article}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {violation.severity.toUpperCase()}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {violation.rule.category}
                                        </Badge>
                                      </div>
                                      <h4 className="font-semibold text-sm mb-1">
                                        {violation.rule.requirement}
                                      </h4>
                                      {expandedViolations.has(index) && (
                                        <div className="mt-3 space-y-2 text-sm">
                                          <p><strong>Issue:</strong> {violation.details}</p>
                                          <p><strong>Recommended Action:</strong> {violation.recommended_action}</p>
                                          {violation.related_text && (
                                            <div className="mt-2 p-2 bg-background/50 rounded border">
                                              <p className="text-xs text-muted-foreground mb-1">Related Contract Text:</p>
                                              <p className="text-xs italic">{violation.related_text}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <Icon 
                                      name={expandedViolations.has(index) ? "chevron-up" : "chevron-down"} 
                                      className="h-4 w-4 flex-shrink-0 mt-1" 
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* Missing Clauses */}
                      {result.missing_clauses && result.missing_clauses.suggestions && result.missing_clauses.suggestions.length > 0 && (
                        <Collapsible open={missingClausesExpanded} onOpenChange={setMissingClausesExpanded}>
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-warning/5 hover:bg-warning/10 transition-colors cursor-pointer">
                              <div className="flex items-center gap-3">
                                <Icon name="alert-circle" className="h-5 w-5 text-warning" />
                                <div className="text-left">
                                  <h3 className="font-semibold">Missing Clauses</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {result.missing_clauses.essential_count} essential, {result.missing_clauses.recommended_count} recommended
                                  </p>
                                </div>
                              </div>
                              <Icon 
                                name={missingClausesExpanded ? "chevron-up" : "chevron-down"} 
                                className="h-5 w-5 text-muted-foreground" 
                              />
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="mt-4 space-y-3">
                              {result.missing_clauses.suggestions.map((clause: any, index: number) => (
                                <div
                                  key={index}
                                  className={`p-4 rounded-lg border-2 ${getImportanceColor(clause.importance)} cursor-pointer hover:shadow-md transition-shadow`}
                                  onClick={() => toggleExpanded(index, expandedMissingClauses, setExpandedMissingClauses)}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs font-medium">
                                          {clause.importance.toUpperCase()}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {clause.category}
                                        </Badge>
                                      </div>
                                      <h4 className="font-semibold text-sm mb-1">
                                        {clause.display_name}
                                      </h4>
                                      {expandedMissingClauses.has(index) && (
                                        <div className="mt-3 space-y-3 text-sm">
                                          <div>
                                            <p className="font-medium mb-1">Description:</p>
                                            <p>{clause.description}</p>
                                          </div>
                                          <div>
                                            <p className="font-medium mb-1">Why Needed:</p>
                                            <p>{clause.why_needed}</p>
                                          </div>
                                          <div>
                                            <p className="font-medium mb-1">Sample Wording (English):</p>
                                            <div className="p-3 bg-background/50 rounded border text-xs italic">
                                              {clause.sample_wording_en}
                                            </div>
                                          </div>
                                          {clause.related_articles && clause.related_articles.length > 0 && (
                                            <div>
                                              <p className="font-medium mb-1">Related Articles:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {clause.related_articles.map((article: string, i: number) => (
                                                  <Badge key={i} variant="outline" className="text-xs">
                                                    {article}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <Icon 
                                      name={expandedMissingClauses.has(index) ? "chevron-up" : "chevron-down"} 
                                      className="h-4 w-4 flex-shrink-0 mt-1" 
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* OCR Results */}
            <Card>
              <CardHeader>
                <CardTitle>OCR Results</CardTitle>
                <CardDescription>
                  {result.statistics.words} words · {result.statistics.characters} characters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Summary */}
                {result.aiSummary && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon name="sparkles" className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">AI Summary</h3>
                    </div>
                    <div className="prose prose-sm max-w-none p-4 rounded-lg bg-primary/5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {result.aiSummary}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Detected Clauses */}
                {result.clauses && result.clauses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon name="list" className="h-4 w-4" />
                      <h3 className="font-semibold">Detected Clauses ({result.clauses.length})</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.clauses.map((clause: any, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="px-3 py-1"
                          style={{ 
                            borderColor: getClauseColor(clause.type),
                            color: getClauseColor(clause.type)
                          }}
                        >
                          <Icon name={getClauseIcon(clause.type)} className="h-3 w-3 mr-1" />
                          {clause.type.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Text */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon name="file-text" className="h-4 w-4" />
                      <h3 className="font-semibold">Extracted Text</h3>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(result.extractedText)}
                    >
                      <Icon name="copy" className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {result.extractedText}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="destructive" onClick={() => onDelete(document.id)}>
            <Icon name="trash-2" className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
