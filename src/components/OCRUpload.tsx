import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export const OCRUpload = () => {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<{
    extractedText: string
    aiSummary: string
    statistics: {
      characters: number
      words: number
      processing_time_ms: number
    }
  } | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/plain'
    ]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, text files, or images (JPG, PNG, WEBP)",
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
              accept=".pdf,.txt,image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Supported: PDF, TXT, JPG, PNG, WEBP (Max 10MB)
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
            <div>
              <h3 className="text-sm font-semibold mb-2">Extracted Text</h3>
              <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto whitespace-pre-wrap text-sm font-mono">
                {result.extractedText}
              </div>
            </div>

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
