import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import { ComplianceScoreCircle } from "./ComplianceScoreCircle"
import { ClauseDetectionGrid } from "./ClauseDetectionGrid"
import { KeyIssuesSummary } from "./KeyIssuesSummary"
import { SubstantiveRiskDisplay } from "../SubstantiveRiskDisplay"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface DashboardProps {
  scanResult: any
  onExport?: () => void
  onSaveDocument?: () => void
}

export const DocumentScannerDashboard = ({ scanResult, onExport, onSaveDocument }: DashboardProps) => {
  const [selectedClause, setSelectedClause] = useState<any>(null)
  
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
      
      {/* Main Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Compliance Score */}
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <ComplianceScoreCircle
                  score={Math.round(complianceScore)}
                  label="Compliance Score"
                  subtitle="Overall document compliance"
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
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {scanResult.ai_summary || 'No summary available'}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
          
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
                <ClauseDetectionGrid 
                  clauses={clauseCards}
                  onClauseClick={setSelectedClause}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Substantive Risk Analysis */}
          {scanResult.substantive_risk_analysis && (
            <SubstantiveRiskDisplay riskAnalysis={scanResult.substantive_risk_analysis} />
          )}
          
        </div>
      </ScrollArea>
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
