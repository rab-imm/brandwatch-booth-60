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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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

interface MissingClauseSuggestion {
  clause_type: string
  display_name: string
  display_name_ar: string
  importance: 'essential' | 'recommended' | 'optional'
  category: 'legal' | 'commercial' | 'operational'
  description: string
  description_ar: string
  why_needed: string
  why_needed_ar: string
  sample_wording_en: string
  sample_wording_ar: string
  related_articles?: string[]
  ai_confidence?: number
  ai_reasoning?: string
}

// Detect if text contains Arabic characters
const detectTextDirection = (text: string): { direction: 'rtl' | 'ltr', textAlign: 'right' | 'left' } => {
  // Check if text contains Arabic Unicode characters (U+0600 to U+06FF, U+0750 to U+077F, U+FB50 to U+FDFF, U+FE70 to U+FEFF)
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const hasArabic = arabicRegex.test(text);
  
  if (hasArabic) {
    return { direction: 'rtl', textAlign: 'right' };
  }
  return { direction: 'ltr', textAlign: 'left' };
};

// Get icon for category group
const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'Labor Law':
      return 'briefcase'
    case 'Legal Clauses':
      return 'scale'
    case 'Commercial Terms':
      return 'shopping-cart'
    case 'Data Protection':
      return 'shield'
    default:
      return 'file-text'
  }
}

// Get color for category group
const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Labor Law':
      return 'blue'
    case 'Legal Clauses':
      return 'purple'
    case 'Commercial Terms':
      return 'green'
    case 'Data Protection':
      return 'orange'
    default:
      return 'gray'
  }
}

export const OCRUpload = () => {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [complianceCheckExpanded, setComplianceCheckExpanded] = useState(true)
  const [complianceIssuesExpanded, setComplianceIssuesExpanded] = useState(false)
  const [missingClausesExpanded, setMissingClausesExpanded] = useState(false)
  const [expandedViolations, setExpandedViolations] = useState<Set<number>>(new Set())
  const [expandedMissingClauses, setExpandedMissingClauses] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [currentOcrHistoryId, setCurrentOcrHistoryId] = useState<string | null>(null)
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
      grouped_violations?: Record<string, ComplianceViolation[]>
      compliance_score: number
      total_violations: number
      critical_count: number
      high_count: number
      ai_summary: string
    }
    missing_clauses?: {
      suggestions: MissingClauseSuggestion[]
      total_missing: number
      essential_count: number
      recommended_count: number
      gap_analysis_summary: string
    }
  } | null>(null)
  const [hasScanned, setHasScanned] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/bmp',
      'image/tiff',
      'image/gif',
      'image/avif'
    ]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF or image files (JPG, PNG, WEBP, HEIC, BMP, TIFF, GIF, AVIF)",
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (!file) return
    
    // Reuse existing validation
    const fakeEvent = {
      target: { files: [file] }
    } as any
    handleFileSelect(fakeEvent)
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

      // Store OCR history ID for saving later
      const { data: ocrHistoryData, error: historyError } = await supabase
        .from('ocr_history')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!historyError && ocrHistoryData) {
        setCurrentOcrHistoryId(ocrHistoryData.id)
      }

      setResult({
        extractedText: data.extracted_text,
        aiSummary: data.ai_summary,
        clauses: data.clauses || [],
        clause_stats: data.clause_stats || [],
        statistics: data.statistics,
        compliance_check: data.compliance_check,
        missing_clauses: data.missing_clauses
      })
      setHasScanned(true)

      toast({
        title: "Scan Complete",
        description: `Successfully extracted ${data.statistics.words} words in ${(data.statistics.processing_time_ms / 1000).toFixed(1)}s`,
      })

      setSelectedFile(null)

    } catch (error: any) {
      console.error('OCR error:', error)
      toast({
        title: "Scan Failed",
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

  const toggleExpanded = (index: number, currentSet: Set<number>, setter: (set: Set<number>) => void) => {
    const newSet = new Set(currentSet)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setter(newSet)
  }

  const handleSaveDocument = async () => {
    if (!user || !result || !currentOcrHistoryId) return
    
    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('saved_ocr_documents')
        .insert([{
          user_id: user.id,
          company_id: profile?.current_company_id || null,
          ocr_history_id: currentOcrHistoryId,
          file_name: selectedFile?.name || 'Scanned Document',
          file_type: selectedFile?.type || 'application/pdf',
          scan_results: result as any,
        }])
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Saved",
            description: "This document is already in your saved documents.",
            variant: "default",
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: "Document Saved",
          description: "You can access this scan anytime from Saved Documents tab.",
        })
      }
    } catch (error) {
      console.error('Error saving document:', error)
      toast({
        title: "Error",
        description: "Failed to save document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleScanNewDocument = () => {
    setResult(null)
    setSelectedFile(null)
    setHasScanned(false)
    setUploadProgress(0)
    setCurrentOcrHistoryId(null)
    setComplianceCheckExpanded(true)
    setComplianceIssuesExpanded(false)
    setMissingClausesExpanded(false)
    setExpandedViolations(new Set())
    setExpandedMissingClauses(new Set())
  }

  return (
    <div className="space-y-6">
      {result && hasScanned ? (
        <Card>
          <CardContent className="py-6">
            <Button
              onClick={handleScanNewDocument}
              variant="outline"
              className="w-full h-16 flex items-center justify-center gap-3 text-base hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Icon name="scan" className="h-5 w-5" />
              <span className="font-medium">Scan New Document</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="scan" className="h-5 w-5" />
              Contract Scanner
            </CardTitle>
            <CardDescription>
              Upload a PDF or image to extract text and get an AI summary (1 credit per scan)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-all
                ${isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                }
                ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
              `}
              onClick={() => document.getElementById('ocr-file-input')?.click()}
            >
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="hidden"
                id="ocr-file-input"
              />
              
              <div className="space-y-3">
                <div className="flex justify-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Icon name="upload" className="h-6 w-6 text-primary" />
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <Icon name="image" className="h-6 w-6 text-primary" />
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <Icon name="file-text" className="h-6 w-6 text-primary" />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">
                    {isDragging 
                      ? 'Drop your document here' 
                      : 'Choose from Gallery or Upload File'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click to browse • Drag & drop files here
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">PDF</Badge>
                  <Badge variant="secondary" className="text-xs">JPG</Badge>
                  <Badge variant="secondary" className="text-xs">PNG</Badge>
                  <Badge variant="secondary" className="text-xs">HEIC</Badge>
                  <Badge variant="secondary" className="text-xs">WebP</Badge>
                  <Badge variant="secondary" className="text-xs">BMP</Badge>
                  <Badge variant="secondary" className="text-xs">TIFF</Badge>
                  <span>• Max 10MB</span>
                </div>
              </div>
            </div>

            {/* Gallery Button (Mobile-friendly) */}
            <Button
              variant="outline"
              className="w-full h-14 flex items-center justify-center gap-2"
              onClick={() => document.getElementById('ocr-file-input')?.click()}
              disabled={isProcessing}
            >
              <Icon name="image" className="h-5 w-5" />
              <span className="font-medium">Choose Photo from Gallery</span>
            </Button>

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
                  {uploadProgress < 40 ? 'Uploading...' : uploadProgress < 80 ? 'Analyzing contract...' : 'Finalizing...'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* UAE Labour Law Compliance Check - Grouped Collapsible */}
      {(result?.compliance_check || result?.missing_clauses) && (
        <Collapsible open={complianceCheckExpanded} onOpenChange={setComplianceCheckExpanded}>
          <Card className="border-2 border-primary">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="shield" className="h-5 w-5" />
                      UAE Governance Compliance Check
                    </CardTitle>
                    <CardDescription>
                      UAE Federal Laws & Regulations
                    </CardDescription>
                  </div>
                  <Icon 
                    name={complianceCheckExpanded ? "chevron-up" : "chevron-down"} 
                    className="h-5 w-5 shrink-0"
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* Compliance Score and AI Summary - Always Visible When Expanded */}
                {result?.compliance_check && (
                  <div className="flex items-start gap-6 p-4 bg-accent/30 rounded-lg">
                    {/* Compliance Score Circle */}
                    <div className="relative w-28 h-28 shrink-0">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="50"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="50"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 50}`}
                          strokeDashoffset={`${2 * Math.PI * 50 * (1 - result.compliance_check.compliance_score / 100)}`}
                          className={
                            result.compliance_check.compliance_score >= 80
                              ? "text-green-500"
                              : result.compliance_check.compliance_score >= 60
                              ? "text-yellow-500"
                              : "text-red-500"
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">
                          {result.compliance_check.compliance_score}%
                        </span>
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {result.compliance_check.critical_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {result.compliance_check.critical_count} Critical
                          </Badge>
                        )}
                        {result.compliance_check.high_count > 0 && (
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">
                            {result.compliance_check.high_count} High
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">AI Analysis:</strong> {result.compliance_check.ai_summary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Inner Collapsible: Grouped Findings by Category */}
                {result?.compliance_check?.grouped_violations && 
                 Object.keys(result.compliance_check.grouped_violations).length > 0 && (
                  <Collapsible open={complianceIssuesExpanded} onOpenChange={setComplianceIssuesExpanded}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 rounded-lg border-2 border-orange-200 dark:border-orange-800 hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Icon name="alert-triangle" className="h-5 w-5 text-orange-500" />
                          <h4 className="font-semibold text-lg">
                            Findings by Category ({result.compliance_check.violations.length} total)
                          </h4>
                        </div>
                        <Icon 
                          name={complianceIssuesExpanded ? "chevron-up" : "chevron-down"} 
                          className="h-5 w-5"
                        />
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="space-y-3 mt-4">
                        {Object.entries(result.compliance_check.grouped_violations).map(([category, violations]) => {
                          const categoryColor = getCategoryColor(category)
                          const categoryIcon = getCategoryIcon(category)
                          
                          return (
                            <Collapsible key={category}>
                              <CollapsibleTrigger className="w-full">
                                <div className={`flex items-center justify-between p-4 rounded-lg border-2 border-${categoryColor}-300 dark:border-${categoryColor}-700 bg-${categoryColor}-50/30 dark:bg-${categoryColor}-950/10 hover:bg-${categoryColor}-50 dark:hover:bg-${categoryColor}-950/20 transition-all cursor-pointer`}>
                                  <div className="flex items-center gap-3">
                                    <Icon name={categoryIcon} className={`h-5 w-5 text-${categoryColor}-600`} />
                                    <span className="font-semibold text-base">{category}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {violations.length} {violations.length === 1 ? 'finding' : 'findings'}
                                    </Badge>
                                  </div>
                                  <Icon name="chevron-down" className="h-4 w-4" />
                                </div>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent>
                                <div className="ml-4 mt-2 space-y-2 border-l-2 border-muted pl-4">
                                  {violations.map((v, i) => (
                                    <div key={i} className={`p-3 rounded-lg border transition-all ${
                                      v.severity === 'critical' 
                                        ? 'border-red-300 bg-red-50/50 dark:bg-red-950/10' 
                                        : v.severity === 'high' 
                                        ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/10' 
                                        : v.severity === 'medium' 
                                        ? 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/10' 
                                        : 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/10'
                                    }`}>
                                      <div className="flex items-start gap-2 mb-2">
                                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded shrink-0 ${
                                          v.severity === 'critical' ? 'bg-red-500 text-white' : 
                                          v.severity === 'high' ? 'bg-orange-500 text-white' : 
                                          v.severity === 'medium' ? 'bg-yellow-500 text-white' : 
                                          'bg-blue-500 text-white'
                                        }`}>
                                          {v.severity}
                                        </span>
                                        <div className="flex-1">
                                          <p className="font-semibold text-sm mb-1">{v.rule.article}</p>
                                          <p className="text-sm text-muted-foreground">{v.details}</p>
                                        </div>
                                      </div>
                                      
                                      {v.related_text && (
                                        <div className="text-xs bg-background/50 p-2 rounded mb-2 font-mono">
                                          <p className="font-semibold mb-1">Related Text:</p>
                                          <p className="text-muted-foreground">"{v.related_text.substring(0, 150)}..."</p>
                                        </div>
                                      )}
                                      
                                      <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                                          <Icon name="lightbulb" className="h-3 w-3" />
                                          Recommended Action:
                                        </p>
                                        <p className="text-xs">{v.recommended_action}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Inner Collapsible: Missing Clauses */}
                {result?.missing_clauses?.suggestions && result.missing_clauses.suggestions.length > 0 && (
                  <Collapsible open={missingClausesExpanded} onOpenChange={setMissingClausesExpanded}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 rounded-lg border-2 border-amber-200 dark:border-amber-800 hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Icon name="alert-triangle" className="h-5 w-5 text-amber-500" />
                          <h4 className="font-semibold text-lg">
                            Missing Clauses ({result.missing_clauses.suggestions.length})
                          </h4>
                          <div className="flex items-center gap-2">
                            {result.missing_clauses.essential_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {result.missing_clauses.essential_count} Essential
                              </Badge>
                            )}
                            {result.missing_clauses.recommended_count > 0 && (
                              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
                                {result.missing_clauses.recommended_count} Recommended
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Icon 
                          name={missingClausesExpanded ? "chevron-up" : "chevron-down"} 
                          className="h-5 w-5"
                        />
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <strong className="text-amber-700 dark:text-amber-400">Gap Analysis:</strong>{" "}
                          {result.missing_clauses.gap_analysis_summary}
                        </p>
                        
                        <div className="space-y-2">
                          {result.missing_clauses.suggestions.map((suggestion, idx) => (
                            <Collapsible key={idx} open={expandedMissingClauses.has(idx)}>
                              <CollapsibleTrigger
                                onClick={() => toggleExpanded(idx, expandedMissingClauses, setExpandedMissingClauses)}
                                className="w-full"
                              >
                                <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${
                                  suggestion.importance === 'essential' 
                                    ? 'border-red-500 bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20' 
                                    : suggestion.importance === 'recommended'
                                    ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10 hover:bg-yellow-50 dark:hover:bg-yellow-950/20'
                                    : 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                                }`}>
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                      suggestion.importance === 'essential' 
                                        ? 'bg-red-500 text-white' 
                                        : suggestion.importance === 'recommended'
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-blue-500 text-white'
                                    }`}>
                                      {suggestion.importance}
                                    </span>
                                    <Badge variant="outline" className="text-xs">{suggestion.category}</Badge>
                                    <span className="text-sm font-medium text-left flex-1">
                                      {suggestion.display_name}
                                    </span>
                                  </div>
                                  <Icon 
                                    name={expandedMissingClauses.has(idx) ? "chevron-up" : "chevron-down"} 
                                    className="h-4 w-4 shrink-0 text-muted-foreground"
                                  />
                                </div>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent>
                                <div className={`mt-2 p-4 rounded-lg border-l-4 ${
                                  suggestion.importance === 'essential' 
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                                    : suggestion.importance === 'recommended'
                                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                                    : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                }`}>
                                  <div className="mb-3">
                                    <h5 className="font-semibold text-base mb-1">
                                      {suggestion.display_name}
                                      {suggestion.display_name_ar && (
                                        <span className="text-sm text-muted-foreground mr-2">
                                          {' '}({suggestion.display_name_ar})
                                        </span>
                                      )}
                                    </h5>
                                    <p className="text-sm">{suggestion.description}</p>
                                  </div>
                                  
                                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded mb-3">
                                    <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                                      <Icon name="lightbulb" className="h-3 w-3" />
                                      Why This Clause is Needed:
                                    </p>
                                    <p className="text-xs">{suggestion.why_needed}</p>
                                  </div>

                                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-semibold flex items-center gap-1">
                                        <Icon name="file-text" className="h-3 w-3" />
                                        Suggested Sample Wording:
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          navigator.clipboard.writeText(suggestion.sample_wording_en)
                                          toast({
                                            title: "Copied!",
                                            description: "Sample wording copied to clipboard"
                                          })
                                        }}
                                      >
                                        <Icon name="copy" className="h-3 w-3 mr-1" />
                                        Copy
                                      </Button>
                                    </div>
                                    
                                    <div className="mb-3">
                                      <p className="text-xs font-medium mb-1">English:</p>
                                      <div className="text-xs bg-white dark:bg-background p-3 rounded border font-mono leading-relaxed">
                                        {suggestion.sample_wording_en}
                                      </div>
                                    </div>
                                    
                                    {suggestion.sample_wording_ar && (
                                      <div>
                                        <p className="text-xs font-medium mb-1">Arabic (العربية):</p>
                                        <div className="text-xs bg-white dark:bg-background p-3 rounded border font-mono leading-relaxed text-right" dir="rtl">
                                          {suggestion.sample_wording_ar}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {suggestion.related_articles && suggestion.related_articles.length > 0 && (
                                    <div className="mt-3 text-xs text-muted-foreground">
                                      <span className="font-semibold">Related:</span>{' '}
                                      {suggestion.related_articles.join(', ')}
                                    </div>
                                  )}

                                  {suggestion.ai_confidence && (
                                    <div className="mt-2">
                                      <Badge variant="secondary" className="text-xs">
                                        <Icon name="sparkles" className="h-3 w-3 mr-1" />
                                        AI Confidence: {Math.round(suggestion.ai_confidence * 100)}%
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => {
                            const allSuggestions = result.missing_clauses!.suggestions
                              .map(s => `${s.display_name}\n\nWhy Needed: ${s.why_needed}\n\nSample Wording (EN):\n${s.sample_wording_en}\n\nSample Wording (AR):\n${s.sample_wording_ar}`)
                              .join('\n\n---\n\n')
                            
                            const blob = new Blob([allSuggestions], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'missing-clauses-suggestions.txt'
                            a.click()
                          }}
                        >
                          <Icon name="download" className="mr-2 h-4 w-4" />
                          Export All Suggestions
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Scan Results</CardTitle>
                <CardDescription>
                  {result.statistics.words} words · {result.statistics.characters} characters · 
                  Processed in {(result.statistics.processing_time_ms / 1000).toFixed(1)}s
                </CardDescription>
              </div>
              <Button
                onClick={handleSaveDocument}
                disabled={isSaving}
                variant="outline"
              >
                <Icon name="bookmark" className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Document'}
              </Button>
            </div>
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
              <div 
                className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto whitespace-pre-wrap text-sm"
                style={{ 
                  fontFamily: 'Arial, "Noto Sans Arabic", "Tahoma", sans-serif',
                  ...detectTextDirection(result.extractedText),
                  unicodeBidi: 'embed'
                }}
              >
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
                            {clause.confidence === 'ai' ? 'AI Detected' : 'Pattern Match'}
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
                      
                      <p 
                        className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed"
                        style={{ 
                          fontFamily: 'Arial, "Noto Sans Arabic", "Tahoma", sans-serif',
                          ...detectTextDirection(clause.text),
                          unicodeBidi: 'embed'
                        }}
                      >
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
              <div 
                className="p-4 bg-muted rounded-lg prose prose-sm dark:prose-invert max-w-none"
                style={{ 
                  fontFamily: 'Arial, "Noto Sans Arabic", "Tahoma", sans-serif',
                  ...detectTextDirection(result.aiSummary)
                }}
              >
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
