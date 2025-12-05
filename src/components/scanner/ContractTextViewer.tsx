import { useState, useRef, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface SubstantiveRiskFinding {
  clause_reference: string
  risk_type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  legal_basis: string
  substantive_issue: string
  litigation_risk: string
  affected_clause_text: string
  remediation: string
}

interface ContractTextViewerProps {
  contractText: string
  riskFindings: SubstantiveRiskFinding[]
  onClauseClick: (finding: SubstantiveRiskFinding) => void
  selectedClause?: SubstantiveRiskFinding | null
  userComments?: Record<string, string[]>
}

const severityColors = {
  critical: 'bg-destructive/20 border-destructive hover:bg-destructive/30',
  high: 'bg-orange-500/20 border-orange-500 hover:bg-orange-500/30',
  medium: 'bg-yellow-500/20 border-yellow-500 hover:bg-yellow-500/30',
  low: 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/30'
}

const severityBadgeVariants = {
  critical: 'destructive' as const,
  high: 'default' as const,
  medium: 'secondary' as const,
  low: 'outline' as const
}

export const ContractTextViewer = ({
  contractText,
  riskFindings,
  onClauseClick,
  selectedClause,
  userComments = {}
}: ContractTextViewerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [highlightedSegments, setHighlightedSegments] = useState<Map<number, SubstantiveRiskFinding>>(new Map())

  // Build a map of text positions to findings
  const textSegments = useMemo(() => {
    if (!contractText || !riskFindings?.length) {
      return [{ text: contractText, finding: null, startIndex: 0 }]
    }

    const segments: Array<{ text: string; finding: SubstantiveRiskFinding | null; startIndex: number }> = []
    let currentIndex = 0
    const textLower = contractText.toLowerCase()

    // Sort findings by their position in the text
    const findingsWithPosition = riskFindings
      .map(finding => {
        const clauseText = finding.affected_clause_text?.toLowerCase() || ''
        // Try to find exact match first, then fuzzy match
        let position = textLower.indexOf(clauseText)
        
        // If no exact match, try finding by first 50 chars
        if (position === -1 && clauseText.length > 50) {
          const shortClause = clauseText.substring(0, 50)
          position = textLower.indexOf(shortClause)
        }
        
        // Try finding by clause reference
        if (position === -1 && finding.clause_reference) {
          const refLower = finding.clause_reference.toLowerCase()
          position = textLower.indexOf(refLower)
        }

        return { finding, position, length: finding.affected_clause_text?.length || 0 }
      })
      .filter(f => f.position !== -1)
      .sort((a, b) => a.position - b.position)

    // Build segments
    for (const { finding, position, length } of findingsWithPosition) {
      // Add text before this finding
      if (position > currentIndex) {
        segments.push({
          text: contractText.substring(currentIndex, position),
          finding: null,
          startIndex: currentIndex
        })
      }

      // Add the highlighted finding
      if (position >= currentIndex) {
        const endPos = position + length
        segments.push({
          text: contractText.substring(position, endPos),
          finding,
          startIndex: position
        })
        currentIndex = endPos
      }
    }

    // Add remaining text
    if (currentIndex < contractText.length) {
      segments.push({
        text: contractText.substring(currentIndex),
        finding: null,
        startIndex: currentIndex
      })
    }

    return segments.length > 0 ? segments : [{ text: contractText, finding: null, startIndex: 0 }]
  }, [contractText, riskFindings])

  // Scroll to selected clause
  useEffect(() => {
    if (selectedClause && scrollRef.current) {
      const element = scrollRef.current.querySelector(`[data-clause-ref="${selectedClause.clause_reference}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [selectedClause])

  const issueCount = riskFindings?.length || 0
  const criticalCount = riskFindings?.filter(f => f.severity === 'critical').length || 0
  const highCount = riskFindings?.filter(f => f.severity === 'high').length || 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon name="file-text" className="h-5 w-5" />
            Full Contract Text
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Icon name="alert-circle" className="h-3 w-3" />
                {criticalCount} Critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge variant="default" className="gap-1 bg-orange-500">
                <Icon name="alert-triangle" className="h-3 w-3" />
                {highCount} High
              </Badge>
            )}
            {issueCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                {issueCount} Issues Total
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Click on highlighted sections to view AI analysis and add comments
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] border rounded-lg p-4 bg-muted/30" ref={scrollRef}>
          <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {textSegments.map((segment, index) => {
              if (segment.finding) {
                const isSelected = selectedClause?.clause_reference === segment.finding.clause_reference
                const hasComments = userComments[segment.finding.clause_reference]?.length > 0
                
                return (
                  <span
                    key={index}
                    data-clause-ref={segment.finding.clause_reference}
                    onClick={() => onClauseClick(segment.finding!)}
                    className={cn(
                      "relative cursor-pointer border-l-4 px-2 py-1 rounded-r transition-all inline",
                      severityColors[segment.finding.severity],
                      isSelected && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {segment.text}
                    <span className="inline-flex items-center gap-1 ml-2 align-middle">
                      <Badge 
                        variant={severityBadgeVariants[segment.finding.severity]}
                        className="text-[10px] px-1.5 py-0 h-5 cursor-pointer"
                      >
                        <Icon name="alert-triangle" className="h-3 w-3 mr-1" />
                        {segment.finding.severity.toUpperCase()}
                      </Badge>
                      {hasComments && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          <Icon name="message-square" className="h-3 w-3" />
                        </Badge>
                      )}
                    </span>
                  </span>
                )
              }
              
              return <span key={index}>{segment.text}</span>
            })}
          </div>
        </ScrollArea>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <span className="text-xs text-muted-foreground">Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive/30 border-l-2 border-destructive" />
            <span className="text-xs">Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/30 border-l-2 border-orange-500" />
            <span className="text-xs">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500/30 border-l-2 border-yellow-500" />
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500/30 border-l-2 border-blue-500" />
            <span className="text-xs">Low</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
