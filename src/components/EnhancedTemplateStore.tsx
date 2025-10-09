import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string
  title: string
  description: string
  category: string
  price_aed: number
  credit_cost: number
  download_count: number
  created_at: string
  created_by: string | null
  promotion?: {
    badge_text: string
    badge_color: string
    discount_percentage: number
    is_featured: boolean
  }
}

interface Bundle {
  id: string
  name: string
  description: string
  price_aed: number
  discount_percentage: number
  template_count: number
}

interface RecommendedTemplate extends Template {
  similarity_score: number
  reason: string
}

export const EnhancedTemplateStore = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([])
  const [recommendedTemplates, setRecommendedTemplates] = useState<RecommendedTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState<[number, number]>([0, 1000])
  const [ratingFilter, setRatingFilter] = useState(0)
  const [sortBy, setSortBy] = useState("newest")
  const [processingDownload, setProcessingDownload] = useState<string | null>(null)

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "employment", label: "Employment Law" },
    { value: "commercial", label: "Commercial Law" },
    { value: "real_estate", label: "Real Estate Law" },
    { value: "family", label: "Family Law" },
    { value: "criminal", label: "Criminal Law" },
    { value: "corporate", label: "Corporate Law" },
    { value: "intellectual_property", label: "Intellectual Property" }
  ]

  useEffect(() => {
    fetchTemplates()
    fetchBundles()
    fetchFeatured()
    if (user) {
      fetchRecommendations()
    }
  }, [user, sortBy])

  const fetchTemplates = async () => {
    try {
      let query = supabase
        .from('templates')
        .select(`
          *,
          template_promotions (
            badge_text,
            badge_color,
            discount_percentage,
            is_featured
          )
        `)
        .eq('is_active', true)

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('download_count', { ascending: false })
          break
        case 'price_low':
          query = query.order('price_aed', { ascending: true })
          break
        case 'price_high':
          query = query.order('price_aed', { ascending: false })
          break
        case 'rating':
          // Would need to join with reviews and avg rating
          query = query.order('created_at', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error
      
      const templatesWithPromo = (data || []).map(t => ({
        ...t,
        promotion: t.template_promotions?.[0] || undefined
      }))
      
      setTemplates(templatesWithPromo)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('template_bundles')
        .select(`
          *,
          template_bundle_items (count)
        `)
        .eq('is_active', true)

      if (error) throw error
      
      const bundlesWithCount = (data || []).map(b => ({
        ...b,
        template_count: b.template_bundle_items?.[0]?.count || 0
      }))
      
      setBundles(bundlesWithCount)
    } catch (error) {
      console.error('Error fetching bundles:', error)
    }
  }

  const fetchFeatured = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select(`
          *,
          template_promotions!inner (
            badge_text,
            badge_color,
            discount_percentage,
            is_featured
          )
        `)
        .eq('template_promotions.is_featured', true)
        .eq('is_active', true)
        .limit(6)

      if (error) throw error
      
      const featured = (data || []).map(t => ({
        ...t,
        promotion: t.template_promotions?.[0]
      }))
      
      setFeaturedTemplates(featured)
    } catch (error) {
      console.error('Error fetching featured:', error)
    }
  }

  const fetchRecommendations = async () => {
    try {
      // Get user's download history for recommendations
      const { data: downloads } = await supabase
        .from('template_downloads')
        .select('template_id, templates(category)')
        .eq('user_id', user?.id)

      if (downloads && downloads.length > 0) {
        // Get most common category from user's downloads
        const categories = downloads.map(d => d.templates?.category).filter(Boolean)
        const mostCommonCategory = categories.reduce((a, b) => 
          categories.filter(cat => cat === a).length >= categories.filter(cat => cat === b).length ? a : b
        )

        // Fetch similar templates
        const { data: similar } = await supabase
          .from('templates')
          .select('*')
          .eq('category', mostCommonCategory)
          .eq('is_active', true)
          .order('download_count', { ascending: false })
          .limit(3)

        if (similar) {
          const recommended = similar.map(template => ({
            ...template,
            similarity_score: 0.8,
            reason: `Similar to your previous ${mostCommonCategory} downloads`
          }))
          setRecommendedTemplates(recommended)
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
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
      // Get user's current company if they're a company user
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_company_id')
        .eq('user_id', user.id)
        .single()

      // Deduct credits for template download
      const { data: result, error } = await supabase.rpc('deduct_credits_for_template', {
        p_template_id: template.id,
        p_user_id: user.id,
        p_company_id: profile?.current_company_id || null
      })

      if (error) throw error
      
      const resultData = result as { success: boolean; error?: string; credits_deducted?: number; remaining_credits?: number }
      
      if (!resultData.success) {
        toast({
          title: "Insufficient Credits",
          description: resultData.error || "You don't have enough credits to download this template",
          variant: "destructive"
        })
        return
      }

      // Track analytics
      await supabase.rpc('track_template_analytics', {
        p_template_id: template.id,
        p_action_type: 'download',
        p_metadata: { credit_cost: template.credit_cost }
      })

      toast({
        title: "Template Downloaded",
        description: `${resultData.credits_deducted} ${resultData.credits_deducted === 1 ? 'credit' : 'credits'} used. ${resultData.remaining_credits} remaining.`,
      })
      
      // Trigger download (in production, this would be a real file)
      window.open(`/templates/${template.id}/download`, '_blank')
    } catch (error) {
      console.error('Error handling download:', error)
      toast({
        title: "Download Failed", 
        description: "There was an error processing your request. Please try again.",
        variant: "destructive"
      })
    } finally {
      setProcessingDownload(null)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter
    const matchesPrice = template.price_aed >= priceFilter[0] && template.price_aed <= priceFilter[1]
    return matchesSearch && matchesCategory && matchesPrice
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="loader" className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Featured Section */}
      {featuredTemplates.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="star" className="h-5 w-5 text-primary" />
              Featured Templates
            </CardTitle>
            <CardDescription>Hand-picked templates for your legal needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredTemplates.slice(0, 3).map((template) => (
                <div key={template.id} className="relative p-4 border rounded-lg bg-background">
                  {template.promotion && (
                    <Badge className="absolute top-2 right-2" variant="default">
                      {template.promotion.badge_text}
                    </Badge>
                  )}
                  <h4 className="font-semibold mb-1">{template.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold">
                      {template.promotion?.discount_percentage ? (
                        <>
                          <span className="line-through text-muted-foreground text-sm">
                            AED {template.price_aed}
                          </span>
                          {' '}
                          <span className="text-primary">
                            AED {(template.price_aed * (1 - template.promotion.discount_percentage / 100)).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        `AED ${template.price_aed}`
                      )}
                    </span>
                    <Button size="sm" variant="secondary" onClick={() => handleDownload(template)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bundles Section */}
      {bundles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="package" className="h-5 w-5" />
              Template Bundles
            </CardTitle>
            <CardDescription>Save more with bundled templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bundles.map((bundle) => (
                <div key={bundle.id} className="p-4 border rounded-lg hover:border-primary transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{bundle.name}</h4>
                    <Badge variant="secondary">{bundle.discount_percentage}% OFF</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{bundle.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold">AED {bundle.price_aed}</div>
                      <div className="text-xs text-muted-foreground">{bundle.template_count} templates</div>
                    </div>
                    <Button size="sm">View Bundle</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          {user && <TabsTrigger value="recommended">Recommended</TabsTrigger>}
          <TabsTrigger value="free">Free Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="flex flex-col relative">
                {template.promotion && (
                  <Badge 
                    className="absolute top-3 right-3 z-10" 
                    variant={template.promotion.badge_color === 'destructive' ? 'destructive' : 'default'}
                  >
                    {template.promotion.badge_text}
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight pr-20">{template.title}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {template.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="download" className="h-4 w-4" />
                        {template.download_count} downloads
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="calendar" className="h-4 w-4" />
                        {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {template.credit_cost} {template.credit_cost === 1 ? 'Credit' : 'Credits'}
                      </div>
                      {template.price_aed > 0 && (
                        <div className="text-xs text-muted-foreground">
                          or AED {template.price_aed}
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => handleDownload(template)}
                      disabled={processingDownload === template.id}
                      size="sm"
                    >
                      {processingDownload === template.id ? (
                        <>
                          <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : template.price_aed === 0 ? (
                        <>
                          <Icon name="download" className="h-4 w-4 mr-2" />
                          Download
                        </>
                      ) : (
                        <>
                          <Icon name="credit-card" className="h-4 w-4 mr-2" />
                          Purchase & Download
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {user && (
          <TabsContent value="recommended" className="space-y-4">
            {recommendedTemplates.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="star" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                <p className="text-muted-foreground">Download some templates to get personalized recommendations!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedTemplates.map((template) => (
                  <Card key={template.id} className="flex flex-col border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg leading-tight">{template.title}</CardTitle>
                        <Badge className="ml-2">
                          <Icon name="star" className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-3">
                        {template.description}
                      </CardDescription>
                      <div className="text-xs text-primary font-medium">
                        {template.reason}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Icon name="download" className="h-4 w-4" />
                            {template.download_count} downloads
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold">
                          {template.price_aed === 0 ? (
                            <Badge variant="secondary">Free</Badge>
                          ) : (
                            `AED ${template.price_aed}`
                          )}
                        </div>
                        
                        <Button 
                          onClick={() => handleDownload(template)}
                          disabled={processingDownload === template.id}
                          size="sm"
                        >
                          {processingDownload === template.id ? (
                            <>
                              <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : template.price_aed === 0 ? (
                            <>
                              <Icon name="download" className="h-4 w-4 mr-2" />
                              Download
                            </>
                          ) : (
                            <>
                              <Icon name="credit-card" className="h-4 w-4 mr-2" />
                              Purchase & Download
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="free" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.filter(t => t.price_aed === 0).map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">{template.title}</CardTitle>
                    <Badge variant="secondary" className="ml-2">Free</Badge>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="download" className="h-4 w-4" />
                        {template.download_count} downloads
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="calendar" className="h-4 w-4" />
                        {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleDownload(template)}
                    disabled={processingDownload === template.id}
                    className="w-full"
                  >
                    {processingDownload === template.id ? (
                      <>
                        <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Icon name="download" className="h-4 w-4 mr-2" />
                        Download Free
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Icon name="search" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria or browse all categories.</p>
        </div>
      )}
    </div>
  )
}