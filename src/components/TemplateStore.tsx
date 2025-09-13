import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string
  title: string
  description: string
  category: string
  price_aed: number
  download_count: number
  created_at: string
}

export const TemplateStore = () => {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [processingDownload, setProcessingDownload] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (template: Template) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to download templates",
        variant: "destructive"
      })
      return
    }

    setProcessingDownload(template.id)

    try {
      // For free templates
      if (template.price_aed === 0) {
        // TODO: Implement direct download logic
        toast({
          title: "Download Started",
          description: `Downloading ${template.title}`,
        })
        setProcessingDownload(null)
        return
      }

      // For paid templates, create Stripe checkout
      const { data, error } = await supabase.functions.invoke('create-template-payment', {
        body: {
          templateId: template.id,
          priceAed: template.price_aed
        }
      })

      if (error) throw error

      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Error processing download:', error)
      toast({
        title: "Download Failed",
        description: "There was an error processing your download",
        variant: "destructive"
      })
    } finally {
      setProcessingDownload(null)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = ["employment", "commercial", "real_estate", "family", "criminal", "corporate", "intellectual_property"]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading templates...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Legal Template Store</h1>
          <p className="text-muted-foreground text-lg">
            Download professional legal templates for your business needs
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Icon name="filter" className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.replace('_', ' ').split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <Badge variant="secondary">
                    {template.category.replace('_', ' ').split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Badge>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{template.download_count} downloads</span>
                  <span className="font-semibold text-lg text-foreground">
                    {template.price_aed === 0 ? 'Free' : `AED ${template.price_aed}`}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleDownload(template)}
                  disabled={processingDownload === template.id}
                  className="w-full"
                  variant={template.price_aed === 0 ? "outline" : "default"}
                >
                  <Icon name="download" className="h-4 w-4 mr-2" />
                  {processingDownload === template.id 
                    ? "Processing..." 
                    : template.price_aed === 0 
                      ? "Download Free" 
                      : "Purchase & Download"
                  }
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No templates found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}