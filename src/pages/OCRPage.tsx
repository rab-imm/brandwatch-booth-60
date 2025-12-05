import { useState } from "react"
import { Header } from "@/components/Header"
import { OCRUpload } from "@/components/OCRUpload"
import { OCRHistory } from "@/components/OCRHistory"
import { SavedDocuments } from "@/components/SavedDocuments"
import { ScannerSidebar } from "@/components/scanner/ScannerSidebar"
import { DocumentScannerDashboard } from "@/components/scanner/DocumentScannerDashboard"
import { PreAnalysisQuestionnaire, QuestionnaireData } from "@/components/scanner/PreAnalysisQuestionnaire"
import { PartySelectionDialog, IdentifiedParty } from "@/components/scanner/PartySelectionDialog"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface AnalysisContext {
  questionnaire: QuestionnaireData | null
  selectedParty: IdentifiedParty | null
}

const OCRPage = () => {
  const [activeSection, setActiveSection] = useState('scan')
  const [currentScanResult, setCurrentScanResult] = useState<any>(null)
  const [analysisContext, setAnalysisContext] = useState<AnalysisContext>({
    questionnaire: null,
    selectedParty: null
  })
  const [showQuestionnaire, setShowQuestionnaire] = useState(true)
  const [showPartySelection, setShowPartySelection] = useState(false)
  const [identifiedParties, setIdentifiedParties] = useState<IdentifiedParty[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user } = useAuth()
  
  const handleQuestionnaireComplete = (data: QuestionnaireData) => {
    setAnalysisContext(prev => ({ ...prev, questionnaire: data }))
    setShowQuestionnaire(false)
  }
  
  const handleQuestionnaireSkip = () => {
    setShowQuestionnaire(false)
  }
  
  const handleScanComplete = (result: any) => {
    setCurrentScanResult(result)
    
    // Extract parties from the scan result
    const parties = extractPartiesFromResult(result)
    
    if (parties.length > 1) {
      setIdentifiedParties(parties)
      setShowPartySelection(true)
    } else {
      setActiveSection('dashboard')
    }
  }
  
  const extractPartiesFromResult = (result: any): IdentifiedParty[] => {
    // Try to get parties from metadata or AI analysis
    const metadata = result?.metadata || {}
    const documentAnalysis = metadata?.document_analysis || {}
    const keyParties = documentAnalysis?.key_parties || []
    
    if (Array.isArray(keyParties) && keyParties.length > 0) {
      // If parties are objects with role/name/type
      if (typeof keyParties[0] === 'object') {
        return keyParties
      }
      // If parties are just strings
      return keyParties.map((party: string) => ({
        role: party,
        type: party.toLowerCase().includes('company') || party.toLowerCase().includes('llc') || party.toLowerCase().includes('corp')
          ? 'company' as const
          : 'individual' as const
      }))
    }
    
    // Fallback: try to extract from AI summary or document type
    const docType = documentAnalysis?.document_type || ''
    const defaultParties: Record<string, IdentifiedParty[]> = {
      'employment_contract': [
        { role: 'Employer', type: 'company' },
        { role: 'Employee', type: 'individual' }
      ],
      'service_agreement': [
        { role: 'Service Provider', type: 'company' },
        { role: 'Client', type: 'company' }
      ],
      'lease_agreement': [
        { role: 'Landlord', type: 'individual' },
        { role: 'Tenant', type: 'individual' }
      ],
      'nda': [
        { role: 'Disclosing Party', type: 'company' },
        { role: 'Receiving Party', type: 'company' }
      ],
      'sales_contract': [
        { role: 'Seller', type: 'company' },
        { role: 'Buyer', type: 'individual' }
      ],
      'partnership_agreement': [
        { role: 'Partner 1', type: 'company' },
        { role: 'Partner 2', type: 'company' }
      ],
    }
    
    const normalizedType = docType.toLowerCase().replace(/\s+/g, '_')
    return defaultParties[normalizedType] || []
  }
  
  const handlePartySelect = (party: IdentifiedParty | null) => {
    setAnalysisContext(prev => ({ ...prev, selectedParty: party }))
    setShowPartySelection(false)
    setActiveSection('dashboard')
  }
  
  const handlePartySkip = () => {
    setShowPartySelection(false)
    setActiveSection('dashboard')
  }
  
  const handleRecordSelect = (record: any) => {
    setCurrentScanResult(record)
    setActiveSection('dashboard')
  }
  
  const handleSaveDocument = async () => {
    if (!currentScanResult || !user) {
      toast.error("Unable to save document")
      return
    }
    
    try {
      toast.loading("Saving document...")
      
      const { error } = await supabase
        .from('saved_ocr_documents')
        .insert([{
          user_id: user.id,
          ocr_history_id: currentScanResult.id,
          file_name: currentScanResult.file_name,
          file_type: currentScanResult.file_type,
          scan_results: {
            ai_summary: currentScanResult.ai_summary,
            metadata: currentScanResult.metadata,
            substantive_risk_analysis: currentScanResult.substantive_risk_analysis,
            extracted_text: currentScanResult.extracted_text,
            word_count: currentScanResult.word_count,
            character_count: currentScanResult.character_count,
            analysis_context: analysisContext as any
          } as any
        }])
      
      if (error) throw error
      
      toast.success("Document saved successfully")
      setActiveSection('saved')
    } catch (error) {
      console.error('Save error:', error)
      toast.error("Failed to save document")
    }
  }
  
  const handleExportPDF = async () => {
    if (!currentScanResult || !user) {
      toast.error("Unable to export document")
      return
    }
    
    try {
      toast.loading("Generating PDF...")
      
      const { data, error } = await supabase.functions.invoke('export-scan-report-pdf', {
        body: {
          scanId: currentScanResult.id,
          scanResult: currentScanResult
        }
      })
      
      if (error) throw error
      
      // Create blob and download
      const pdfBlob = new Blob([Uint8Array.from(atob(data.pdfData), c => c.charCodeAt(0))], {
        type: 'application/pdf'
      })
      
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.filename || `scan-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success("PDF exported successfully")
    } catch (error) {
      console.error('Export error:', error)
      toast.error("Failed to export PDF")
    }
  }
  
  const handleStartNewScan = () => {
    setShowQuestionnaire(true)
    setCurrentScanResult(null)
    setAnalysisContext({ questionnaire: null, selectedParty: null })
    setActiveSection('scan')
  }

  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1">
        {/* Sidebar */}
        <ScannerSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Main Content Area */}
        <div 
          className={cn(
            "h-[calc(100vh-73px)] overflow-hidden transition-all duration-300",
            sidebarCollapsed ? "ml-14" : "ml-64"
          )}
        >
          {activeSection === 'scan' && (
            <div className="p-6 max-w-5xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Contract Scanner</h1>
                <p className="text-muted-foreground">
                  Upload and analyze legal documents with AI-powered insights
                </p>
              </div>
              
              {showQuestionnaire ? (
                <PreAnalysisQuestionnaire 
                  onComplete={handleQuestionnaireComplete}
                  onSkip={handleQuestionnaireSkip}
                />
              ) : (
                <OCRUpload 
                  onScanComplete={handleScanComplete}
                  questionnaireData={analysisContext.questionnaire}
                />
              )}
            </div>
          )}
          
          {activeSection === 'dashboard' && (
            <DocumentScannerDashboard 
              scanResult={currentScanResult}
              onExport={handleExportPDF}
              onSaveDocument={handleSaveDocument}
              analysisContext={analysisContext}
              onStartNewScan={handleStartNewScan}
              onSidebarCollapse={handleSidebarCollapse}
            />
          )}
          
          {activeSection === 'history' && (
            <div className="p-6 max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Scan History</h1>
                <p className="text-muted-foreground">
                  View and manage your previous document scans
                </p>
              </div>
              <OCRHistory onRecordSelect={handleRecordSelect} />
            </div>
          )}
          
          {activeSection === 'saved' && (
            <div className="p-6 max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Saved Documents</h1>
                <p className="text-muted-foreground">
                  Access your saved document analyses
                </p>
              </div>
              <SavedDocuments />
            </div>
          )}
          
          {/* Legal Disclaimer */}
          <div className="p-6 mt-auto border-t bg-muted/30">
            <div className="max-w-5xl mx-auto">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                This analysis is generated by AI and is for general information only. 
                It is not legal advice and Graysen.ai is not a law firm. The output may 
                not identify all risks or issues and accuracy is not guaranteed. You are 
                responsible for all decisions and actions based on this analysis. For 
                legal advice or interpretation of UAE law, consult a licensed lawyer.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Party Selection Dialog */}
      <PartySelectionDialog
        open={showPartySelection}
        parties={identifiedParties}
        documentType={currentScanResult?.metadata?.document_analysis?.document_type}
        onSelect={handlePartySelect}
        onSkip={handlePartySkip}
      />
    </div>
  )
}

export default OCRPage
