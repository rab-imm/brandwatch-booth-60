import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Icon } from "@/components/ui/Icon"

interface SubstantiveRiskFinding {
  clause_reference: string
  risk_type: 'misclassification' | 'unfair_terms' | 'hidden_obligations' | 'employment_risk' | 
              'consent_defect' | 'agency_violation' | 'pdpl_violation' | 'proportionality_breach' | 
              'good_faith_violation' | 'regulatory_gap'
  severity: 'critical' | 'high' | 'medium' | 'low'
  legal_basis: string
  substantive_issue: string
  litigation_risk: string
  affected_clause_text: string
  remediation: string
}

interface SubstantiveRiskAnalysis {
  risk_findings: SubstantiveRiskFinding[]
  true_classification: {
    stated_type: string
    actual_type: string
    is_misclassified: boolean
    reasoning: string
  }
  overall_risk_score: number
  risk_summary: string
}

interface SubstantiveRiskDisplayProps {
  riskAnalysis: SubstantiveRiskAnalysis
}

const getRiskTypeLabel = (type: string): string => {
  return type.replace(/_/g, ' ').toUpperCase()
}

const getRiskTypeIcon = (type: string): string => {
  switch (type) {
    case 'misclassification':
      return 'alert-triangle'
    case 'employment_risk':
      return 'briefcase'
    case 'pdpl_violation':
      return 'shield'
    case 'agency_violation':
      return 'handshake'
    case 'unfair_terms':
      return 'scale'
    case 'proportionality_breach':
      return 'balance-scale'
    default:
      return 'alert-circle'
  }
}

export const SubstantiveRiskDisplay = ({ riskAnalysis }: SubstantiveRiskDisplayProps) => {
  if (!riskAnalysis) return null

  const { risk_findings, true_classification, overall_risk_score, risk_summary } = riskAnalysis

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Icon name="alert-triangle" className="h-5 w-5 text-destructive" />
            Substantive Legal Risk Analysis
          </CardTitle>
          <Badge variant={
            overall_risk_score >= 80 ? "destructive" :
            overall_risk_score >= 60 ? "default" : "secondary"
          }>
            Risk Score: {overall_risk_score}/100
          </Badge>
        </div>
        <CardDescription>
          {risk_summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Document Reclassification Warning */}
        {true_classification.is_misclassified && (
          <Alert variant="destructive">
            <Icon name="alert-circle" className="h-4 w-4" />
            <AlertTitle>⚠️ Document Misclassification Detected</AlertTitle>
            <AlertDescription>
              <p className="font-semibold mb-2">
                This document claims to be a "{true_classification.stated_type}" 
                but is actually a "{true_classification.actual_type}"
              </p>
              <p className="text-sm">
                {true_classification.reasoning}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Risk Findings */}
        {risk_findings.map((risk, idx) => (
          <Card key={idx} className={`border-l-4 ${
            risk.severity === 'critical' ? 'border-l-red-500' :
            risk.severity === 'high' ? 'border-l-orange-500' :
            risk.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon name={getRiskTypeIcon(risk.risk_type)} className="h-4 w-4" />
                    {risk.severity === 'critical' && '🚨'}
                    {risk.severity === 'high' && '⚠️'}
                    {risk.severity === 'medium' && '⚡'}
                    {risk.severity === 'low' && 'ℹ️'}
                    {getRiskTypeLabel(risk.risk_type)}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {risk.legal_basis}
                  </p>
                </div>
                <Badge variant={
                  risk.severity === 'critical' ? 'destructive' : 
                  risk.severity === 'high' ? 'default' : 'secondary'
                }>
                  {risk.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-semibold mb-1">Issue:</p>
                <p className="text-sm">{risk.substantive_issue}</p>
              </div>
              
              {risk.affected_clause_text && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-xs font-semibold mb-1">Affected Clause:</p>
                  <p className="text-xs font-mono">{risk.affected_clause_text}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-semibold mb-1">Litigation Risk:</p>
                <p className="text-sm">{risk.litigation_risk}</p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
                <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <Icon name="check-circle" className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Recommended Action:
                </p>
                <p className="text-sm">{risk.remediation}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {risk_findings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="shield-check" className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-semibold">No Material Legal Risks Detected</p>
            <p className="text-sm">The substantive terms appear legally sound</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
