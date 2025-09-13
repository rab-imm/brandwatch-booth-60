import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"

export const DocumentUpload = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
    file: null as File | null
  })

  const categories = [
    { value: "employment", label: "Employment Law" },
    { value: "commercial", label: "Commercial Law" },
    { value: "real_estate", label: "Real Estate Law" },
    { value: "family", label: "Family Law" },
    { value: "criminal", label: "Criminal Law" },
    { value: "corporate", label: "Corporate Law" },
    { value: "intellectual_property", label: "Intellectual Property" }
  ]

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, DOC, DOCX, or TXT files only",
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

    setFormData(prev => ({ ...prev, file }))

    // Extract text content from file for simple text files
    if (file.type === 'text/plain') {
      const text = await file.text()
      setFormData(prev => ({ ...prev, content: text }))
    }
  }

  const generateEmbedding = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: { text }
      })
      
      if (error) throw error
      return data.embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.title || !formData.category || !formData.content) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      // Generate embedding for the document content
      const embedding = await generateEmbedding(formData.content)

      // Upload document to database
      const { error } = await supabase
        .from('documents')
        .insert({
          title: formData.title,
          category: formData.category as "employment" | "commercial" | "real_estate" | "family" | "criminal" | "corporate" | "intellectual_property",
          content: formData.content,
          embedding: embedding,
          uploaded_by: user.id,
          status: 'pending' as "pending",
          metadata: {
            original_filename: formData.file?.name,
            file_size: formData.file?.size,
            upload_date: new Date().toISOString()
          }
        })

      if (error) throw error

      // Send email notification to super admins
      await supabase.functions.invoke('notify-document-upload', {
        body: {
          documentTitle: formData.title,
          category: formData.category,
          uploaderEmail: user.email
        }
      })

      toast({
        title: "Document Uploaded",
        description: "Your document has been submitted for review. You'll be notified once it's approved.",
      })

      // Reset form
      setFormData({
        title: "",
        category: "",
        content: "",
        file: null
      })

    } catch (error) {
      console.error('Error uploading document:', error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="upload" className="h-5 w-5" />
            Upload Legal Document
          </CardTitle>
          <CardDescription>
            Upload UAE legal documents to enhance our AI knowledge base. All documents require approval before going live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Document Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., UAE Labor Law - Article 51 Termination Procedures"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Category *
              </label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Upload File (Optional)
              </label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Document Content *
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Paste or type the legal document content here..."
                rows={12}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Provide the full text content of the legal document, including article numbers, sections, and relevant details.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Icon name="upload" className="h-4 w-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}