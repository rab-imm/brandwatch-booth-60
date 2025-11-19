import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface OCRRecord {
  id: string
  file_name: string
  file_type: string
  extracted_text: string
  ai_summary: string
  character_count: number
  word_count: number
  processing_time_ms: number
  created_at: string
  metadata?: any
  substantive_risk_analysis?: any
}

interface OCRHistoryProps {
  onRecordSelect?: (record: OCRRecord) => void
}

export const OCRHistory = ({ onRecordSelect }: OCRHistoryProps = {}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [history, setHistory] = useState<OCRRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<OCRRecord | null>(null)
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'non_compliant' | 'partial' | 'compliant'>('all')
  const [missingClauseFilter, setMissingClauseFilter] = useState<'all' | 'has_missing' | 'has_essential' | 'complete'>('all')

  useEffect(() => {
    if (user) {
      loadHistory()
    }
  }, [user])

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ocr_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setHistory(data || [])
    } catch (error) {
      console.error('Error loading OCR history:', error)
      toast({
        title: "Error",
        description: "Failed to load scan history",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    })
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Icon name="loader" className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Icon name="file" className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No contract scans yet</p>
            <p className="text-sm">Upload a document to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const filteredHistory = history.filter(record => {
    if (complianceFilter !== 'all') {
      const score = record.metadata?.compliance_check?.compliance_score || 0
      if (complianceFilter === 'non_compliant' && score >= 70) return false
      if (complianceFilter === 'partial' && (score < 70 || score >= 90)) return false
      if (complianceFilter === 'compliant' && score < 90) return false
    }
    
    if (missingClauseFilter !== 'all') {
      const missingCount = record.metadata?.missing_clauses?.total_missing || 0
      const essentialCount = record.metadata?.missing_clauses?.essential_count || 0
      if (missingClauseFilter === 'has_missing' && missingCount === 0) return false
      if (missingClauseFilter === 'has_essential' && essentialCount === 0) return false
      if (missingClauseFilter === 'complete' && missingCount > 0) return false
    }
    
    return true
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="history" className="h-5 w-5" />
                Contract Scan History
              </CardTitle>
              <CardDescription>
                Your recent document scans
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={complianceFilter}
                onChange={(e) => setComplianceFilter(e.target.value as any)}
                className="text-sm border rounded px-3 py-1.5 bg-background"
              >
                <option value="all">All Documents</option>
                <option value="non_compliant">Non-Compliant (&lt;70%)</option>
                <option value="partial">Partially Compliant (70-89%)</option>
                <option value="compliant">Fully Compliant (≥90%)</option>
              </select>
              <select
                value={missingClauseFilter}
                onChange={(e) => setMissingClauseFilter(e.target.value as any)}
                className="text-sm border rounded px-3 py-1.5 bg-background"
              >
                <option value="all">All Clause Status</option>
                <option value="has_missing">Has Missing Clauses</option>
                <option value="has_essential">Missing Essential Clauses</option>
                <option value="complete">Complete Documents</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredHistory.map((record) => (
              <div
                key={record.id}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedRecord(record)
                  if (onRecordSelect) {
                    onRecordSelect(record)
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon 
                        name={record.file_type === 'application/pdf' ? 'file-text' : 'image'} 
                        className="h-4 w-4" 
                      />
                      <h3 className="font-medium text-sm">{record.file_name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {record.ai_summary.substring(0, 150)}...
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span>{record.word_count} words</span>
                      <span>{record.character_count} chars</span>
                      {record.metadata?.total_clauses && (
                        <span className="flex items-center gap-1 font-medium text-primary">
                          <Icon name="tag" className="h-3 w-3" />
                          {record.metadata.total_clauses} clauses
                        </span>
                      )}
                      {record.metadata?.compliance_check && (
                        <Badge 
                          variant={
                            record.metadata.compliance_check.compliance_score >= 90 ? 'default' :
                            record.metadata.compliance_check.compliance_score >= 70 ? 'secondary' :
                            'destructive'
                          }
                          className="flex items-center gap-1"
                        >
                          <Icon name="shield" className="h-3 w-3" />
                          {record.metadata.compliance_check.compliance_score}%
                          {record.metadata.compliance_check.critical_count > 0 && (
                            <span className="ml-1">({record.metadata.compliance_check.critical_count} critical)</span>
                          )}
                        </Badge>
                      )}
                      {record.metadata?.missing_clauses && record.metadata.missing_clauses.total_missing > 0 && (
                        <Badge className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600">
                          <Icon name="alert-triangle" className="h-3 w-3" />
                          {record.metadata.missing_clauses.total_missing} Missing
                          {record.metadata.missing_clauses.essential_count > 0 && (
                            <span className="ml-1 text-red-100 font-bold">
                              ({record.metadata.missing_clauses.essential_count} essential)
                            </span>
                          )}
                        </Badge>
                      )}
                      <span>{formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedRecord && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedRecord.file_name}</CardTitle>
                <CardDescription>
                  {selectedRecord.word_count} words · {selectedRecord.character_count} characters · 
                  Processed in {(selectedRecord.processing_time_ms / 1000).toFixed(1)}s
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedRecord(null)}
              >
                <Icon name="x" className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">AI Summary</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(selectedRecord.ai_summary)}
                >
                  <Icon name="copy" className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-lg prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedRecord.ai_summary}
                </ReactMarkdown>
              </div>
            </div>

            {/* Detected Clauses Section */}
            {selectedRecord.metadata?.clauses && selectedRecord.metadata.clauses.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Icon name="tag" className="h-4 w-4" />
                  Detected Clauses ({selectedRecord.metadata.total_clauses})
                </h3>
                
                {/* Clause Tags */}
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-muted/30 rounded-lg">
                  {selectedRecord.metadata.clause_stats?.map(stat => (
                    <div
                      key={stat.type}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-2"
                      style={{ 
                        backgroundColor: getClauseColor(stat.type) + '20',
                        borderColor: getClauseColor(stat.type),
                        color: getClauseColor(stat.type)
                      }}
                    >
                      <Icon name={getClauseIcon(stat.type)} className="h-3 w-3" />
                      <span className="capitalize">{stat.type.replace(/_/g, ' ')}</span>
                      <span className="ml-0.5 font-bold">({stat.count})</span>
                    </div>
                  ))}
                </div>
                
                {/* Clause List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {selectedRecord.metadata.clauses.map((clause, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-muted/50 rounded border-l-4"
                      style={{ borderLeftColor: getClauseColor(clause.type) }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ 
                            backgroundColor: getClauseColor(clause.type) + '20',
                            color: getClauseColor(clause.type)
                          }}
                        >
                          <Icon name={getClauseIcon(clause.type)} className="h-3 w-3" />
                          {clause.type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        {clause.ai_confidence && (
                          <span className="text-xs text-muted-foreground">
                            {Math.round(clause.ai_confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <p className="text-xs line-clamp-2 text-foreground/80">{clause.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Extracted Text</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(selectedRecord.extracted_text)}
                >
                  <Icon name="copy" className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto whitespace-pre-wrap text-sm font-mono">
                {selectedRecord.extracted_text}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
