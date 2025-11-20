import { useState } from "react"
import { Header } from "@/components/Header"
import { OCRUpload } from "@/components/OCRUpload"
import { OCRHistory } from "@/components/OCRHistory"
import { SavedDocuments } from "@/components/SavedDocuments"
import { ScannerSidebar } from "@/components/scanner/ScannerSidebar"
import { DocumentScannerDashboard } from "@/components/scanner/DocumentScannerDashboard"

const OCRPage = () => {
  const [activeSection, setActiveSection] = useState('scan')
  const [currentScanResult, setCurrentScanResult] = useState<any>(null)
  
  const handleScanComplete = (result: any) => {
    setCurrentScanResult(result)
    setActiveSection('dashboard')
  }
  
  const handleRecordSelect = (record: any) => {
    setCurrentScanResult(record)
    setActiveSection('dashboard')
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
        <div className="ml-64 overflow-auto min-h-full">
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
              onExport={() => {/* Handle export */}}
              onSaveDocument={() => {/* Handle save */}}
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
        </div>
      </div>
    </div>
  )
}

export default OCRPage
