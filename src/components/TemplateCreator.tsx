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

export const TemplateCreator = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "",
    price_aed: 0
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.title || !formData.description || !formData.content || !formData.category) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)

    try {
      const { data, error } = await supabase.rpc('create_template', {
        p_title: formData.title,
        p_description: formData.description,
        p_content: formData.content,
        p_category: formData.category as "employment" | "commercial" | "real_estate" | "family" | "criminal" | "corporate" | "intellectual_property",
        p_price_aed: formData.price_aed,
        p_created_by: user.id
      })

      if (error) throw error

      toast({
        title: "Template Created",
        description: "Your template has been created successfully and is now available in the store.",
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        content: "",
        category: "",
        price_aed: 0
      })

    } catch (error) {
      console.error('Error creating template:', error)
      toast({
        title: "Creation Failed",
        description: "There was an error creating your template. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="file-text" className="h-5 w-5" />
          Create Legal Template
        </CardTitle>
        <CardDescription>
          Create professional legal templates for the UAE market. Set pricing and revenue sharing options.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Template Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., UAE Employment Contract Template"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Category *
              </label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template category" />
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
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Description *
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this template covers and its use cases"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Price (AED)
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.price_aed}
              onChange={(e) => setFormData(prev => ({ ...prev, price_aed: parseFloat(e.target.value) || 0 }))}
              placeholder="0 for free template"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Set to 0 for free templates. Revenue sharing applies to paid templates.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Template Content *
            </label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter the full template content with placeholders like [COMPANY NAME], [DATE], etc."
              rows={15}
              required
              className="font-mono text-sm"
            />
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">Template Guidelines:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Use [PLACEHOLDER] format for variables (e.g., [COMPANY NAME], [DATE])</li>
                <li>• Include relevant UAE law references and article numbers</li>
                <li>• Ensure compliance with UAE legal requirements</li>
                <li>• Provide clear sections and proper formatting</li>
                <li>• Include disclaimer about legal advice requirements</li>
              </ul>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" />
                Creating Template...
              </>
            ) : (
              <>
                <Icon name="plus" className="h-4 w-4 mr-2" />
                Create Template
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}