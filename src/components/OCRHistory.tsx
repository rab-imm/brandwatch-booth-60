import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
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
}

export const OCRHistory = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [history, setHistory] = useState<OCRRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<OCRRecord | null>(null)

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
        description: "Failed to load OCR history",
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
            <p>No OCR scans yet</p>
            <p className="text-sm">Upload a document to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="history" className="h-5 w-5" />
            OCR History
          </CardTitle>
          <CardDescription>
            Your recent document scans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.map((record) => (
              <div
                key={record.id}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedRecord(record)}
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
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{record.word_count} words</span>
                      <span>{record.character_count} chars</span>
                      <span>{formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedRecord(record)
                    }}
                  >
                    <Icon name="chevron-right" className="h-4 w-4" />
                  </Button>
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
              <div className="p-4 bg-muted rounded-lg text-sm prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedRecord.ai_summary}
                </ReactMarkdown>
              </div>
            </div>

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
