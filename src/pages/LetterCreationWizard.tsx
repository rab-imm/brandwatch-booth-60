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
        { key: "complainantName", label: "Your Full Name", placeholder: "First and last name" },
        { key: "complainantPosition", label: "Your Position/Job Title", placeholder: "e.g., Software Engineer, Sales Manager" },
        { key: "complainantDepartment", label: "Your Department", placeholder: "e.g., IT, Sales, Operations" },
        { key: "complainantContactEmail", label: "Your Work Email", placeholder: "your.name@company.com" },
        { key: "complainantContactPhone", label: "Your Contact Phone", placeholder: "+971 XX XXX XXXX" },
        { key: "employeeId", label: "Employee ID (if applicable)", placeholder: "Your employee identification number" },
        { key: "managerName", label: "Your Direct Manager's Name", placeholder: "Manager's full name" },
        { key: "managerPosition", label: "Manager's Position", placeholder: "Manager's job title" },
        { key: "respondentName", label: "Person Complaint Is Against (if applicable)", placeholder: "Full name or write 'N/A' if general issue" },
        { key: "respondentPosition", label: "Respondent's Position (if applicable)", placeholder: "Their job title or write 'N/A'" },
        { key: "department", label: "Department Where Incident Occurred", placeholder: "Department name" },
        { key: "incidentDate", label: "Date of Primary Incident", type: "date", placeholder: "Select date" },
        { key: "incidentLocation", label: "Location of Incident", placeholder: "e.g., Office building, specific floor, meeting room" },
        { key: "complaintCategory", label: "Category of Complaint", placeholder: "e.g., Harassment, Discrimination, Safety Concern, Policy Violation, Bullying" },
        { key: "complaintDetails", label: "Detailed Description of Incident(s)", placeholder: "Describe what happened. Include: Who was involved, what was said or done, when it occurred, where it happened, and any relevant context. Be specific and factual.", multiline: true },
        { key: "impactDescription", label: "Impact on You and Your Work", placeholder: "Explain how this incident has affected you emotionally, professionally, or physically. Include any impact on your work performance or well-being.", multiline: true },
        { key: "priorIncidents", label: "Previous Related Incidents", placeholder: "Have similar incidents occurred before? If yes, provide dates and brief descriptions. Write 'None' if first occurrence.", multiline: true },
        { key: "evidenceAvailable", label: "Evidence You Have", placeholder: "List any supporting evidence: emails (with dates), text messages, photos, documents, audio recordings, etc. Example: 'Email from John dated 15/03/2025', 'Screenshot of conversation'", multiline: true },
        { key: "witnessName1", label: "Witness 1 - Full Name (Optional)", placeholder: "Leave blank if no witnesses" },
        { key: "witnessPosition1", label: "Witness 1 - Position/Department", placeholder: "Their job title and department" },
        { key: "witnessContact1", label: "Witness 1 - Contact Information", placeholder: "Email or phone number" },
        { key: "witnessRelation1", label: "Witness 1 - What They Witnessed", placeholder: "Brief description of what this witness observed" },
        { key: "witnessName2", label: "Witness 2 - Full Name (Optional)", placeholder: "Leave blank if not applicable" },
        { key: "witnessPosition2", label: "Witness 2 - Position/Department", placeholder: "Their job title and department" },
        { key: "witnessContact2", label: "Witness 2 - Contact Information", placeholder: "Email or phone number" },
        { key: "witnessRelation2", label: "Witness 2 - What They Witnessed", placeholder: "Brief description of what this witness observed" },
        { key: "desiredOutcome", label: "Desired Outcome/Resolution", placeholder: "What resolution are you seeking? e.g., Investigation, disciplinary action, policy change, department transfer, formal apology, training for staff, etc.", multiline: true },
        { key: "previousReports", label: "Previous Reports to HR or Management", placeholder: "Have you reported this or similar issues before? If yes, provide dates, who you reported to, and any reference numbers. Write 'None' if this is the first report.", multiline: true },
        { key: "emirate", label: "Emirate (for Jurisdiction)", placeholder: "e.g., Dubai, Abu Dhabi, Sharjah, Ajman" },
      ],
      general_legal: [
        { key: "letterPurpose", label: "Purpose of Letter", placeholder: "e.g., Breach of Contract Notice, Cease and Desist, Formal Complaint, Request for Payment", required: true },
        { key: "referenceNumber", label: "Reference Number (Optional)", placeholder: "e.g., REF/2025/001" },
        { key: "matterDescription", label: "Description of Matter", placeholder: "Provide a clear, factual description of the situation, issue, or matter being addressed. Include key facts, dates, and relevant background.", multiline: true, required: true },
        { key: "legalBasis", label: "Legal Basis / Grounds", placeholder: "What is the legal foundation for this letter? (e.g., Breach of contract under UAE Civil Code, violation of agreement, UAE consumer protection law). If unsure, write 'General business matter' and AI will suggest appropriate legal basis.", multiline: true, required: true },
        { key: "applicableLaws", label: "Applicable UAE Laws (if known)", placeholder: "e.g., Federal Law No. 5 of 1985 (Civil Code), Federal Decree-Law No. 32 of 2021 (Commercial Companies). Leave blank if unsure and AI will suggest appropriate laws.", multiline: true },
        { key: "breachDetails", label: "Breach/Violation Details (if applicable)", placeholder: "If alleging a breach or violation: What was breached? When? What were the obligations that were not fulfilled? Leave blank if not applicable.", multiline: true },
        { key: "requiredAction", label: "Required Action from Recipient", placeholder: "What specific action do you require the recipient to take? Be clear and specific (e.g., Pay outstanding amount of AED 50,000, cease infringing activities, provide requested documents, issue formal apology)", multiline: true, required: true },
        { key: "actionDeadline", label: "Deadline for Action", type: "date", placeholder: "Select deadline date" },
        { key: "deadlineCalendarDays", label: "Or Specify Calendar Days", placeholder: "e.g., 14 (if you prefer to state 'within 14 calendar days from receipt')" },
        { key: "consequences", label: "Consequences of Non-Compliance", placeholder: "What will happen if the recipient does not comply? (e.g., Legal proceedings will be initiated in Dubai Courts, claim for damages of AED X, contract termination, reporting to authorities)", multiline: true, required: true },
        { key: "monetaryAmount", label: "Monetary Amount (if applicable)", placeholder: "AED amount (e.g., 50000.00)" },
        { key: "emirate", label: "Emirate for Jurisdiction", placeholder: "e.g., Dubai, Abu Dhabi, Sharjah (for court jurisdiction clause)", required: true },
        { key: "disputeResolutionPreference", label: "Dispute Resolution Preference", placeholder: "Select preference: Courts, Arbitration, or leave blank for default (courts)" },
        { key: "isConfidential", label: "Is this matter confidential/sensitive?", type: "select", options: ["Yes - Include confidentiality clause", "No - Standard letter"], required: true },
        { key: "attachedDocuments", label: "Attached/Enclosed Documents (if any)", placeholder: "List any documents enclosed or referenced (e.g., Copy of contract dated 15/01/2024, Invoice No. 12345, Previous correspondence dated 01/03/2025)", multiline: true },
        { key: "previousCorrespondence", label: "Previous Correspondence/Attempts to Resolve", placeholder: "Describe any previous attempts to resolve this matter (dates, methods, outcomes). This strengthens your position.", multiline: true },
        { key: "urgency", label: "Urgency Level", type: "select", options: ["Standard", "Urgent - Time-sensitive matter", "Extremely Urgent - Immediate action required"], required: true },
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

      // Additional validation for workplace complaint fields
      if (letterType === 'workplace_complaint') {
        // Validate email format
        const emailField = details.complainantContactEmail
        if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField)) {
          toast({
            title: "Invalid email format",
            description: "Please enter a valid email address",
            variant: "destructive"
          })
          return false
        }

        // Validate UAE phone format
        const phoneField = details.complainantContactPhone
        if (phoneField && !/^\+971\s?\d{1,2}\s?\d{3}\s?\d{4}$/.test(phoneField)) {
          toast({
            title: "Invalid phone format",
            description: "Please enter a valid UAE phone number (e.g., +971 50 123 4567)",
            variant: "destructive"
          })
          return false
        }

        // Ensure emirate is filled (required for jurisdiction)
        if (!details.emirate || !details.emirate.trim()) {
          toast({
            title: "Emirate required",
            description: "Please specify the emirate for jurisdictional purposes",
            variant: "destructive"
          })
          return false
        }

        // Validate witness information - if name is provided, require contact info
        if (details.witnessName1 && details.witnessName1.trim() && 
            (!details.witnessContact1 || !details.witnessContact1.trim())) {
          toast({
            title: "Witness contact required",
            description: "Please provide contact information for Witness 1",
            variant: "destructive"
          })
          return false
        }

        if (details.witnessName2 && details.witnessName2.trim() && 
            (!details.witnessContact2 || !details.witnessContact2.trim())) {
          toast({
            title: "Witness contact required",
            description: "Please provide contact information for Witness 2",
            variant: "destructive"
          })
          return false
        }
      }

      // Additional validation for general_legal fields
      if (letterType === 'general_legal') {
        // Validate emirate (required for jurisdiction)
        if (!details.emirate || !details.emirate.trim()) {
          toast({
            title: "Emirate required",
            description: "Please specify the emirate for jurisdictional purposes",
            variant: "destructive"
          })
          return false
        }

        // Validate monetary amount format if provided
        if (details.monetaryAmount && details.monetaryAmount.trim()) {
          const amountValue = parseFloat(details.monetaryAmount.replace(/[^0-9.]/g, ''))
          if (isNaN(amountValue) || amountValue < 0) {
            toast({
              title: "Invalid amount",
              description: "Please enter a valid monetary amount (numbers only)",
              variant: "destructive"
            })
            return false
          }
        }

        // Validate deadline calendar days if provided (instead of date)
        if (details.deadlineCalendarDays && details.deadlineCalendarDays.trim()) {
          const days = parseInt(details.deadlineCalendarDays)
          if (isNaN(days) || days < 1 || days > 365) {
            toast({
              title: "Invalid calendar days",
              description: "Please enter a valid number of days between 1 and 365",
              variant: "destructive"
            })
            return false
          }
        }

        // Ensure either actionDeadline (date) OR deadlineCalendarDays is provided
        if ((!details.actionDeadline || !details.actionDeadline.trim()) && 
            (!details.deadlineCalendarDays || !details.deadlineCalendarDays.trim())) {
          toast({
            title: "Deadline required",
            description: "Please specify either a deadline date or number of calendar days",
            variant: "destructive"
          })
          return false
        }
      }
    }

    if (currentStep === 4 && letterType !== 'workplace_complaint' && !dataProtectionConsent) {
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

          {/* Step 4: Workplace Complaint Acknowledgment OR Data Protection Consent */}
          {currentStep === 4 && letterType === 'workplace_complaint' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-amber-600 dark:text-amber-400">
                  Important Information Before Proceeding
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please read and acknowledge the following information about filing a workplace complaint
                </p>
              </div>
              
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  Workplace Complaint - Your Rights and Responsibilities
                </AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200 space-y-4 mt-3">
                  <div>
                    <p className="font-semibold mb-2">CONFIDENTIALITY:</p>
                    <p className="text-sm">
                      Your complaint will be handled confidentially. However, details may need to be shared with authorized personnel (HR, management, legal counsel) during the investigation. Complete confidentiality cannot be guaranteed if the investigation requires disclosure.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">RETALIATION PROTECTION:</p>
                    <p className="text-sm">
                      UAE labor law (Federal Decree-Law No. 33 of 2021) protects you from retaliation for filing good-faith complaints. Prohibited retaliation includes: termination, demotion, unfavorable schedule changes, or creating a hostile work environment. Document any retaliation immediately and report it to HR.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">INVESTIGATION TIMELINE:</p>
                    <p className="text-sm">
                      Workplace complaint investigations typically take 7-14 business days from the date of receipt. You will be updated on progress at least every 5 business days. Complex cases may require additional time.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">EVIDENCE PRESERVATION:</p>
                    <p className="text-sm">
                      Gather and preserve all evidence that supports your complaint: emails, text messages, documents, photos, audio recordings (if legally obtained). Do not delete or modify any evidence. Make copies and store them securely.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">WITNESS COOPERATION:</p>
                    <p className="text-sm">
                      Before listing witnesses, inform them that they may be contacted as part of the investigation. Ensure they are willing to participate. Witnesses also have protection from retaliation under UAE law.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">ACCURACY AND GOOD FAITH:</p>
                    <p className="text-sm">
                      All information provided must be truthful and accurate to the best of your knowledge. Filing false or malicious complaints may result in disciplinary action. The investigation will be conducted impartially based on evidence.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">YOUR RIGHTS:</p>
                    <ul className="text-sm list-disc list-inside space-y-1 mt-2">
                      <li>Right to be informed of investigation progress</li>
                      <li>Right to provide additional evidence</li>
                      <li>Right to escalate to MOHRE if resolution is unsatisfactory</li>
                      <li>Right to legal representation</li>
                      <li>Right to confidentiality (within legal limits)</li>
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
                  className="text-sm font-medium leading-relaxed cursor-pointer"
                >
                  I have read and understood the information above regarding workplace complaints, including confidentiality limitations, retaliation protection, investigation timelines, and my responsibilities. I confirm that all information provided in this complaint is accurate and truthful to the best of my knowledge, and I am filing this complaint in good faith.
                </label>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">
                  Need Help?
                </AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                  If you need legal advice before filing this complaint, consider consulting with:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>UAE Ministry of Human Resources and Emiratisation (MOHRE) - Free consultation</li>
                    <li>UAE Labor Offices - Available in each emirate</li>
                    <li>Licensed employment lawyers specializing in UAE labor law</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 4: Data Protection Consent (for non-workplace-complaint letters) */}
          {currentStep === 4 && letterType !== 'workplace_complaint' && (
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

              {/* Workplace Complaint Structured Review */}
              {letterType === 'workplace_complaint' ? (
                <div className="space-y-4">
                  {/* Complainant Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Complainant Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{details.complainantName}</span>
                        <span className="text-muted-foreground">Position:</span>
                        <span className="font-medium">{details.complainantPosition}</span>
                        <span className="text-muted-foreground">Department:</span>
                        <span className="font-medium">{details.complainantDepartment}</span>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{details.complainantContactEmail}</span>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{details.complainantContactPhone}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Incident Details */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Incident Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date:</p>
                        <p className="text-sm">{details.incidentDate ? format(parseISO(details.incidentDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                      </div>
                      {details.incidentLocation && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Location:</p>
                          <p className="text-sm">{details.incidentLocation}</p>
                        </div>
                      )}
                      {details.complaintCategory && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Category:</p>
                          <p className="text-sm">{details.complaintCategory}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Description:</p>
                        <p className="text-sm whitespace-pre-wrap">{details.complaintDetails}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Witness Information */}
                  {(details.witnessName1 || details.witnessName2) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Witness Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {details.witnessName1 && (
                          <div className="p-3 bg-muted/50 rounded">
                            <p className="font-medium text-sm mb-2">Witness 1:</p>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Name:</span> {details.witnessName1}</p>
                              {details.witnessPosition1 && <p><span className="text-muted-foreground">Position:</span> {details.witnessPosition1}</p>}
                              {details.witnessContact1 && <p><span className="text-muted-foreground">Contact:</span> {details.witnessContact1}</p>}
                              {details.witnessRelation1 && <p><span className="text-muted-foreground">Witnessed:</span> {details.witnessRelation1}</p>}
                            </div>
                          </div>
                        )}
                        {details.witnessName2 && (
                          <div className="p-3 bg-muted/50 rounded">
                            <p className="font-medium text-sm mb-2">Witness 2:</p>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Name:</span> {details.witnessName2}</p>
                              {details.witnessPosition2 && <p><span className="text-muted-foreground">Position:</span> {details.witnessPosition2}</p>}
                              {details.witnessContact2 && <p><span className="text-muted-foreground">Contact:</span> {details.witnessContact2}</p>}
                              {details.witnessRelation2 && <p><span className="text-muted-foreground">Witnessed:</span> {details.witnessRelation2}</p>}
                            </div>
                          </div>
                        )}
                        {(!details.witnessPosition1 || !details.witnessContact1) && details.witnessName1 && (
                          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                              Incomplete witness information may delay the investigation. HR will follow up to collect missing details.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Evidence & Outcome */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Evidence & Desired Outcome</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {details.evidenceAvailable && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Evidence Available:</p>
                          <p className="text-sm whitespace-pre-wrap">{details.evidenceAvailable}</p>
                        </div>
                      )}
                      {details.desiredOutcome && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Desired Outcome:</p>
                          <p className="text-sm whitespace-pre-wrap">{details.desiredOutcome}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Legal Information */}
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-900 dark:text-green-100">
                      Legal Compliance Included
                    </AlertTitle>
                    <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                      Your complaint letter will automatically include:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>UAE Labor Law (Federal Decree-Law No. 33 of 2021) references</li>
                        <li>UAE PDPL (Federal Law No. 45 of 2021) data protection notice</li>
                        <li>Dispute resolution pathway (Internal → MOHRE → Labor Courts)</li>
                        <li>Retaliation protection information</li>
                        <li>Investigation timeline and process</li>
                        <li>Confidentiality statement</li>
                        <li>Acknowledgment of receipt section</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {details.emirate && (
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-900 dark:text-blue-100">
                        Jurisdiction: {details.emirate}
                      </AlertTitle>
                      <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                        This complaint is filed for jurisdiction in {details.emirate}, UAE. If escalation to labor courts becomes necessary, it will be under the jurisdiction of {details.emirate} Labor Court.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : letterType === 'general_legal' ? (
                <div className="space-y-4">
                  {/* Letter Purpose & Context */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Letter Purpose & Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Purpose:</p>
                        <p className="text-sm font-semibold">{details.letterPurpose}</p>
                      </div>
                      {details.referenceNumber && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Reference:</p>
                          <p className="text-sm">{details.referenceNumber}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Matter Description:</p>
                        <p className="text-sm whitespace-pre-wrap">{details.matterDescription}</p>
                      </div>
                      {details.urgency && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Urgency:</p>
                          <Badge variant={details.urgency.includes('Extremely') ? 'destructive' : details.urgency.includes('Urgent') ? 'default' : 'secondary'}>
                            {details.urgency}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Legal Basis */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Legal Basis & Applicable Law</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Legal Grounds:</p>
                        <p className="text-sm whitespace-pre-wrap">{details.legalBasis}</p>
                      </div>
                      {details.applicableLaws && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Applicable UAE Laws:</p>
                          <p className="text-sm whitespace-pre-wrap">{details.applicableLaws}</p>
                        </div>
                      )}
                      {details.breachDetails && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Breach/Violation:</p>
                          <p className="text-sm whitespace-pre-wrap">{details.breachDetails}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Required Action & Deadline */}
                  <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-amber-900 dark:text-amber-100">Required Action & Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Action Required:</p>
                        <p className="text-sm whitespace-pre-wrap text-amber-900 dark:text-amber-100">{details.requiredAction}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="calendar" className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Deadline:</p>
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                            {details.actionDeadline ? format(parseISO(details.actionDeadline), 'dd/MM/yyyy') : 
                             `Within ${details.deadlineCalendarDays} calendar days from receipt`}
                          </p>
                        </div>
                      </div>
                      {details.monetaryAmount && (
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Amount:</p>
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">AED {parseFloat(details.monetaryAmount).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Consequences of Non-Compliance:</p>
                        <p className="text-sm whitespace-pre-wrap text-amber-900 dark:text-amber-100">{details.consequences}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Supporting Information */}
                  {(details.attachedDocuments || details.previousCorrespondence) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Supporting Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {details.attachedDocuments && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Attached Documents:</p>
                            <p className="text-sm whitespace-pre-wrap">{details.attachedDocuments}</p>
                          </div>
                        )}
                        {details.previousCorrespondence && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Previous Correspondence:</p>
                            <p className="text-sm whitespace-pre-wrap">{details.previousCorrespondence}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Legal Compliance Summary */}
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-900 dark:text-green-100">
                      Legal Compliance Included
                    </AlertTitle>
                    <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                      Your letter will automatically include:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Governing Law: UAE federal laws (with specific law references if provided)</li>
                        <li>Dispute Resolution: Jurisdiction in {details.emirate} Courts {details.disputeResolutionPreference && `(${details.disputeResolutionPreference})`}</li>
                        <li>UAE PDPL (Federal Law No. 45 of 2021) data protection compliance</li>
                        <li>Actionable deadline: {details.actionDeadline ? format(parseISO(details.actionDeadline), 'dd MMMM yyyy') : `${details.deadlineCalendarDays} calendar days from receipt`}</li>
                        <li>Clear consequences of non-compliance</li>
                        {details.isConfidential === "Yes - Include confidentiality clause" && <li>Confidentiality clause (strict confidentiality provisions)</li>}
                        <li>Reservation of rights clause</li>
                        <li>Professional formatting with standardized section headers</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {/* Confidentiality Notice */}
                  {details.isConfidential === "Yes - Include confidentiality clause" && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertTitle className="text-red-900 dark:text-red-100">
                        Confidential Matter
                      </AlertTitle>
                      <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
                        This letter will include a comprehensive confidentiality clause stating that the letter and its contents are strictly confidential and intended solely for the addressee. Unauthorized disclosure is prohibited and may result in legal action.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Jurisdiction Notice */}
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-900 dark:text-blue-100">
                      Jurisdiction: {details.emirate}, UAE
                    </AlertTitle>
                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                      This letter specifies that disputes will be subject to the exclusive jurisdiction of the courts of {details.emirate}, United Arab Emirates. {details.disputeResolutionPreference === "Arbitration" && "The letter also mentions the option of arbitration under UAE Arbitration Law (Federal Law No. 6 of 2018)."}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
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
                </div>
              )}

              {/* Credit usage information - applies to all letter types */}
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
