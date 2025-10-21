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
  { value: "general_legal", label: "General Legal Letter", icon: "file-text" },
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
        // REFERENCE & BASIC INFO
        { key: "referenceNumber", label: "Reference Number (Optional)", placeholder: "e.g., INV-2025-001, REF-DEM-001" },

        // DEBT TYPE & CONTEXT (Critical for template)
        { key: "debtType", label: "Type of Debt/Claim", type: "select", options: [
          "Unpaid Invoice - Goods or services provided but not paid",
          "Breach of Contract - Contractual obligations not fulfilled",
          "Payment for Services - Services completed, payment outstanding",
          "Loan Repayment - Outstanding loan or advance",
          "Rental Arrears - Unpaid rent for property",
          "Other - Specify in details below"
        ], required: true },

        // AMOUNT
        { key: "amount", label: "Amount Demanded (AED)", placeholder: "e.g., 50000.00 (numbers only)", required: true },

        // DEBT REASON - SPECIFIC REFERENCES BASED ON DEBT TYPE
        // For Unpaid Invoice
        { key: "invoiceNumber", label: "Invoice Number (if Unpaid Invoice)", placeholder: "e.g., INV-2024-12345" },
        { key: "invoiceDate", label: "Invoice Date (if Unpaid Invoice)", type: "date", placeholder: "Date invoice was issued" },
        { key: "serviceDescription", label: "Goods/Services Provided", placeholder: "Describe what was provided (e.g., 'Web development services for 3 months', '500 units of Product X')", multiline: true, required: true },
        { key: "originalPaymentTerms", label: "Original Payment Terms", placeholder: "e.g., Net 30 days, Payment on delivery, As per contract", required: true },
        { key: "originalDueDate", label: "Original Due Date", type: "date", placeholder: "When was payment originally due?", required: true },

        // For Breach of Contract
        { key: "contractTitle", label: "Contract Title (if Breach of Contract)", placeholder: "e.g., 'Service Agreement dated 15/01/2024'" },
        { key: "contractDate", label: "Contract Date (if Breach of Contract)", type: "date", placeholder: "Date contract was signed" },
        { key: "contractClause", label: "Relevant Contract Clause (if applicable)", placeholder: "e.g., Clause 5.2 - Payment Terms, Clause 8.1 - Delivery Obligations" },
        { key: "breachDetails", label: "Breach Details (if Breach of Contract)", placeholder: "Describe how the contract was breached and what obligations were not fulfilled", multiline: true },

        // For Loan Repayment
        { key: "loanReference", label: "Loan Agreement Reference (if Loan)", placeholder: "Loan agreement number or reference" },
        { key: "loanDate", label: "Loan Date (if Loan)", type: "date", placeholder: "Date loan was provided" },
        { key: "originalLoanAmount", label: "Original Loan Amount (if Loan)", placeholder: "AED amount originally loaned" },
        { key: "repaymentTerms", label: "Repayment Terms (if Loan)", placeholder: "e.g., 12 monthly installments of AED 5,000, Lump sum due 31/12/2024" },
        { key: "overdueDetails", label: "Overdue Installments (if Loan)", placeholder: "Which installments are overdue? e.g., 'January, February, March 2025'" },

        // For Rental Arrears
        { key: "leaseReference", label: "Lease Agreement Reference (if Rental)", placeholder: "Lease agreement number or reference" },
        { key: "propertyAddress", label: "Property Address (if Rental)", placeholder: "Full address of rental property", multiline: true },
        { key: "rentalPeriod", label: "Rental Period in Arrears (if Rental)", placeholder: "e.g., January 2025 to March 2025" },
        { key: "rentAmount", label: "Monthly/Annual Rent (if Rental)", placeholder: "AED per month or per year" },

        // For Other
        { key: "otherDebtBasis", label: "Basis of Claim (if Other)", placeholder: "Explain the legal basis for this demand", multiline: true },

        // SUPPORTING DOCUMENTS
        { key: "supportingDocs", label: "Supporting Documents Referenced", placeholder: "List documents you are attaching or referencing: e.g., 'Invoice No. 12345 dated 15/01/2025', 'Service Agreement dated 01/03/2024', 'Email correspondence dated 20/02/2025'", multiline: true, required: true },

        // PAYMENT DEADLINE
        { key: "paymentDeadline", label: "Payment Deadline (Exact Date)", type: "date", placeholder: "Select realistic deadline (typically 7-30 days from now)", required: true },
        { key: "deadlineCalendarDays", label: "Or Specify Calendar Days from Receipt", placeholder: "e.g., 14 (standard), 7 (urgent rental), 21 (disputed amounts)" },

        // PARTIAL PAYMENT OPTION
        { key: "partialPaymentAccepted", label: "Accept Partial Payment or Payment Plan?", type: "select", options: [
          "No - Full payment required by deadline",
          "Yes - Open to discussing payment plan if contacted within X days"
        ], required: true },

        // PAYMENT METHODS & DETAILS
        { key: "bankTransferAllowed", label: "Payment Method: Bank Transfer", type: "select", options: ["Yes - Provide bank details", "No - Not accepted"], required: true },
        { key: "bankName", label: "Bank Name (if Bank Transfer)", placeholder: "e.g., Emirates NBD, Abu Dhabi Commercial Bank" },
        { key: "accountName", label: "Account Name (if Bank Transfer)", placeholder: "Name on bank account" },
        { key: "accountNumber", label: "Account Number (if Bank Transfer)", placeholder: "Account number" },
        { key: "iban", label: "IBAN (if Bank Transfer)", placeholder: "AE00 0000 0000 0000 0000 000" },
        { key: "swiftCode", label: "SWIFT/BIC Code (if Bank Transfer - International)", placeholder: "e.g., EBILAEAD" },
        { key: "bankBranch", label: "Bank Branch (if Bank Transfer)", placeholder: "e.g., Dubai Main Branch" },

        { key: "chequeAllowed", label: "Payment Method: Cheque", type: "select", options: ["Yes - Provide cheque details", "No - Not accepted"], required: true },
        { key: "chequePayeeName", label: "Cheque Payable To (if Cheque)", placeholder: "Name to write on cheque" },
        { key: "chequeDeliveryAddress", label: "Cheque Delivery Address (if Cheque)", placeholder: "Where to deliver cheque", multiline: true },

        { key: "cashAllowed", label: "Payment Method: Cash (max AED 55,000 per UAE law)", type: "select", options: ["Yes - Provide cash payment location", "No - Not accepted"], required: true },
        { key: "cashPaymentAddress", label: "Cash Payment Address (if Cash)", placeholder: "Office address for cash payment", multiline: true },
        { key: "businessHours", label: "Business Hours (if Cash)", placeholder: "e.g., Sunday to Thursday, 9:00 AM - 5:00 PM" },
        { key: "contactPerson", label: "Contact Person (if Cash)", placeholder: "Name of person to meet for cash payment" },
        { key: "contactPhone", label: "Contact Phone (if Cash)", placeholder: "+971 XX XXX XXXX" },

        { key: "onlinePaymentAllowed", label: "Payment Method: Online Payment Portal", type: "select", options: ["Yes - Provide payment portal details", "No - Not accepted"], required: true },
        { key: "paymentPortalURL", label: "Payment Portal URL (if Online)", placeholder: "https://payments.example.com" },
        { key: "referenceCode", label: "Reference Code for Online Payment (if Online)", placeholder: "Code to enter during payment" },

        // SENDER CONTACT FOR PAYMENT CONFIRMATION
        { key: "senderEmail", label: "Sender Email (for payment confirmation)", placeholder: "email@example.com", required: true },
        { key: "senderPhone", label: "Sender Phone (for queries)", placeholder: "+971 XX XXX XXXX", required: true },

        // CONSEQUENCES
        { key: "consequences", label: "Specific Consequences of Non-Compliance", placeholder: "What will happen if not paid? e.g., 'Civil lawsuit in Dubai Courts', 'Late payment interest at 5% per month', 'Reporting to Al Etihad Credit Bureau', 'Contract termination', 'Travel ban application'", multiline: true, required: true },
        { key: "interestRate", label: "Late Payment Interest Rate (if applicable)", placeholder: "e.g., 5 (for 5% per month or as per contract)" },
        { key: "estimatedLegalCosts", label: "Estimated Legal Costs (if applicable)", placeholder: "AED amount for legal fees if case proceeds to court" },

        // APPLICABLE LAW & JURISDICTION
        { key: "applicableLaw", label: "Applicable UAE Law", type: "select", options: [
          "Commercial Transactions Law (Federal Law No. 18 of 1993) - For business debts",
          "Civil Transactions Law (Federal Law No. 5 of 1985) - For general debts and contracts",
          "Tenancy Law (Federal Law No. 26 of 2007) - For rental arrears",
          "Consumer Protection Law (Federal Law No. 15 of 2020) - For consumer-related debts",
          "As per contract/agreement - Refer to specific contract provisions",
          "Multiple laws apply - Specify in additional details"
        ], required: true },
        { key: "emirate", label: "Emirate (for Jurisdiction)", placeholder: "e.g., Dubai, Abu Dhabi, Sharjah (where legal action will be filed)", required: true },

        // CREDIT REPORTING
        { key: "creditReportingThreat", label: "Include Credit Bureau Reporting Threat?", type: "select", options: [
          "Yes - Warn of AECB (Al Etihad Credit Bureau) reporting",
          "No - Do not mention credit reporting"
        ], required: true },

        // URGENCY
        { key: "urgency", label: "Urgency Level", type: "select", options: ["Standard (14-21 days)", "Urgent (7 days)", "Extremely Urgent (3-5 days) - Rental/critical"], required: true },

        // ADDITIONAL CONTEXT
        { key: "previousAttempts", label: "Previous Attempts to Collect", placeholder: "List any previous reminders, calls, emails, or meetings to resolve this matter. E.g., 'Reminder email sent 15/02/2025, Phone call 20/02/2025, No response received'", multiline: true, required: true },
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
      settlement_agreement: [
        // AGREEMENT REFERENCE & CONTEXT
        { key: "agreementReference", label: "Agreement Reference Number (Optional)", placeholder: "e.g., SA-2025-001" },
        { key: "agreementDate", label: "Agreement Date", type: "date", placeholder: "Date of agreement execution", required: true },
        { key: "agreementLocation", label: "Agreement Location (Emirate)", placeholder: "e.g., Dubai, Abu Dhabi", required: true },

        // PARTY A INFORMATION
        { key: "partyAName", label: "Party A - Full Legal Name", placeholder: "Full name as appears on Emirates ID", required: true },
        { key: "partyAEmiratesId", label: "Party A - Emirates ID / Passport", placeholder: "784-XXXX-XXXXXXX-X", required: true },
        { key: "partyAAddress", label: "Party A - Address", placeholder: "Full address", multiline: true, required: true },
        { key: "partyAEmail", label: "Party A - Email", placeholder: "email@example.com", required: true },
        { key: "partyAPhone", label: "Party A - Phone", placeholder: "+971 XX XXX XXXX", required: true },
        { key: "partyALegalRep", label: "Party A - Legal Representative (if applicable)", placeholder: "Full name of authorized representative" },
        { key: "partyALegalRepId", label: "Party A - Legal Rep Emirates ID (if applicable)", placeholder: "784-XXXX-XXXXXXX-X" },

        // PARTY B INFORMATION
        { key: "partyBName", label: "Party B - Full Legal Name", placeholder: "Full name as appears on Emirates ID", required: true },
        { key: "partyBEmiratesId", label: "Party B - Emirates ID / Passport", placeholder: "784-XXXX-XXXXXXX-X", required: true },
        { key: "partyBAddress", label: "Party B - Address", placeholder: "Full address", multiline: true, required: true },
        { key: "partyBEmail", label: "Party B - Email", placeholder: "email@example.com", required: true },
        { key: "partyBPhone", label: "Party B - Phone", placeholder: "+971 XX XXX XXXX", required: true },
        { key: "partyBLegalRep", label: "Party B - Legal Representative (if applicable)", placeholder: "Full name of authorized representative" },
        { key: "partyBLegalRepId", label: "Party B - Legal Rep Emirates ID (if applicable)", placeholder: "784-XXXX-XXXXXXX-X" },

        // DISPUTE DESCRIPTION
        { key: "natureOfDispute", label: "Nature of Dispute", type: "select", options: [
          "Contract Dispute",
          "Employment Dispute",
          "Commercial Dispute",
          "Property Dispute",
          "Personal Injury",
          "Partnership Dissolution",
          "Intellectual Property",
          "Other"
        ], required: true },
        { key: "disputeDescription", label: "Detailed Dispute Description (Be precise and unambiguous)", placeholder: "Describe the dispute in detail. Include: What happened, when, where, who was involved, and what obligations were not fulfilled.", multiline: true, required: true },
        { key: "disputeOriginDate", label: "Dispute Origin Date", type: "date", placeholder: "When did this dispute begin?", required: true },
        { key: "disputeReference", label: "Dispute Reference (case number, contract reference, etc.)", placeholder: "e.g., Court Case No. 123/2024, Contract Ref ABC-2023" },
        { key: "previousAttempts", label: "Previous Attempts to Resolve", placeholder: "Describe any previous attempts: negotiations, mediation, emails, meetings, etc.", multiline: true, required: true },

        // SETTLEMENT TERMS & CONDITIONS
        { key: "settlementObjective", label: "Settlement Objective", placeholder: "What is being settled? (e.g., Full settlement of contract dispute, resolution of employment claims)", required: true },
        { key: "settlementTerms", label: "Key Settlement Terms (Main obligations of each party)", placeholder: "List the key settlement terms and obligations for each party", multiline: true, required: true },
        { key: "conditionsPrecedent", label: "Conditions Precedent (if any)", placeholder: "Any conditions that must be satisfied before settlement is effective? (e.g., Board approval, regulatory approval)", multiline: true },
        { key: "performanceTimeline", label: "Performance Timeline", placeholder: "e.g., Within 30 days of execution, By 31 December 2025" },
        { key: "nonMonetaryObligations", label: "Non-Monetary Obligations (if any)", placeholder: "Any non-payment obligations? (e.g., Return of property, deletion of data, public statement)", multiline: true },
        { key: "deliveryRequirements", label: "Delivery Requirements (if any)", placeholder: "How should obligations be delivered? (e.g., Certified mail, hand delivery, email confirmation)" },

        // PAYMENT TERMS (IF APPLICABLE)
        { key: "paymentInvolved", label: "Is Payment Involved?", type: "select", options: ["Yes", "No"], required: true },
        { key: "settlementAmount", label: "Total Settlement Amount (AED) - if payment involved", placeholder: "e.g., 50000.00" },
        { key: "settlementAmountWords", label: "Amount in Words (if payment involved)", placeholder: "e.g., Fifty Thousand UAE Dirhams" },
        { key: "currency", label: "Currency (if payment involved)", placeholder: "Default: AED (United Arab Emirates Dirhams)" },
        { key: "paymentStructure", label: "Payment Structure (if payment involved)", type: "select", options: [
          "Lump Sum - Single payment",
          "Installments - Multiple payments",
          "Combination - Part lump sum, part installments"
        ] },
        { key: "paymentMethod", label: "Payment Method (if payment involved)", type: "select", options: [
          "Bank Transfer",
          "Cheque",
          "Cash (max AED 55,000 per UAE law)",
          "Other"
        ] },
        { key: "bankName", label: "Bank Name (if Bank Transfer)", placeholder: "e.g., Emirates NBD" },
        { key: "accountName", label: "Account Name (if Bank Transfer)", placeholder: "Name on account" },
        { key: "accountNumber", label: "Account Number (if Bank Transfer)", placeholder: "Account number" },
        { key: "iban", label: "IBAN (if Bank Transfer)", placeholder: "AE00 0000 0000 0000 0000 000" },
        { key: "paymentSchedule", label: "Payment Deadline / Schedule (if payment involved)", placeholder: "e.g., Within 30 days of execution, Installments: AED 10,000 on 1st of each month for 5 months", multiline: true },
        { key: "latePaymentConsequences", label: "Late Payment Consequences (if payment involved)", placeholder: "What happens if payment is late? (e.g., Interest at 5% per month, revival of original claims)", multiline: true },
        { key: "receiptRequirements", label: "Receipt Requirements (if payment involved)", placeholder: "How should payment receipt be confirmed?" },

        // MUTUAL RELEASE
        { key: "partyAReleasesB", label: "Does Party A Release Party B?", type: "select", options: ["Yes", "No"], required: true },
        { key: "partyAReleaseScope", label: "Party A Release Scope (if Yes)", placeholder: "What claims does Party A release? (e.g., All claims arising from contract dated 01/01/2024, all employment-related claims)", multiline: true },
        { key: "partyBReleasesA", label: "Does Party B Release Party A?", type: "select", options: ["Yes", "No"], required: true },
        { key: "partyBReleaseScope", label: "Party B Release Scope (if Yes)", placeholder: "What claims does Party B release?", multiline: true },
        { key: "releaseEffectiveDate", label: "Effective Date of Release", type: "date", placeholder: "When does the release become effective?", required: true },

        // LIABILITY & ADMISSIONS
        { key: "noAdmissionOfLiability", label: "Include No Admission of Liability Clause?", type: "select", options: [
          "Yes - Strongly recommended (settlement does not admit fault)",
          "No - Omit this clause"
        ], required: true },
        { key: "additionalLiabilityQualifications", label: "Additional Liability Qualifications (if any)", placeholder: "Any additional qualifications regarding liability?", multiline: true },

        // CONFIDENTIALITY
        { key: "isConfidential", label: "Is Settlement Confidential?", type: "select", options: ["Yes", "No"], required: true },
        { key: "confidentialityScope", label: "Confidentiality Scope (if confidential)", placeholder: "What must remain confidential? (e.g., All settlement terms, payment amount, existence of dispute)", multiline: true },
        { key: "whoCanAccess", label: "Who Can Access Settlement Terms? (if confidential)", type: "multiselect", options: [
          "Legal Advisors",
          "Financial Advisors",
          "Courts (if legally required)",
          "Auditors",
          "No One Else"
        ] },
        { key: "confidentialityExceptions", label: "Confidentiality Exceptions (if confidential)", placeholder: "When can terms be disclosed? (e.g., Legal obligations, court orders, tax authorities)", multiline: true },
        { key: "breachOfConfidentialityConsequences", label: "Breach of Confidentiality Consequences (if confidential)", placeholder: "What happens if confidentiality is breached?", multiline: true },

        // NON-DISPARAGEMENT
        { key: "includeNonDisparagement", label: "Include Non-Disparagement Clause?", type: "select", options: ["Yes", "No"], required: true },
        { key: "nonDisparagementDetails", label: "Non-Disparagement Details (if Yes)", placeholder: "Specify details of non-disparagement obligations", multiline: true },

        // GOVERNING LAW & DISPUTE RESOLUTION
        { key: "jurisdictionEmirate", label: "Jurisdiction Emirate", placeholder: "e.g., Dubai, Abu Dhabi, Sharjah", required: true },
        { key: "disputeResolutionMethod", label: "Dispute Resolution for Breach of Settlement", type: "select", options: [
          "Courts - Litigation in UAE courts",
          "Arbitration - Arbitration proceedings",
          "Mediation then Courts - Attempt mediation first"
        ], required: true },
        { key: "arbitrationDetails", label: "Arbitration Details (if Arbitration selected)", placeholder: "e.g., Dubai International Arbitration Centre (DIAC), Arbitration in accordance with DIAC Rules", multiline: true },
        { key: "language", label: "Agreement Language", placeholder: "e.g., English, Arabic, English and Arabic" },

        // DATA PROTECTION & PDPL
        { key: "retentionPeriod", label: "Data Retention Period", type: "select", options: [
          "3 years after completion",
          "5 years after completion",
          "7 years after completion",
          "10 years after completion",
          "As required by UAE law"
        ], required: true },
        { key: "specialDataHandling", label: "Special Data Handling Requirements (if any)", placeholder: "Any special requirements for handling personal data in this settlement?", multiline: true },
        { key: "crossBorderTransfer", label: "Cross-Border Data Transfer Required?", type: "select", options: ["Yes", "No"] },

        // GENERAL PROVISIONS
        { key: "entireAgreementClause", label: "Include Entire Agreement Clause?", type: "select", options: [
          "Yes - Recommended (this agreement supersedes all prior agreements)",
          "No"
        ], required: true },
        { key: "severabilityClause", label: "Include Severability Clause?", type: "select", options: [
          "Yes - Recommended (invalid provisions don't affect rest of agreement)",
          "No"
        ], required: true },
        { key: "amendmentRequirements", label: "Amendment Requirements", type: "select", options: [
          "Written and signed by all parties",
          "Other - Specify in additional terms"
        ], required: true },
        { key: "costsAllocation", label: "Costs & Fees Allocation", type: "select", options: [
          "Each party bears own costs",
          "Party A pays all costs",
          "Party B pays all costs",
          "Split equally between parties",
          "Loser pays if breach occurs"
        ], required: true },

        // NOTARIZATION & WITNESSES
        { key: "requiresNotarization", label: "Requires Notarization?", type: "select", options: ["Yes", "No"], required: true },
        { key: "notaryLocation", label: "Notary Location (if Yes)", placeholder: "e.g., Dubai Courts, Notary Public Office" },
        { key: "witnessesRequired", label: "Number of Witnesses Required", type: "select", options: ["0", "1", "2", "3 or more"], required: true },
        { key: "witness1Name", label: "Witness 1 - Full Name (if required)", placeholder: "Full name" },
        { key: "witness1EmiratesId", label: "Witness 1 - Emirates ID (if required)", placeholder: "784-XXXX-XXXXXXX-X" },
        { key: "witness2Name", label: "Witness 2 - Full Name (if required)", placeholder: "Full name" },
        { key: "witness2EmiratesId", label: "Witness 2 - Emirates ID (if required)", placeholder: "784-XXXX-XXXXXXX-X" },

        // ADDITIONAL CLAUSES
        { key: "specialConditions", label: "Special Conditions or Additional Terms (if any)", placeholder: "Any special conditions, additional terms, or unique provisions for this settlement?", multiline: true },
        { key: "attachmentsSchedules", label: "Attachments / Schedules (if any)", placeholder: "List any documents attached to this settlement (e.g., Payment schedule, property list, original contract)", multiline: true },
      ],
      power_of_attorney: [
        // PRINCIPAL (Grantor) Information
        { key: "principalFullName", label: "Principal's Full Legal Name", placeholder: "Full name as appears on Emirates ID", required: true },
        { key: "principalEmiratesId", label: "Principal's Emirates ID / Passport Number", placeholder: "784-XXXX-XXXXXXX-X or Passport", required: true },
        { key: "principalAddress", label: "Principal's Residential Address", placeholder: "Full address in UAE", multiline: true, required: true },
        { key: "principalPhone", label: "Principal's Contact Phone", placeholder: "+971 XX XXX XXXX", required: true },
        { key: "principalEmail", label: "Principal's Email Address", placeholder: "email@example.com", required: true },

        // ATTORNEY-IN-FACT (Agent) Information
        { key: "attorneyFullName", label: "Attorney-in-Fact's Full Legal Name", placeholder: "Full name as appears on Emirates ID", required: true },
        { key: "attorneyEmiratesId", label: "Attorney-in-Fact's Emirates ID / Passport", placeholder: "784-XXXX-XXXXXXX-X or Passport", required: true },
        { key: "attorneyAddress", label: "Attorney-in-Fact's Address", placeholder: "Full address", multiline: true, required: true },
        { key: "attorneyPhone", label: "Attorney-in-Fact's Contact Phone", placeholder: "+971 XX XXX XXXX", required: true },
        { key: "attorneyEmail", label: "Attorney-in-Fact's Email", placeholder: "email@example.com", required: true },
        { key: "attorneyRelationship", label: "Relationship to Principal", placeholder: "e.g., Spouse, Business Partner, Family Member, Legal Representative", required: true },

        // SCOPE OF POWERS (Checkboxes via select fields)
        { key: "financialPowers", label: "Grant Financial Powers?", type: "select", options: ["Yes - Grant financial powers (banking, investments, payments)", "No - Do not grant financial powers"], required: true },
        { key: "propertyPowers", label: "Grant Property Powers?", type: "select", options: ["Yes - Grant property powers (buy, sell, lease, mortgage)", "No - Do not grant property powers"], required: true },
        { key: "legalPowers", label: "Grant Legal Powers?", type: "select", options: ["Yes - Grant legal powers (sign contracts, legal proceedings)", "No - Do not grant legal powers"], required: true },
        { key: "businessPowers", label: "Grant Business Powers?", type: "select", options: ["Yes - Grant business powers (operate business, sign business contracts)", "No - Do not grant business powers"], required: true },
        { key: "healthcarePowers", label: "Grant Healthcare Powers?", type: "select", options: ["Yes - Grant healthcare powers (medical decisions, access records)*", "No - Do not grant healthcare powers", "*Note: Healthcare powers may be limited by UAE law"], required: true },
        { key: "govPowers", label: "Grant Government/Administrative Powers?", type: "select", options: ["Yes - Grant gov powers (interact with ministries, obtain licenses)", "No - Do not grant government powers"], required: true },

        // Additional Specific Powers or Limitations
        { key: "additionalPowers", label: "Additional Specific Powers (Optional)", placeholder: "List any additional specific powers not covered above, e.g., 'Manage cryptocurrency accounts', 'Sign immigration documents'", multiline: true },
        { key: "explicitLimitations", label: "Explicit Limitations/Restrictions (Optional)", placeholder: "List any specific restrictions, e.g., 'Cannot sell the family home', 'Cannot make gifts exceeding AED 10,000'", multiline: true },

        // SUB-DELEGATION
        { key: "subDelegation", label: "Sub-Delegation Authority", type: "select", options: [
          "Not allowed - Attorney must act personally",
          "Allowed with restrictions - Requires Principal's written consent",
          "Allowed without restrictions - Attorney may sub-delegate at discretion"
        ], required: true },

        // EFFECTIVE DATE & DURATION
        { key: "effectiveDate", label: "Effective Date (When PoA Becomes Active)", type: "date", placeholder: "Select start date", required: true },
        { key: "durationType", label: "Duration Type", type: "select", options: [
          "Permanent - Remains valid until revoked",
          "Fixed term - Expires on specific date",
          "Event-based - Terminates upon specific event"
        ], required: true },
        { key: "expiryDate", label: "Expiry Date (if Fixed Term)", type: "date", placeholder: "Leave blank if permanent or event-based" },
        { key: "terminationEvent", label: "Termination Event (if Event-Based)", placeholder: "e.g., 'Upon my return to UAE', 'Upon completion of property sale'", multiline: true },

        // REVOCATION PROVISIONS
        { key: "revocationNotice", label: "Revocation Notice Method", placeholder: "How will revocation be communicated? e.g., 'Registered mail', 'Email + notarized letter', 'In-person delivery'", required: true },

        // COMPENSATION
        { key: "compensation", label: "Attorney-in-Fact Compensation", type: "select", options: [
          "No compensation - Serving without payment",
          "Reasonable expenses reimbursed only",
          "Fixed compensation - Specify amount",
          "Hourly rate - Specify rate"
        ], required: true },
        { key: "compensationAmount", label: "Compensation Amount/Rate (if applicable)", placeholder: "e.g., 'AED 5,000 per month' or 'AED 200 per hour'" },

        // RECORD-KEEPING
        { key: "accountingFrequency", label: "Accounting/Reporting Frequency", type: "select", options: [
          "Upon request only",
          "Monthly accounting",
          "Quarterly accounting",
          "Annual accounting",
          "No formal accounting required"
        ], required: true },

        // JURISDICTION
        { key: "emirate", label: "Emirate (for Jurisdiction & Notarization)", placeholder: "e.g., Dubai, Abu Dhabi, Sharjah", required: true },

        // WITNESS INFORMATION (2 witnesses required)
        { key: "witness1Name", label: "Witness 1 - Full Legal Name", placeholder: "Full name", required: true },
        { key: "witness1EmiratesId", label: "Witness 1 - Emirates ID / Passport", placeholder: "784-XXXX-XXXXXXX-X", required: true },
        { key: "witness1Phone", label: "Witness 1 - Contact Phone", placeholder: "+971 XX XXX XXXX", required: true },
        { key: "witness1Address", label: "Witness 1 - Address", placeholder: "Full address", multiline: true, required: true },

        { key: "witness2Name", label: "Witness 2 - Full Legal Name", placeholder: "Full name", required: true },
        { key: "witness2EmiratesId", label: "Witness 2 - Emirates ID / Passport", placeholder: "784-XXXX-XXXXXXX-X", required: true },
        { key: "witness2Phone", label: "Witness 2 - Contact Phone", placeholder: "+971 XX XXX XXXX", required: true },
        { key: "witness2Address", label: "Witness 2 - Address", placeholder: "Full address", multiline: true, required: true },

        // ADDITIONAL CONTEXT
        { key: "purposeContext", label: "Purpose/Context of Power of Attorney", placeholder: "Why is this PoA being created? e.g., 'Traveling abroad for 6 months', 'Managing business during absence', 'Healthcare planning'", multiline: true, required: true },
        { key: "urgency", label: "Urgency Level", type: "select", options: ["Standard", "Urgent - Time-sensitive", "Extremely Urgent - Immediate notarization needed"], required: true },
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

      // Additional validation for power_of_attorney fields
      if (letterType === 'power_of_attorney') {
        // Validate emirate (required for jurisdiction and notarization)
        if (!details.emirate || !details.emirate.trim()) {
          toast({
            title: "Emirate required",
            description: "Please specify the emirate for jurisdiction and notarization",
            variant: "destructive"
          })
          return false
        }

        // Validate Emirates ID format for Principal
        const principalId = details.principalEmiratesId
        if (principalId && !/^(784-\d{4}-\d{7}-\d|[A-Z0-9]{6,12})$/.test(principalId.replace(/\s/g, ''))) {
          toast({
            title: "Invalid Emirates ID format",
            description: "Principal's Emirates ID should be in format: 784-XXXX-XXXXXXX-X or valid passport number",
            variant: "destructive"
          })
          return false
        }

        // Validate Emirates ID format for Attorney-in-Fact
        const attorneyId = details.attorneyEmiratesId
        if (attorneyId && !/^(784-\d{4}-\d{7}-\d|[A-Z0-9]{6,12})$/.test(attorneyId.replace(/\s/g, ''))) {
          toast({
            title: "Invalid Emirates ID format",
            description: "Attorney-in-Fact's Emirates ID should be in format: 784-XXXX-XXXXXXX-X or valid passport number",
            variant: "destructive"
          })
          return false
        }

        // Validate UAE phone format for Principal
        const principalPhone = details.principalPhone
        if (principalPhone && !/^\+971\s?\d{1,2}\s?\d{3}\s?\d{4}$/.test(principalPhone)) {
          toast({
            title: "Invalid phone format",
            description: "Principal's phone should be in UAE format: +971 XX XXX XXXX",
            variant: "destructive"
          })
          return false
        }

        // Validate UAE phone format for Attorney
        const attorneyPhone = details.attorneyPhone
        if (attorneyPhone && !/^\+971\s?\d{1,2}\s?\d{3}\s?\d{4}$/.test(attorneyPhone)) {
          toast({
            title: "Invalid phone format",
            description: "Attorney-in-Fact's phone should be in UAE format: +971 XX XXX XXXX",
            variant: "destructive"
          })
          return false
        }

        // Validate email formats
        const principalEmail = details.principalEmail
        if (principalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(principalEmail)) {
          toast({
            title: "Invalid email format",
            description: "Please enter a valid email address for Principal",
            variant: "destructive"
          })
          return false
        }

        const attorneyEmail = details.attorneyEmail
        if (attorneyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attorneyEmail)) {
          toast({
            title: "Invalid email format",
            description: "Please enter a valid email address for Attorney-in-Fact",
            variant: "destructive"
          })
          return false
        }

        // Validate expiry date if duration type is "Fixed term"
        if (details.durationType && details.durationType.includes("Fixed term")) {
          if (!details.expiryDate || !details.expiryDate.trim()) {
            toast({
              title: "Expiry date required",
              description: "Please specify an expiry date for fixed-term Power of Attorney",
              variant: "destructive"
            })
            return false
          }

          // Ensure expiry date is after effective date
          const effectiveDate = parseISO(details.effectiveDate)
          const expiryDate = parseISO(details.expiryDate)
          if (isValid(effectiveDate) && isValid(expiryDate) && !isAfter(expiryDate, effectiveDate)) {
            toast({
              title: "Invalid expiry date",
              description: "Expiry date must be after the effective date",
              variant: "destructive"
            })
            return false
          }
        }

        // Validate termination event if duration type is "Event-based"
        if (details.durationType && details.durationType.includes("Event-based")) {
          if (!details.terminationEvent || !details.terminationEvent.trim()) {
            toast({
              title: "Termination event required",
              description: "Please specify the termination event for event-based Power of Attorney",
              variant: "destructive"
            })
            return false
          }
        }

        // Validate compensation amount if compensation type requires it
        if (details.compensation && (details.compensation.includes("Fixed compensation") || details.compensation.includes("Hourly rate"))) {
          if (!details.compensationAmount || !details.compensationAmount.trim()) {
            toast({
              title: "Compensation amount required",
              description: "Please specify the compensation amount or rate",
              variant: "destructive"
            })
            return false
          }
        }

        // Ensure at least one power is granted
        const powersGranted = [
          details.financialPowers?.includes("Yes"),
          details.propertyPowers?.includes("Yes"),
          details.legalPowers?.includes("Yes"),
          details.businessPowers?.includes("Yes"),
          details.healthcarePowers?.includes("Yes"),
          details.govPowers?.includes("Yes")
        ].some(Boolean)

        if (!powersGranted) {
          toast({
            title: "No powers granted",
            description: "You must grant at least one type of power to the Attorney-in-Fact",
            variant: "destructive"
          })
          return false
        }
      }

      // Additional validation for demand_letter fields
      if (letterType === 'demand_letter') {
        // Validate emirate (required for jurisdiction)
        if (!details.emirate || !details.emirate.trim()) {
          toast({
            title: "Emirate required",
            description: "Please specify the emirate for jurisdictional purposes (where legal action will be filed)",
            variant: "destructive"
          })
          return false
        }

        // Validate amount format (must be positive number)
        const amount = details.amount
        if (!amount || !amount.trim()) {
          toast({
            title: "Amount required",
            description: "Please specify the amount demanded in AED",
            variant: "destructive"
          })
          return false
        }

        const amountValue = parseFloat(amount.replace(/[^0-9.]/g, ''))
        if (isNaN(amountValue) || amountValue <= 0) {
          toast({
            title: "Invalid amount",
            description: "Please enter a valid positive amount in AED (numbers only, e.g., 50000.00)",
            variant: "destructive"
          })
          return false
        }

        // Validate payment deadline (must be in the future and realistic)
        if (!details.paymentDeadline || !details.paymentDeadline.trim()) {
          if (!details.deadlineCalendarDays || !details.deadlineCalendarDays.trim()) {
            toast({
              title: "Payment deadline required",
              description: "Please specify either a deadline date or number of calendar days",
              variant: "destructive"
            })
            return false
          }
        }

        // If calendar days specified, validate range (3-90 days is realistic)
        if (details.deadlineCalendarDays && details.deadlineCalendarDays.trim()) {
          const days = parseInt(details.deadlineCalendarDays)
          if (isNaN(days) || days < 3 || days > 90) {
            toast({
              title: "Invalid calendar days",
              description: "Please enter a realistic number of days between 3 and 90 (typically 7-30 days)",
              variant: "destructive"
            })
            return false
          }
        }

        // Ensure at least one payment method is allowed
        const paymentMethodsAllowed = [
          details.bankTransferAllowed?.includes("Yes"),
          details.chequeAllowed?.includes("Yes"),
          details.cashAllowed?.includes("Yes"),
          details.onlinePaymentAllowed?.includes("Yes")
        ].some(Boolean)

        if (!paymentMethodsAllowed) {
          toast({
            title: "No payment method specified",
            description: "You must allow at least one payment method (bank transfer, cheque, cash, or online)",
            variant: "destructive"
          })
          return false
        }

        // If bank transfer is allowed, validate that essential bank details are provided
        if (details.bankTransferAllowed?.includes("Yes")) {
          if (!details.bankName || !details.accountName || !details.accountNumber) {
            toast({
              title: "Bank details incomplete",
              description: "If bank transfer is allowed, you must provide: Bank Name, Account Name, and Account Number at minimum",
              variant: "destructive"
            })
            return false
          }
        }

        // If cheque is allowed, validate cheque details
        if (details.chequeAllowed?.includes("Yes")) {
          if (!details.chequePayeeName || !details.chequeDeliveryAddress) {
            toast({
              title: "Cheque details incomplete",
              description: "If cheque payment is allowed, you must provide: Payee Name and Delivery Address",
              variant: "destructive"
            })
            return false
          }
        }

        // If cash is allowed, validate cash payment location
        if (details.cashAllowed?.includes("Yes")) {
          if (!details.cashPaymentAddress || !details.businessHours) {
            toast({
              title: "Cash payment details incomplete",
              description: "If cash payment is allowed, you must provide: Payment Address and Business Hours",
              variant: "destructive"
            })
            return false
          }
        }

        // If online payment is allowed, validate portal URL
        if (details.onlinePaymentAllowed?.includes("Yes")) {
          if (!details.paymentPortalURL) {
            toast({
              title: "Online payment details incomplete",
              description: "If online payment is allowed, you must provide: Payment Portal URL",
              variant: "destructive"
            })
            return false
          }
        }

        // Validate email format for sender
        const senderEmail = details.senderEmail
        if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
          toast({
            title: "Invalid sender email",
            description: "Please enter a valid email address for payment confirmation",
            variant: "destructive"
          })
          return false
        }

        // Validate UAE phone format for sender
        const senderPhone = details.senderPhone
        if (senderPhone && !/^\+971\s?\d{1,2}\s?\d{3}\s?\d{4}$/.test(senderPhone)) {
          toast({
            title: "Invalid phone format",
            description: "Sender phone should be in UAE format: +971 XX XXX XXXX",
            variant: "destructive"
          })
          return false
        }

        // Validate interest rate if provided (must be reasonable percentage)
        if (details.interestRate && details.interestRate.trim()) {
          const rate = parseFloat(details.interestRate)
          if (isNaN(rate) || rate < 0 || rate > 50) {
            toast({
              title: "Invalid interest rate",
              description: "Please enter a reasonable interest rate percentage (0-50%)",
              variant: "destructive"
            })
            return false
          }
        }

        // Validate legal costs if provided
        if (details.estimatedLegalCosts && details.estimatedLegalCosts.trim()) {
          const legalCosts = parseFloat(details.estimatedLegalCosts.replace(/[^0-9.]/g, ''))
          if (isNaN(legalCosts) || legalCosts < 0) {
            toast({
              title: "Invalid legal costs",
              description: "Please enter a valid amount for estimated legal costs (numbers only)",
              variant: "destructive"
            })
            return false
          }
        }
      }

      // Settlement Agreement specific validation
      if (letterType === 'settlement_agreement') {
        // Validate Emirates ID formats
        const emiratesIdRegex = /^784-\d{4}-\d{7}-\d$/
        if (details.partyAEmiratesId && !emiratesIdRegex.test(details.partyAEmiratesId)) {
          toast({
            title: "Invalid Emirates ID format",
            description: "Party A Emirates ID should be in format: 784-XXXX-XXXXXXX-X",
            variant: "destructive"
          })
          return false
        }
        if (details.partyBEmiratesId && !emiratesIdRegex.test(details.partyBEmiratesId)) {
          toast({
            title: "Invalid Emirates ID format",
            description: "Party B Emirates ID should be in format: 784-XXXX-XXXXXXX-X",
            variant: "destructive"
          })
          return false
        }

        // Validate mutual release (at least one party must release)
        if (details.partyAReleasesB === "No" && details.partyBReleasesA === "No") {
          toast({
            title: "Mutual release required",
            description: "At least one party must release the other in a settlement agreement",
            variant: "destructive"
          })
          return false
        }

        // If payment involved, validate payment fields
        if (details.paymentInvolved === "Yes") {
          if (!details.settlementAmount || !details.settlementAmountWords) {
            toast({
              title: "Payment details incomplete",
              description: "Settlement amount and amount in words are required when payment is involved",
              variant: "destructive"
            })
            return false
          }
        }

        // If confidential, validate confidentiality fields
        if (details.isConfidential === "Yes") {
          if (!details.confidentialityScope || !details.confidentialityExceptions) {
            toast({
              title: "Confidentiality details incomplete",
              description: "Confidentiality scope and exceptions are required when settlement is confidential",
              variant: "destructive"
            })
            return false
          }
        }

        // If witnesses required, validate witness info
        if (details.witnessesRequired && parseInt(details.witnessesRequired) > 0) {
          if (!details.witness1Name || !details.witness1EmiratesId) {
            toast({
              title: "Witness information incomplete",
              description: "Witness 1 name and Emirates ID are required",
              variant: "destructive"
            })
            return false
          }
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
              ) : letterType === 'power_of_attorney' ? (
                <div className="space-y-4">
                  {/* Principal Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Principal (Grantor) Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Full Name:</span>
                        <span className="font-medium">{details.principalFullName}</span>
                        <span className="text-muted-foreground">Emirates ID/Passport:</span>
                        <span className="font-medium">{details.principalEmiratesId}</span>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{details.principalPhone}</span>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{details.principalEmail}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Address:</p>
                        <p className="text-sm">{details.principalAddress}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Attorney-in-Fact Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Attorney-in-Fact (Agent) Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Full Name:</span>
                        <span className="font-medium">{details.attorneyFullName}</span>
                        <span className="text-muted-foreground">Emirates ID/Passport:</span>
                        <span className="font-medium">{details.attorneyEmiratesId}</span>
                        <span className="text-muted-foreground">Relationship:</span>
                        <span className="font-medium">{details.attorneyRelationship}</span>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{details.attorneyPhone}</span>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{details.attorneyEmail}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Address:</p>
                        <p className="text-sm">{details.attorneyAddress}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scope of Powers */}
                  <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-blue-900 dark:text-blue-100">Scope of Powers Granted</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {details.financialPowers?.includes("Yes") ? 
                            <Icon name="check-circle" className="w-4 h-4 text-green-600" /> : 
                            <Icon name="x-circle" className="w-4 h-4 text-red-600" />
                          }
                          <span className={details.financialPowers?.includes("Yes") ? "font-semibold text-blue-900 dark:text-blue-100" : "text-muted-foreground"}>
                            Financial Powers (banking, investments, payments)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {details.propertyPowers?.includes("Yes") ? 
                            <Icon name="check-circle" className="w-4 h-4 text-green-600" /> : 
                            <Icon name="x-circle" className="w-4 h-4 text-red-600" />
                          }
                          <span className={details.propertyPowers?.includes("Yes") ? "font-semibold text-blue-900 dark:text-blue-100" : "text-muted-foreground"}>
                            Property Powers (buy, sell, lease, mortgage)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {details.legalPowers?.includes("Yes") ? 
                            <Icon name="check-circle" className="w-4 h-4 text-green-600" /> : 
                            <Icon name="x-circle" className="w-4 h-4 text-red-600" />
                          }
                          <span className={details.legalPowers?.includes("Yes") ? "font-semibold text-blue-900 dark:text-blue-100" : "text-muted-foreground"}>
                            Legal Powers (contracts, legal proceedings)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {details.businessPowers?.includes("Yes") ? 
                            <Icon name="check-circle" className="w-4 h-4 text-green-600" /> : 
                            <Icon name="x-circle" className="w-4 h-4 text-red-600" />
                          }
                          <span className={details.businessPowers?.includes("Yes") ? "font-semibold text-blue-900 dark:text-blue-100" : "text-muted-foreground"}>
                            Business Powers (operate business, sign contracts)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {details.healthcarePowers?.includes("Yes") ? 
                            <Icon name="check-circle" className="w-4 h-4 text-green-600" /> : 
                            <Icon name="x-circle" className="w-4 h-4 text-red-600" />
                          }
                          <span className={details.healthcarePowers?.includes("Yes") ? "font-semibold text-blue-900 dark:text-blue-100" : "text-muted-foreground"}>
                            Healthcare Powers (medical decisions)*
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {details.govPowers?.includes("Yes") ? 
                            <Icon name="check-circle" className="w-4 h-4 text-green-600" /> : 
                            <Icon name="x-circle" className="w-4 h-4 text-red-600" />
                          }
                          <span className={details.govPowers?.includes("Yes") ? "font-semibold text-blue-900 dark:text-blue-100" : "text-muted-foreground"}>
                            Government/Administrative Powers (ministries, licenses)
                          </span>
                        </div>
                      </div>
                      {details.additionalPowers && (
                        <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900 rounded">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Additional Powers:</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{details.additionalPowers}</p>
                        </div>
                      )}
                      {details.explicitLimitations && (
                        <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900 rounded">
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Limitations/Restrictions:</p>
                          <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">{details.explicitLimitations}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Duration & Sub-Delegation */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Duration, Sub-Delegation & Compensation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Effective Date:</p>
                        <p className="text-sm font-semibold">{details.effectiveDate ? format(parseISO(details.effectiveDate), 'dd MMMM yyyy') : 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Duration Type:</p>
                        <Badge variant={details.durationType?.includes("Permanent") ? "default" : "secondary"}>{details.durationType}</Badge>
                      </div>
                      {details.expiryDate && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Expiry Date:</p>
                          <p className="text-sm">{format(parseISO(details.expiryDate), 'dd MMMM yyyy')}</p>
                        </div>
                      )}
                      {details.terminationEvent && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Termination Event:</p>
                          <p className="text-sm whitespace-pre-wrap">{details.terminationEvent}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Sub-Delegation:</p>
                        <p className="text-sm">{details.subDelegation}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Compensation:</p>
                        <p className="text-sm">{details.compensation}</p>
                        {details.compensationAmount && <p className="text-sm font-semibold">{details.compensationAmount}</p>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Accounting Frequency:</p>
                        <p className="text-sm">{details.accountingFrequency}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Witnesses */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Witness Information (Required for Notarization)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded">
                        <p className="font-medium text-sm mb-2">Witness 1:</p>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Name:</span> {details.witness1Name}</p>
                          <p><span className="text-muted-foreground">Emirates ID/Passport:</span> {details.witness1EmiratesId}</p>
                          <p><span className="text-muted-foreground">Phone:</span> {details.witness1Phone}</p>
                          <p><span className="text-muted-foreground">Address:</span> {details.witness1Address}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded">
                        <p className="font-medium text-sm mb-2">Witness 2:</p>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Name:</span> {details.witness2Name}</p>
                          <p><span className="text-muted-foreground">Emirates ID/Passport:</span> {details.witness2EmiratesId}</p>
                          <p><span className="text-muted-foreground">Phone:</span> {details.witness2Phone}</p>
                          <p><span className="text-muted-foreground">Address:</span> {details.witness2Address}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Purpose/Context */}
                  {details.purposeContext && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Purpose & Context</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{details.purposeContext}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Legal Compliance Summary */}
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-900 dark:text-green-100">
                      Legal Compliance & Requirements Included
                    </AlertTitle>
                    <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                      Your Power of Attorney will automatically include:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Governing Law: UAE Federal Law No. 5 of 1985 (Civil Transactions Law)</li>
                        <li>Dispute Resolution: Jurisdiction in {details.emirate} Courts</li>
                        <li>Detailed notarization requirements (notary, 2 witnesses, ID verification)</li>
                        <li>Data Protection: UAE PDPL (Federal Law No. 45 of 2021) compliance</li>
                        <li>Confidentiality provisions and access restrictions</li>
                        <li>Fiduciary duty obligations for Attorney-in-Fact</li>
                        <li>Clear revocation provisions and procedures</li>
                        <li>Ratification clause (simplified language)</li>
                        <li>Conflict with UAE Law clause (supremacy of UAE law)</li>
                        <li>Record-keeping requirements</li>
                        <li>Third-party reliance provisions</li>
                        <li>Liability and indemnification terms</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {/* Notarization Requirements Alert */}
                  <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-900 dark:text-amber-100">
                      Notarization Required for Legal Validity
                    </AlertTitle>
                    <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                      <p className="font-semibold mb-2">This Power of Attorney MUST be notarized to be legally valid in the UAE.</p>
                      <p className="mb-2">Steps to notarize:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Print the generated Power of Attorney document</li>
                        <li>Bring both Principal and Attorney-in-Fact to a UAE notary public office in {details.emirate}</li>
                        <li>Bring 2 witnesses (adults with valid ID, not family members)</li>
                        <li>All parties must bring original Emirates ID or passport</li>
                        <li>Sign in the presence of the notary and witnesses</li>
                        <li>Notary will verify identities, witness signatures, and affix official stamp</li>
                        <li>Pay notary fees (typically AED 50-200)</li>
                      </ol>
                      <p className="mt-2 font-medium">The document is NOT legally binding until notarized.</p>
                    </AlertDescription>
                  </Alert>

                  {/* Jurisdiction Notice */}
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-900 dark:text-blue-100">
                      Jurisdiction: {details.emirate}, UAE
                    </AlertTitle>
                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                      This Power of Attorney will be notarized in {details.emirate} and disputes will be subject to the jurisdiction of {details.emirate} courts. The document is governed by UAE federal and {details.emirate}-specific laws.
                    </AlertDescription>
                  </Alert>

                  {/* Urgency Badge */}
                  {details.urgency && (
                    <div className="flex items-center gap-2">
                      <Badge variant={details.urgency.includes("Extremely") ? "destructive" : details.urgency.includes("Urgent") ? "default" : "secondary"}>
                        {details.urgency}
                      </Badge>
                    </div>
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
                ) : letterType === 'demand_letter' ? (
                  <div className="space-y-4">
                    {/* Debt Context */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Demand Details & Context</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Type of Debt/Claim:</p>
                          <Badge variant="default" className="mt-1">{details.debtType}</Badge>
                        </div>
                        {details.referenceNumber && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Reference Number:</p>
                            <p className="text-sm font-semibold">{details.referenceNumber}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Amount Demanded:</p>
                          <p className="text-lg font-bold text-primary">AED {parseFloat(details.amount).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Goods/Services Provided:</p>
                          <p className="text-sm whitespace-pre-wrap">{details.serviceDescription}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Original Payment Terms:</p>
                          <p className="text-sm">{details.originalPaymentTerms}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Original Due Date:</p>
                          <p className="text-sm font-semibold text-red-600">{details.originalDueDate ? format(parseISO(details.originalDueDate), 'dd MMMM yyyy') : 'Not specified'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Debt-Specific Details (Invoice, Contract, Loan, Rental) */}
                    {(details.invoiceNumber || details.contractTitle || details.loanReference || details.leaseReference) && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Supporting References</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {details.invoiceNumber && (
                            <>
                              <div><span className="text-muted-foreground">Invoice Number:</span> <span className="font-medium">{details.invoiceNumber}</span></div>
                              {details.invoiceDate && <div><span className="text-muted-foreground">Invoice Date:</span> <span className="font-medium">{format(parseISO(details.invoiceDate), 'dd/MM/yyyy')}</span></div>}
                            </>
                          )}
                          {details.contractTitle && (
                            <>
                              <div><span className="text-muted-foreground">Contract:</span> <span className="font-medium">{details.contractTitle}</span></div>
                              {details.contractDate && <div><span className="text-muted-foreground">Contract Date:</span> <span className="font-medium">{format(parseISO(details.contractDate), 'dd/MM/yyyy')}</span></div>}
                              {details.contractClause && <div><span className="text-muted-foreground">Relevant Clause:</span> <span className="font-medium">{details.contractClause}</span></div>}
                              {details.breachDetails && (
                                <div>
                                  <p className="text-muted-foreground font-medium mb-1">Breach Details:</p>
                                  <p className="whitespace-pre-wrap">{details.breachDetails}</p>
                                </div>
                              )}
                            </>
                          )}
                          {details.loanReference && (
                            <>
                              <div><span className="text-muted-foreground">Loan Reference:</span> <span className="font-medium">{details.loanReference}</span></div>
                              {details.loanDate && <div><span className="text-muted-foreground">Loan Date:</span> <span className="font-medium">{format(parseISO(details.loanDate), 'dd/MM/yyyy')}</span></div>}
                              {details.originalLoanAmount && <div><span className="text-muted-foreground">Original Loan Amount:</span> <span className="font-medium">AED {parseFloat(details.originalLoanAmount).toLocaleString('en-AE')}</span></div>}
                              {details.repaymentTerms && <div><span className="text-muted-foreground">Repayment Terms:</span> <span className="font-medium">{details.repaymentTerms}</span></div>}
                              {details.overdueDetails && <div><span className="text-muted-foreground">Overdue:</span> <span className="font-medium">{details.overdueDetails}</span></div>}
                            </>
                          )}
                          {details.leaseReference && (
                            <>
                              <div><span className="text-muted-foreground">Lease Reference:</span> <span className="font-medium">{details.leaseReference}</span></div>
                              {details.propertyAddress && <div><span className="text-muted-foreground">Property:</span> <span className="font-medium">{details.propertyAddress}</span></div>}
                              {details.rentalPeriod && <div><span className="text-muted-foreground">Period in Arrears:</span> <span className="font-medium">{details.rentalPeriod}</span></div>}
                              {details.rentAmount && <div><span className="text-muted-foreground">Rent Amount:</span> <span className="font-medium">AED {details.rentAmount}</span></div>}
                            </>
                          )}
                          {details.otherDebtBasis && (
                            <div>
                              <p className="text-muted-foreground font-medium mb-1">Basis of Claim:</p>
                              <p className="whitespace-pre-wrap">{details.otherDebtBasis}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Payment Deadline & Terms */}
                    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-amber-900 dark:text-amber-100">Payment Deadline & Required Action</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Icon name="calendar" className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Payment Deadline:</p>
                            <p className="text-base font-bold text-amber-900 dark:text-amber-100">
                              {details.paymentDeadline ? format(parseISO(details.paymentDeadline), 'dd MMMM yyyy') : 
                               details.deadlineCalendarDays ? `Within ${details.deadlineCalendarDays} calendar days from receipt` : 'Not specified'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Urgency Level:</p>
                          <Badge variant={details.urgency?.includes("Extremely") ? "destructive" : details.urgency?.includes("Urgent") ? "default" : "secondary"}>
                            {details.urgency}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Partial Payment / Payment Plan:</p>
                          <p className="text-sm text-amber-900 dark:text-amber-100">{details.partialPaymentAccepted}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-blue-900 dark:text-blue-100">Payment Methods Accepted</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Bank Transfer */}
                        {details.bankTransferAllowed?.includes("Yes") && (
                          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">
                            <p className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">✓ Bank Transfer (Preferred)</p>
                            <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                              <p><span className="font-medium">Bank:</span> {details.bankName}</p>
                              <p><span className="font-medium">Account Name:</span> {details.accountName}</p>
                              <p><span className="font-medium">Account Number:</span> {details.accountNumber}</p>
                              {details.iban && <p><span className="font-medium">IBAN:</span> {details.iban}</p>}
                              {details.swiftCode && <p><span className="font-medium">SWIFT Code:</span> {details.swiftCode}</p>}
                              {details.bankBranch && <p><span className="font-medium">Branch:</span> {details.bankBranch}</p>}
                            </div>
                          </div>
                        )}

                        {/* Cheque */}
                        {details.chequeAllowed?.includes("Yes") && (
                          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">
                            <p className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">✓ Cheque Payment</p>
                            <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                              <p><span className="font-medium">Payable To:</span> {details.chequePayeeName}</p>
                              <p><span className="font-medium">Deliver To:</span> {details.chequeDeliveryAddress}</p>
                            </div>
                          </div>
                        )}

                        {/* Cash */}
                        {details.cashAllowed?.includes("Yes") && (
                          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">
                            <p className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">✓ Cash Payment (Max AED 55,000)</p>
                            <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                              <p><span className="font-medium">Address:</span> {details.cashPaymentAddress}</p>
                              <p><span className="font-medium">Hours:</span> {details.businessHours}</p>
                              {details.contactPerson && <p><span className="font-medium">Contact:</span> {details.contactPerson}</p>}
                              {details.contactPhone && <p><span className="font-medium">Phone:</span> {details.contactPhone}</p>}
                            </div>
                          </div>
                        )}

                        {/* Online Payment */}
                        {details.onlinePaymentAllowed?.includes("Yes") && (
                          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">
                            <p className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">✓ Online Payment</p>
                            <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                              <p><span className="font-medium">Portal:</span> {details.paymentPortalURL}</p>
                              {details.referenceCode && <p><span className="font-medium">Reference Code:</span> {details.referenceCode}</p>}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
                          <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Payment Confirmation:</p>
                          <p className="text-xs text-blue-800 dark:text-blue-200">Email: {details.senderEmail}</p>
                          <p className="text-xs text-blue-800 dark:text-blue-200">Phone: {details.senderPhone}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Consequences */}
                    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-red-900 dark:text-red-100">Consequences of Non-Compliance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm whitespace-pre-wrap text-red-800 dark:text-red-200">{details.consequences}</p>
                        {details.interestRate && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">Late Payment Interest:</p>
                            <p className="text-sm text-red-900 dark:text-red-100">{details.interestRate}% per period</p>
                          </div>
                        )}
                        {details.estimatedLegalCosts && (
                          <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">Estimated Legal Costs:</p>
                            <p className="text-sm text-red-900 dark:text-red-100">AED {parseFloat(details.estimatedLegalCosts).toLocaleString('en-AE')}</p>
                          </div>
                        )}
                        {details.creditReportingThreat?.includes("Yes") && (
                          <Alert className="border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900 mt-2">
                            <AlertCircle className="h-4 w-4 text-red-700 dark:text-red-300" />
                            <AlertDescription className="text-xs text-red-800 dark:text-red-200">
                              This letter will include a warning that default may be reported to Al Etihad Credit Bureau (AECB), which may affect the debtor's credit rating and future credit applications in the UAE.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>

                    {/* Supporting Documents & Previous Attempts */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Supporting Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        {details.supportingDocs && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Supporting Documents:</p>
                            <p className="whitespace-pre-wrap">{details.supportingDocs}</p>
                          </div>
                        )}
                        {details.previousAttempts && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Previous Collection Attempts:</p>
                            <p className="whitespace-pre-wrap">{details.previousAttempts}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Legal Compliance Summary */}
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-900 dark:text-green-100">
                        Legal Compliance & Requirements Included
                      </AlertTitle>
                      <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                        Your demand letter will automatically include:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Governing Law: {details.applicableLaw}</li>
                          <li>Dispute Resolution: Jurisdiction in {details.emirate} Courts</li>
                          <li>UAE PDPL (Federal Law No. 45 of 2021) data protection compliance</li>
                          <li>Clear reason for debt with specific references (invoice/contract/agreement)</li>
                          <li>Realistic payment deadline: {details.paymentDeadline ? format(parseISO(details.paymentDeadline), 'dd MMMM yyyy') : `${details.deadlineCalendarDays} calendar days from receipt`}</li>
                          <li>Detailed payment methods and instructions</li>
                          <li>Specific consequences of non-compliance</li>
                          <li>Reservation of rights clause</li>
                          <li>Professional formatting with standardized section headers</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Jurisdiction Notice */}
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-900 dark:text-blue-100">
                        Jurisdiction: {details.emirate}, UAE
                      </AlertTitle>
                      <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                        This demand letter specifies that any legal proceedings will be filed in the competent courts of {details.emirate}, United Arab Emirates. The letter is governed by UAE federal laws, specifically: {details.applicableLaw}.
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
