import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"

interface LawyerRequestButtonProps {
  conversationId?: string
}

export const LawyerRequestButton = ({ conversationId }: LawyerRequestButtonProps) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    specialization: "employment",
    priority: "normal"
  })

  const specializations = [
    { value: "employment", label: "Employment Law" },
    { value: "commercial", label: "Commercial Law" },
    { value: "real_estate", label: "Real Estate Law" },
    { value: "family", label: "Family Law" },
    { value: "criminal", label: "Criminal Law" },
    { value: "corporate", label: "Corporate Law" },
    { value: "intellectual_property", label: "Intellectual Property" }
  ]

  const priorities = [
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to request lawyer consultation",
        variant: "destructive"
      })
      return
    }

    if (!formData.subject || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('lawyer_requests')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          subject: formData.subject,
          description: formData.description,
          specialization: formData.specialization,
          priority: formData.priority,
          status: 'pending'
        })

      if (error) throw error

      // Send notification to super admins
      await supabase.functions.invoke('notify-lawyer-request', {
        body: {
          subject: formData.subject,
          specialization: formData.specialization,
          priority: formData.priority,
          userEmail: user.email,
          requestId: Date.now() // Simple ID for tracking
        }
      })

      toast({
        title: "Request Submitted",
        description: "Your lawyer consultation request has been submitted. We'll contact you within 24 hours.",
      })

      // Reset form
      setFormData({
        subject: "",
        description: "",
        specialization: "employment",
        priority: "normal"
      })
      setShowForm(false)

    } catch (error) {
      console.error('Error submitting lawyer request:', error)
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!showForm) {
    return (
      <Button
        onClick={() => setShowForm(true)}
        variant="outline"
        size="sm"
        className="border-blue-200 text-blue-700 hover:bg-blue-50"
      >
        <Icon name="user" className="h-4 w-4 mr-2" />
        Speak to a Lawyer
      </Button>
    )
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="user" className="h-5 w-5" />
          Request Lawyer Consultation
        </CardTitle>
        <CardDescription>
          Connect with a qualified UAE lawyer for personalized legal advice
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of your legal matter"
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Specialization
            </label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {specializations.map((spec) => (
                <option key={spec.value} value={spec.value}>
                  {spec.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide details about your legal situation and what kind of assistance you need"
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}