import { useState } from "react"
import { Header } from "@/components/Header"
import { OCRUpload } from "@/components/OCRUpload"
import { OCRHistory } from "@/components/OCRHistory"
import { SavedDocuments } from "@/components/SavedDocuments"
import { ScannerSidebar } from "@/components/scanner/ScannerSidebar"
import { DocumentScannerDashboard } from "@/components/scanner/DocumentScannerDashboard"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

const OCRPage = () => {
  const [activeSection, setActiveSection] = useState('scan')
  const [currentScanResult, setCurrentScanResult] = useState<any>(null)
  const { user } = useAuth()
  
  const handleScanComplete = (result: any) => {
    setCurrentScanResult(result)
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
        .insert({
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
            character_count: currentScanResult.character_count
          }
        })
      
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
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1">
        {/* Sidebar */}
        <ScannerSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        {/* Main Content Area */}
        <div className="ml-64 h-[calc(100vh-73px)] overflow-hidden">
          {activeSection === 'scan' && (
            <div className="p-6 max-w-5xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Contract Scanner</h1>
                <p className="text-muted-foreground">
                  Upload and analyze legal documents with AI-powered insights
                </p>
              </div>
              <OCRUpload onScanComplete={handleScanComplete} />
            </div>
          )}
          
          {activeSection === 'dashboard' && (
            <DocumentScannerDashboard 
              scanResult={currentScanResult}
              onExport={handleExportPDF}
              onSaveDocument={handleSaveDocument}
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
    </div>
  )
}

export default OCRPage
