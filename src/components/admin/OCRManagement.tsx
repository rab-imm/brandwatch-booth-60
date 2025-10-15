import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface OCRRecord {
  id: string
  user_id: string
  company_id: string | null
  file_name: string
  file_type: string
  file_size: number
  extracted_text: string
  ai_summary: string
  character_count: number
  word_count: number
  processing_time_ms: number
  credits_used: number
  created_at: string
  profiles?: {
    email: string
    full_name: string
  }
  companies?: {
    name: string
  }
}

interface OCRStats {
  totalScans: number
  totalCreditsUsed: number
  totalCharacters: number
  totalWords: number
  avgProcessingTime: number
  pdfScans: number
  imageScans: number
}

export const OCRManagement = () => {
  const { toast } = useToast()
  const [records, setRecords] = useState<OCRRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<OCRRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<OCRRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState<OCRStats>({
    totalScans: 0,
    totalCreditsUsed: 0,
    totalCharacters: 0,
    totalWords: 0,
    avgProcessingTime: 0,
    pdfScans: 0,
    imageScans: 0,
  })

  useEffect(() => {
    loadOCRData()
  }, [])

  useEffect(() => {
    filterRecords()
  }, [searchTerm, records])

  const loadOCRData = async () => {
    try {
      const { data, error } = await supabase
        .from('ocr_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Fetch user and company details separately
      const recordsWithDetails = await Promise.all(
        (data || []).map(async (record) => {
          const [userResult, companyResult] = await Promise.all([
            record.user_id ? supabase
              .from('profiles')
              .select('email, full_name')
              .eq('user_id', record.user_id)
              .maybeSingle() : Promise.resolve({ data: null }),
            record.company_id ? supabase
              .from('companies')
              .select('name')
              .eq('id', record.company_id)
              .maybeSingle() : Promise.resolve({ data: null })
          ])

          return {
            ...record,
            profiles: userResult.data,
            companies: companyResult.data
          } as OCRRecord
        })
      )

      setRecords(recordsWithDetails)
      calculateStats(recordsWithDetails)
    } catch (error) {
      console.error('Error loading OCR data:', error)
      toast({
        title: "Error",
        description: "Failed to load OCR data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: OCRRecord[]) => {
    const stats: OCRStats = {
      totalScans: data.length,
      totalCreditsUsed: data.reduce((sum, r) => sum + r.credits_used, 0),
      totalCharacters: data.reduce((sum, r) => sum + r.character_count, 0),
      totalWords: data.reduce((sum, r) => sum + r.word_count, 0),
      avgProcessingTime: data.length > 0 
        ? data.reduce((sum, r) => sum + r.processing_time_ms, 0) / data.length 
        : 0,
      pdfScans: data.filter(r => r.file_type === 'application/pdf').length,
      imageScans: data.filter(r => r.file_type.startsWith('image/')).length,
    }
    setStats(stats)
  }

  const filterRecords = () => {
    if (!searchTerm.trim()) {
      setFilteredRecords(records)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = records.filter(record => 
      record.file_name.toLowerCase().includes(term) ||
      record.profiles?.email?.toLowerCase().includes(term) ||
      record.profiles?.full_name?.toLowerCase().includes(term) ||
      record.companies?.name?.toLowerCase().includes(term) ||
      record.extracted_text.toLowerCase().includes(term)
    )
    setFilteredRecords(filtered)
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
      <div className="flex items-center justify-center p-12">
        <Icon name="loader" className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Scans</CardDescription>
            <CardTitle className="text-3xl">{stats.totalScans}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Credits Used</CardDescription>
            <CardTitle className="text-3xl">{stats.totalCreditsUsed}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Words</CardDescription>
            <CardTitle className="text-3xl">{stats.totalWords.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Processing</CardDescription>
            <CardTitle className="text-3xl">{(stats.avgProcessingTime / 1000).toFixed(1)}s</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>PDF Scans</CardDescription>
            <CardTitle className="text-3xl">{stats.pdfScans}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Image Scans</CardDescription>
            <CardTitle className="text-3xl">{stats.imageScans}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>OCR Scan History</CardTitle>
          <CardDescription>View and search all OCR scans across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by filename, user, company, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
            >
              Clear
            </Button>
          </div>

          <div className="space-y-2">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No OCR scans found
              </div>
            ) : (
              filteredRecords.map((record) => (
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
                        <Badge variant="outline" className="text-xs">
                          {(record.file_size / 1024).toFixed(0)} KB
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          <Icon name="user" className="h-3 w-3 inline mr-1" />
                          {record.profiles?.email || 'Unknown'}
                        </span>
                        {record.companies && (
                          <span>
                            <Icon name="building" className="h-3 w-3 inline mr-1" />
                            {record.companies.name}
                          </span>
                        )}
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
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Record Detail */}
      {selectedRecord && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedRecord.file_name}</CardTitle>
                <CardDescription>
                  {selectedRecord.word_count} words · {selectedRecord.character_count} characters · 
                  Processed in {(selectedRecord.processing_time_ms / 1000).toFixed(1)}s · 
                  {selectedRecord.credits_used} credit{selectedRecord.credits_used !== 1 ? 's' : ''}
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
                <h3 className="text-sm font-semibold">User Information</h3>
              </div>
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <div><strong>Email:</strong> {selectedRecord.profiles?.email || 'Unknown'}</div>
                <div><strong>Name:</strong> {selectedRecord.profiles?.full_name || 'N/A'}</div>
                {selectedRecord.companies && (
                  <div><strong>Company:</strong> {selectedRecord.companies.name}</div>
                )}
                <div><strong>Scanned:</strong> {new Date(selectedRecord.created_at).toLocaleString()}</div>
              </div>
            </div>

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
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                {selectedRecord.ai_summary}
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
