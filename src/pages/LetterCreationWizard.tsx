import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

const LETTER_TYPES = [
  { value: "employment_termination", label: "Employment Termination", icon: "briefcase" },
  { value: "employment_contract", label: "Employment Contract", icon: "file-text" },
  { value: "lease_agreement", label: "Lease Agreement", icon: "home" },
  { value: "lease_termination", label: "Lease Termination", icon: "key" },
  { value: "demand_letter", label: "Demand Letter", icon: "alert-circle" },
  { value: "nda", label: "Non-Disclosure Agreement", icon: "lock" },
  { value: "settlement_agreement", label: "Settlement Agreement", icon: "handshake" },
  { value: "power_of_attorney", label: "Power of Attorney", icon: "shield" },
  { value: "general_legal", label: "General Legal Letter", icon: "mail" },
]

interface LetterDetails {
  [key: string]: string
}

export default function LetterCreationWizard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, refetchProfile } = useAuth()
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [letterType, setLetterType] = useState<string>("")
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState<LetterDetails>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")

  useEffect(() => {
    if (location.state) {
      const { letterType: suggestedType, suggestedTitle, conversationContext } = location.state
      if (suggestedType) setLetterType(suggestedType)
      if (suggestedTitle) setTitle(suggestedTitle)
      if (conversationContext) {
        setDetails({ conversationContext })
      }
    }
  }, [location.state])

  const progress = (currentStep / 5) * 100

  const handleTypeSelect = (type: string) => {
    setLetterType(type)
    setCurrentStep(2)
  }

  const handleDetailChange = (key: string, value: string) => {
    setDetails(prev => ({ ...prev, [key]: value }))
  }

  const getRequiredFields = () => {
    const commonFields = [
      { key: "senderName", label: "Your Name/Company Name", placeholder: "Enter sender name" },
      { key: "senderAddress", label: "Your Address", placeholder: "Enter full address" },
      { key: "recipientName", label: "Recipient Name", placeholder: "Enter recipient name" },
      { key: "recipientAddress", label: "Recipient Address", placeholder: "Enter recipient address" },
    ]

    const specificFields: { [key: string]: any[] } = {
      employment_termination: [
        { key: "employeeName", label: "Employee Name", placeholder: "Full name" },
        { key: "position", label: "Position", placeholder: "Job title" },
        { key: "terminationDate", label: "Termination Date", placeholder: "DD/MM/YYYY" },
        { key: "reason", label: "Reason for Termination", placeholder: "Brief explanation", multiline: true },
      ],
      employment_contract: [
        { key: "employeeName", label: "Employee Name", placeholder: "Full name" },
        { key: "position", label: "Position", placeholder: "Job title" },
        { key: "startDate", label: "Start Date", placeholder: "DD/MM/YYYY" },
        { key: "salary", label: "Salary (AED)", placeholder: "Monthly salary" },
        { key: "benefits", label: "Benefits", placeholder: "Healthcare, housing, etc.", multiline: true },
      ],
      lease_agreement: [
        { key: "propertyAddress", label: "Property Address", placeholder: "Full property address" },
        { key: "tenantName", label: "Tenant Name", placeholder: "Full name" },
        { key: "landlordName", label: "Landlord Name", placeholder: "Full name" },
        { key: "rentAmount", label: "Annual Rent (AED)", placeholder: "Amount in AED" },
        { key: "startDate", label: "Lease Start Date", placeholder: "DD/MM/YYYY" },
        { key: "duration", label: "Lease Duration", placeholder: "e.g., 12 months" },
      ],
      demand_letter: [
        { key: "demandType", label: "Type of Demand", placeholder: "Payment, action, etc." },
        { key: "amount", label: "Amount (if applicable)", placeholder: "AED amount" },
        { key: "deadline", label: "Deadline for Compliance", placeholder: "DD/MM/YYYY" },
        { key: "consequences", label: "Consequences of Non-Compliance", placeholder: "Legal action, etc.", multiline: true },
      ],
    }

    return [...commonFields, ...(specificFields[letterType] || [])]
  }

  const validateStep = () => {
    if (currentStep === 1 && !letterType) {
      toast({
        title: "Letter type required",
        description: "Please select a letter type to continue",
        variant: "destructive"
      })
      return false
    }

    if (currentStep === 2 && !title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your letter",
        variant: "destructive"
      })
      return false
    }

    if (currentStep === 3) {
      const required = getRequiredFields()
      const missingFields = required.filter(field => !details[field.key]?.trim())
      if (missingFields.length > 0) {
        toast({
          title: "Missing information",
          description: `Please fill in: ${missingFields.map(f => f.label).join(", ")}`,
          variant: "destructive"
        })
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleGenerateLetter = async () => {
    if (!profile) return

    const creditsNeeded = 5
    const creditsAvailable = profile.max_credits_per_period - profile.queries_used

    if (creditsAvailable < creditsNeeded) {
      toast({
        title: "Insufficient credits",
        description: `You need ${creditsNeeded} credits but only have ${creditsAvailable} available`,
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)

    try {
      const { data, error } = await supabase.functions.invoke('generate-legal-letter', {
        body: {
          letterType,
          details,
          conversationContext: details.conversationContext
        }
      })

      if (error) throw error

      if (data.error) {
        throw new Error(data.error)
      }

      setGeneratedContent(data.content)
      await refetchProfile()
      setCurrentStep(5)

      toast({
        title: "Letter generated!",
        description: `${creditsNeeded} credits deducted from your account`
      })
    } catch (error: any) {
      console.error("Error generating letter:", error)
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate letter. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveLetter = async () => {
    if (!user || !generatedContent) return

    try {
      const { data, error } = await supabase
        .from('legal_letters')
        .insert([{
          user_id: user.id,
          letter_type: letterType as Database["public"]["Enums"]["letter_type"],
          title,
          content: generatedContent,
          status: 'draft' as Database["public"]["Enums"]["letter_status"],
          metadata: details,
          credits_used: 5
        }])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Letter saved!",
        description: "Your letter has been saved as a draft"
      })

      navigate(`/letters/${data.id}`)
    } catch (error: any) {
      console.error("Error saving letter:", error)
      toast({
        title: "Save failed",
        description: error.message || "Failed to save letter. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Create Legal Letter</CardTitle>
              <CardDescription>Step {currentStep} of 5</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Icon name="zap" className="w-3 h-3" />
              5 credits
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Letter Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Select Letter Type</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose the type of legal letter you want to create
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LETTER_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={letterType === type.value ? "default" : "outline"}
                    className="justify-start h-auto py-4"
                    onClick={() => handleTypeSelect(type.value)}
                  >
                    <Icon name={type.icon} className="w-5 h-5 mr-3" />
                    <span>{type.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Letter Title */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Letter Title</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Give your letter a descriptive title for easy reference
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Employment Termination - John Doe"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {title.length}/100 characters
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Letter Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Letter Details</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Provide the required information for your letter
                </p>
              </div>
              <div className="space-y-4">
                {getRequiredFields().map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {field.multiline ? (
                      <Textarea
                        id={field.key}
                        placeholder={field.placeholder}
                        value={details[field.key] || ""}
                        onChange={(e) => handleDetailChange(field.key, e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        placeholder={field.placeholder}
                        value={details[field.key] || ""}
                        onChange={(e) => handleDetailChange(field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Review & Confirm</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please review your information before generating the letter
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Letter Type</p>
                    <p className="font-medium">
                      {LETTER_TYPES.find(t => t.value === letterType)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Title</p>
                    <p className="font-medium">{title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Details</p>
                    <div className="space-y-2">
                      {Object.entries(details)
                        .filter(([key]) => key !== 'conversationContext')
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                  <Icon name="info" className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Credit Usage</p>
                    <p className="text-muted-foreground">
                      Generating this letter will deduct 5 credits from your account. 
                      You currently have {profile ? profile.max_credits_per_period - profile.queries_used : 0} credits available.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Generated Letter */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Your Generated Letter</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Review your letter below. You can save it as a draft or edit it further.
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6">
                <pre className="whitespace-pre-wrap font-serif text-sm">
                  {generatedContent}
                </pre>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isGenerating}
            >
              <Icon name="arrow-left" className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep < 4 && (
                <Button onClick={handleNext}>
                  Next
                  <Icon name="arrow-right" className="w-4 h-4 ml-2" />
                </Button>
              )}

              {currentStep === 4 && (
                <Button onClick={handleGenerateLetter} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Icon name="loader" className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon name="wand" className="w-4 h-4 mr-2" />
                      Generate Letter
                    </>
                  )}
                </Button>
              )}

              {currentStep === 5 && (
                <>
                  <Button variant="outline" onClick={() => navigate('/letters')}>
                    View All Letters
                  </Button>
                  <Button onClick={handleSaveLetter}>
                    <Icon name="save" className="w-4 h-4 mr-2" />
                    Save Letter
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
