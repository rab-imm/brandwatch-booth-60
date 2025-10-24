import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ClauseResult {
  type: string
  text: string
  confidence: 'pattern' | 'ai'
  keywords?: string[]
  ai_confidence?: number
  reasoning?: string
}

interface ComplianceViolation {
  rule: {
    article: string
    category: string
    requirement: string
    requirement_ar?: string
  }
  found: boolean
  violation_type: 'missing' | 'non_compliant' | 'ambiguous' | 'compliant'
  details: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  recommended_action: string
  related_text?: string
}

export const OCRUpload = () => {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<{
    extractedText: string
    aiSummary: string
    clauses?: ClauseResult[]
    clause_stats?: { type: string; count: number; total_characters: number }[]
    statistics: {
      characters: number
      words: number
      processing_time_ms: number
      clauses_detected?: number
    }
    compliance_check?: {
      violations: ComplianceViolation[]
      compliance_score: number
      total_violations: number
      critical_count: number
      high_count: number
      ai_summary: string
    }
  } | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF or image files (JPG, PNG, WEBP)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 10MB",
        variant: "destructive"
      })
      return
    }

    setSelectedFile(file)
    setResult(null)
  }

  const processOCR = async () => {
    if (!selectedFile || !user) return

    // Check credits
    const availableCredits = (profile?.subscription_credits || 10) - (profile?.queries_used || 0)
    if (availableCredits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 credit to scan a document",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setUploadProgress(0)

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      setUploadProgress(20)

      const { error: uploadError } = await supabase.storage
        .from('ocr-documents')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      setUploadProgress(40)

      // Process OCR
      const { data, error } = await supabase.functions.invoke('process-ocr-document', {
        body: {
          file_path: fileName,
          user_id: user.id,
          company_id: profile?.current_company_id || null,
          file_name: selectedFile.name,
          file_type: selectedFile.type
        }
      })

      setUploadProgress(80)

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'OCR processing failed')
      }

      // Update user credits
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          queries_used: (profile?.queries_used || 0) + 1 
        })
        .eq('user_id', user.id)

      if (updateError) console.error('Error updating credits:', updateError)

      setUploadProgress(100)

      setResult({
        extractedText: data.extracted_text,
        aiSummary: data.ai_summary,
        clauses: data.clauses || [],
        clause_stats: data.clause_stats || [],
        statistics: data.statistics
      })

      toast({
        title: "OCR Complete",
        description: `Successfully extracted ${data.statistics.words} words in ${(data.statistics.processing_time_ms / 1000).toFixed(1)}s`,
      })

      setSelectedFile(null)

    } catch (error: any) {
      console.error('OCR error:', error)
      toast({
        title: "OCR Failed",
        description: error.message || "Failed to process document. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
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
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="scan" className="h-5 w-5" />
            OCR Document Scanner
          </CardTitle>
          <CardDescription>
            Upload a PDF or image to extract text and get an AI summary (1 credit per scan)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Supported: PDF, JPG, PNG, WEBP (Max 10MB)
            </p>
          </div>

          {selectedFile && (
            <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="file" className="h-4 w-4" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <Button
                size="sm"
                onClick={processOCR}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon name="scan" className="h-4 w-4 mr-2" />
                    Scan Document
                  </>
                )}
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-muted-foreground">
                {uploadProgress < 40 ? 'Uploading...' : uploadProgress < 80 ? 'Processing OCR...' : 'Finalizing...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* UAE Labour Law Compliance Check */}
      {result?.compliance_check && (
        <Card className={`border-2 ${
          result.compliance_check.compliance_score >= 90 ? 'border-green-500' :
          result.compliance_check.compliance_score >= 70 ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="shield" className="h-5 w-5" />
              UAE Labour Law Compliance Check
            </CardTitle>
            <CardDescription>
              Cross-referenced with Federal Decree-Law No. 33 of 2021
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted" />
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - result.compliance_check.compliance_score / 100)}`}
                    className={result.compliance_check.compliance_score >= 90 ? 'text-green-500' : result.compliance_check.compliance_score >= 70 ? 'text-yellow-500' : 'text-red-500'} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold">{result.compliance_check.compliance_score}%</span>
                  <span className="text-xs text-muted-foreground">Compliant</span>
                </div>
              </div>
              <div className="flex-1 ml-6 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {result.compliance_check.critical_count > 0 && <Badge variant="destructive">{result.compliance_check.critical_count} Critical</Badge>}
                  {result.compliance_check.high_count > 0 && <Badge className="bg-orange-500 hover:bg-orange-600">{result.compliance_check.high_count} High</Badge>}
                  <Badge variant="secondary">{result.compliance_check.total_violations} Total Issues</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{result.compliance_check.ai_summary}</p>
              </div>
            </div>
            {result.compliance_check.violations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Icon name="alert-triangle" className="h-4 w-4" />
                  Compliance Issues ({result.compliance_check.violations.length})
                </h4>
                {result.compliance_check.violations.map((v, i) => (
                  <div key={i} className={`p-4 rounded-lg border-l-4 ${v.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : v.severity === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : v.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${v.severity === 'critical' ? 'bg-red-500 text-white' : v.severity === 'high' ? 'bg-orange-500 text-white' : v.severity === 'medium' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'}`}>{v.severity}</span>
                        <Badge variant="outline">{v.rule.article}</Badge>
                      </div>
                      <Icon name={v.violation_type === 'missing' ? 'alert-circle' : 'x-circle'} className="h-5 w-5 text-red-500" />
                    </div>
                    <h5 className="font-semibold text-sm mb-1">{v.violation_type === 'missing' ? '❌ Missing Clause' : '⚠️ Non-Compliant'}</h5>
                    <p className="text-sm mb-2">{v.details}</p>
                    {v.related_text && (
                      <div className="text-xs bg-background/50 p-2 rounded mb-2 font-mono line-clamp-2">
                        "{v.related_text}..."
                      </div>
                    )}
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded mt-2">
                      <p className="text-xs font-semibold mb-1">✅ Recommended Action:</p>
                      <p className="text-xs">{v.recommended_action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>OCR Results</CardTitle>
            <CardDescription>
              {result.statistics.words} words · {result.statistics.characters} characters · 
              Processed in {(result.statistics.processing_time_ms / 1000).toFixed(1)}s
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Detected Clauses - Colored Tags Above Text */}
            {result.clauses && result.clauses.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Icon name="tag" className="h-4 w-4" />
                  Detected Clauses ({result.clauses.length})
                </h3>
                
                {/* Clause Tags Grid */}
                <div className="flex flex-wrap gap-2 mb-4 p-4 bg-muted/30 rounded-lg border">
                  {result.clause_stats?.map(stat => (
                    <div
                      key={stat.type}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all hover:scale-105 cursor-default"
                      style={{ 
                        backgroundColor: getClauseColor(stat.type) + '20',
                        borderColor: getClauseColor(stat.type),
                        color: getClauseColor(stat.type)
                      }}
                    >
                      <Icon 
                        name={getClauseIcon(stat.type)} 
                        className="h-3.5 w-3.5" 
                      />
                      <span className="capitalize font-semibold">
                        {stat.type.replace(/_/g, ' ')}
                      </span>
                      <span className="ml-1 px-1.5 py-0.5 bg-white/50 dark:bg-black/30 rounded-full text-[10px] font-bold">
                        {stat.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              result.statistics.clauses_detected === 0 && (
                <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground text-center">
                    <Icon name="info" className="h-4 w-4 inline mr-2" />
                    No legal clauses detected in this document. This may occur with non-legal documents or documents requiring additional language support.
                  </p>
                </div>
              )
            )}

            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Icon name="file-text" className="h-4 w-4" />
                Extracted Text
              </h3>
              <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto whitespace-pre-wrap text-sm font-mono">
                {result.extractedText}
              </div>
            </div>

            {/* Detailed Clause Breakdown */}
            {result.clauses && result.clauses.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Icon name="list" className="h-4 w-4" />
                  Clause Details
                </h3>
                
                <div className="space-y-3">
                  {result.clauses.map((clause, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 bg-muted/50 rounded-lg border-l-4 hover:bg-muted transition-colors"
                      style={{ borderLeftColor: getClauseColor(clause.type) }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ 
                              backgroundColor: getClauseColor(clause.type) + '20',
                              color: getClauseColor(clause.type)
                            }}
                          >
                            <Icon name={getClauseIcon(clause.type)} className="h-3 w-3" />
                            {clause.type.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          
                          <span className="px-2 py-0.5 bg-background rounded text-xs border">
                            {clause.confidence === 'ai' ? '🤖 AI Detected' : '🔍 Pattern Match'}
                          </span>
                          
                          {clause.ai_confidence && (
                            <span className="text-xs font-medium text-muted-foreground">
                              {Math.round(clause.ai_confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(clause.text)}
                          className="shrink-0"
                        >
                          <Icon name="copy" className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">
                        {clause.text.substring(0, 300)}
                        {clause.text.length > 300 && '...'}
                      </p>
                      
                      {clause.reasoning && (
                        <div className="mt-2 p-2 bg-background/50 rounded text-xs text-muted-foreground italic border-l-2 border-primary/30">
                          <strong>AI Analysis:</strong> {clause.reasoning}
                        </div>
                      )}
                      
                      {clause.keywords && clause.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs text-muted-foreground mr-1">Keywords:</span>
                          {clause.keywords.slice(0, 6).map((keyword, i) => (
                            <span 
                              key={i}
                              className="px-2 py-0.5 bg-background rounded text-xs font-mono border"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold mb-2">AI Summary</h3>
              <div className="p-4 bg-muted rounded-lg prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.aiSummary}
                </ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
