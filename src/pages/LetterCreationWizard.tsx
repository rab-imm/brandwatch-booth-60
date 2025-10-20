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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Shield, AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { format, parseISO, isValid, isBefore, isAfter, subYears, addYears, subMonths, addMonths, startOfDay } from "date-fns"

const LETTER_TYPES = [
  { value: "employment_termination", label: "Employment Termination", icon: "briefcase" },
  { value: "employment_contract", label: "Employment Contract", icon: "file-text" },
  { value: "lease_agreement", label: "Lease Agreement", icon: "home" },
  { value: "lease_termination", label: "Lease Termination", icon: "key" },
  { value: "demand_letter", label: "Demand Letter", icon: "alert-circle" },
  { value: "nda", label: "Non-Disclosure Agreement", icon: "lock" },
  { value: "settlement_agreement", label: "Settlement Agreement", icon: "handshake" },
  { value: "power_of_attorney", label: "Power of Attorney", icon: "shield" },
  { value: "workplace_complaint", label: "Workplace Complaint", icon: "alert-triangle" },
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
  const [dataProtectionConsent, setDataProtectionConsent] = useState(false)

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

  const progress = (currentStep / 6) * 100

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
        { key: "terminationDate", label: "Termination Date", type: "date", placeholder: "Select date" },
        { key: "reason", label: "Reason for Termination", placeholder: "Brief explanation", multiline: true },
      ],
      employment_contract: [
        { key: "employeeName", label: "Employee Name", placeholder: "Full name" },
        { key: "position", label: "Position", placeholder: "Job title" },
        { key: "startDate", label: "Start Date", type: "date", placeholder: "Select date" },
        { key: "salary", label: "Salary (AED)", placeholder: "Monthly salary" },
        { key: "benefits", label: "Benefits", placeholder: "Healthcare, housing, etc.", multiline: true },
      ],
      lease_agreement: [
        { key: "propertyAddress", label: "Property Address", placeholder: "Full property address" },
        { key: "tenantName", label: "Tenant Name", placeholder: "Full name" },
        { key: "landlordName", label: "Landlord Name", placeholder: "Full name" },
        { key: "rentAmount", label: "Annual Rent (AED)", placeholder: "Amount in AED" },
        { key: "startDate", label: "Lease Start Date", type: "date", placeholder: "Select date" },
        { key: "duration", label: "Lease Duration", placeholder: "e.g., 12 months" },
      ],
      demand_letter: [
        { key: "demandType", label: "Type of Demand", placeholder: "Payment, action, etc." },
        { key: "amount", label: "Amount (if applicable)", placeholder: "AED amount" },
        { key: "deadline", label: "Deadline for Compliance", type: "date", placeholder: "Select date" },
        { key: "consequences", label: "Consequences of Non-Compliance", placeholder: "Legal action, etc.", multiline: true },
      ],
      workplace_complaint: [
        { key: "complainantName", label: "Your Name", placeholder: "Full name" },
        { key: "managerName", label: "Manager/Supervisor Name", placeholder: "Full name" },
        { key: "department", label: "Department", placeholder: "Department name" },
        { key: "complaintDetails", label: "Complaint Details", placeholder: "Describe the issue in detail", multiline: true },
        { key: "incidentDate", label: "Date of Incident", type: "date", placeholder: "Select date" },
        { key: "witnesses", label: "Witnesses (if any)", placeholder: "Names of witnesses", multiline: true },
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

      // Validate date fields
      const dateFields = required.filter(field => field.type === "date")
      for (const field of dateFields) {
        const dateValue = details[field.key]
        if (!dateValue) continue

        try {
          const date = parseISO(dateValue)
          const today = startOfDay(new Date())

          if (!isValid(date)) {
            toast({
              title: "Invalid date",
              description: `Please select a valid ${field.label.toLowerCase()}`,
              variant: "destructive"
            })
            return false
          }

          // Validate based on field type
          if (field.key === "terminationDate") {
            const oneYearAgo = subYears(today, 1)
            const sixMonthsFromNow = addMonths(today, 6)
            if (isBefore(date, oneYearAgo) || isAfter(date, sixMonthsFromNow)) {
              toast({
                title: "Invalid termination date",
                description: "Termination date should be within the past year or next 6 months",
                variant: "destructive"
              })
              return false
            }
          }

          if (field.key === "startDate") {
            const threeMonthsAgo = subMonths(today, 3)
            const oneYearFromNow = addYears(today, 1)
            if (isBefore(date, threeMonthsAgo) || isAfter(date, oneYearFromNow)) {
              toast({
                title: "Invalid start date",
                description: "Start date should be within 3 months in the past or 1 year in the future",
                variant: "destructive"
              })
              return false
            }
          }

          if (field.key === "deadline") {
            const tomorrow = addMonths(today, 0)
            const twoYearsFromNow = addYears(today, 2)
            if (isBefore(date, tomorrow)) {
              toast({
                title: "Invalid deadline",
                description: "Deadline must be in the future",
                variant: "destructive"
              })
              return false
            }
            if (isAfter(date, twoYearsFromNow)) {
              toast({
                title: "Invalid deadline",
                description: "Deadline should not be more than 2 years in the future",
                variant: "destructive"
              })
              return false
            }
          }

          if (field.key === "incidentDate") {
            const fiveYearsAgo = subYears(today, 5)
            if (isAfter(date, today)) {
              toast({
                title: "Invalid incident date",
                description: "Incident date cannot be in the future",
                variant: "destructive"
              })
              return false
            }
            if (isBefore(date, fiveYearsAgo)) {
              toast({
                title: "Invalid incident date",
                description: "Incident date should not be more than 5 years ago",
                variant: "destructive"
              })
              return false
            }
          }
        } catch (error) {
          toast({
            title: "Invalid date",
            description: `Please select a valid ${field.label.toLowerCase()}`,
            variant: "destructive"
          })
          return false
        }
      }
    }

    if (currentStep === 4 && !dataProtectionConsent) {
      toast({
        title: "Acknowledgment required",
        description: "Please acknowledge data protection compliance to continue",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 6))
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
      setCurrentStep(6)

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
              <CardDescription>Step {currentStep} of 6</CardDescription>
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
                    {field.type === "date" ? (
                      <DatePickerField
                        label={field.label}
                        placeholder={field.placeholder}
                        value={details[field.key] || ""}
                        onChange={(date) => handleDetailChange(field.key, date)}
                      />
                    ) : field.multiline ? (
                      <>
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <Textarea
                          id={field.key}
                          placeholder={field.placeholder}
                          value={details[field.key] || ""}
                          onChange={(e) => handleDetailChange(field.key, e.target.value)}
                          rows={3}
                        />
                      </>
                    ) : (
                      <>
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <Input
                          id={field.key}
                          placeholder={field.placeholder}
                          value={details[field.key] || ""}
                          onChange={(e) => handleDetailChange(field.key, e.target.value)}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Data Protection Consent */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Data Protection Acknowledgment</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please review and acknowledge data protection requirements
                </p>
              </div>
              
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  UAE Federal Law No. 45 of 2021 (PDPL) Compliance
                </AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <p className="mb-3">
                    This letter will contain personal information protected under UAE data protection law.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">By proceeding, you confirm that:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>You have lawful consent to process the personal data in this letter</li>
                      <li>You will handle all personal information in accordance with UAE PDPL</li>
                      <li>You will implement appropriate security measures to protect this data</li>
                      <li>You will only use this data for the stated legal purposes</li>
                      <li>You understand your obligations regarding data retention and disposal</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2 p-4 border rounded-lg bg-card">
                <Checkbox
                  id="dataProtectionConsent"
                  checked={dataProtectionConsent}
                  onCheckedChange={(checked) => setDataProtectionConsent(checked === true)}
                />
                <label
                  htmlFor="dataProtectionConsent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I acknowledge and agree to comply with UAE data protection requirements
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Review & Confirm */}
          {currentStep === 5 && (
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
                        .map(([key, value]) => {
                          // Format date fields
                          const isDateField = ['terminationDate', 'startDate', 'deadline', 'incidentDate'].includes(key)
                          const displayValue = isDateField && value
                            ? (() => {
                                try {
                                  return format(parseISO(value), 'dd/MM/yyyy')
                                } catch {
                                  return value
                                }
                              })()
                            : value

                          return (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className="font-medium">{displayValue}</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-900 dark:text-blue-100">Personal Data Notice</AlertTitle>
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    The information above may include personal data. A data protection notice will be automatically included in your generated letter to ensure UAE PDPL compliance.
                  </AlertDescription>
                </Alert>

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

          {/* Step 6: Generated Letter */}
          {currentStep === 6 && (
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

              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-900 dark:text-green-100">
                  Data Protection Compliance Notice
                </AlertTitle>
                <AlertDescription className="text-green-800 dark:text-green-200 space-y-2">
                  <p>Your letter includes a data protection notice compliant with UAE PDPL. When using this letter:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                    <li>Store it securely and limit access to authorized persons only</li>
                    <li>Do not share it with unauthorized third parties</li>
                    <li>Dispose of it securely when no longer needed</li>
                    <li>Respect the data subject's rights under UAE PDPL</li>
                  </ul>
                </AlertDescription>
              </Alert>
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
              {currentStep < 5 && (
                <Button onClick={handleNext}>
                  Next
                  <Icon name="arrow-right" className="w-4 h-4 ml-2" />
                </Button>
              )}

              {currentStep === 5 && (
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

              {currentStep === 6 && (
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
