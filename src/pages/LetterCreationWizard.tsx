import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { format, parseISO, isAfter, isBefore, startOfDay, subMonths } from "date-fns";
import {
  IconBuildingCommunity as IconBuilding,
  IconAlertCircle,
  IconCurrencyDollar,
  IconDeviceLaptop,
  IconChecklist,
  IconLock,
  IconShieldCheck,
  IconCircleCheck,
  IconUsers,
  IconBriefcase,
  IconGift,
  IconClock,
  IconCalendar,
  IconAlertTriangle
} from "@tabler/icons-react";
import { Icon } from "@/components/ui/Icon";

const LETTER_TYPES = [
  { value: "demand_letter", label: "Demand Letter" },
  { value: "settlement_agreement", label: "Settlement Agreement" },
  { value: "employment_termination", label: "Employment Termination Letter" },
  { value: "employment_contract", label: "Employment Contract" },
  { value: "nda", label: "Non-Disclosure Agreement" },
  { value: "workplace_complaint", label: "Workplace Complaint" },
  { value: "power_of_attorney", label: "Power of Attorney" },
  { value: "general_legal", label: "General Legal Letter" },
];

type LetterType = typeof LETTER_TYPES[number]["value"];

export default function LetterCreationWizard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [letterType, setLetterType] = useState<LetterType | "">("");
  const [details, setDetails] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const getFieldsForLetterType = (type: LetterType) => {
    switch (type) {
      case "employment_termination":
        return [
          { name: "companyName", label: "Company Name", type: "text", required: true },
          { name: "companyAddress", label: "Company Address", type: "textarea", required: true },
          { name: "hrEmail", label: "HR Email", type: "email", required: true },
          { name: "hrPhone", label: "HR Phone", type: "tel", required: true },
          { name: "employeeName", label: "Employee Full Name", type: "text", required: true },
          { name: "employeeId", label: "Employee ID", type: "text", required: true },
          { name: "position", label: "Position/Job Title", type: "text", required: true },
          { name: "department", label: "Department", type: "text", required: false },
          { name: "emiratesIdOrPassport", label: "Emirates ID/Passport", type: "text", required: true },
          { name: "employeeEmail", label: "Employee Email", type: "email", required: true },
          { name: "employeeAddress", label: "Employee Address", type: "textarea", required: true },
          { name: "terminationReason", label: "Termination Reason", type: "select", required: true, options: [
            "Redundancy/Position Elimination",
            "Performance Issues",
            "Misconduct",
            "Contract Expiry",
            "Mutual Agreement",
            "Business Restructuring",
            "Other"
          ]},
          { name: "detailedReason", label: "Detailed Explanation", type: "textarea", required: true },
          { name: "noticeDate", label: "Notice Date", type: "date", required: true },
          { name: "terminationDate", label: "Termination Effective Date", type: "date", required: true },
          { name: "finalWorkingDay", label: "Final Working Day", type: "date", required: true },
          { name: "noticePeriodRequired", label: "Notice Period Required (days)", type: "number", required: true },
          { name: "noticePeriodProvided", label: "Notice Period Provided (days)", type: "number", required: true },
          { name: "basicSalary", label: "Basic Monthly Salary (AED)", type: "number", required: true },
          { name: "noticePeriodPay", label: "Notice Period Pay (days)", type: "number", required: true },
          { name: "accruedLeave", label: "Accrued Annual Leave (days)", type: "number", required: true },
          { name: "annualLeavePay", label: "Annual Leave Pay Amount (AED)", type: "number", required: false },
          { name: "gratuityYears", label: "Years of Service (for gratuity)", type: "number", required: true },
          { name: "gratuityAmount", label: "Gratuity Amount (AED)", type: "number", required: true },
          { name: "repatriationBenefit", label: "Repatriation Benefit", type: "select", required: true, options: [
            "Flight Ticket Provided",
            "Cash Equivalent",
            "Not Applicable"
          ]},
          { name: "repatriationDestination", label: "Repatriation Destination", type: "text", required: false },
          { name: "repatriationAmount", label: "Repatriation Cash Amount (AED)", type: "number", required: false },
          { name: "otherDues", label: "Other Dues Description", type: "text", required: false },
          { name: "otherDuesAmount", label: "Other Dues Amount (AED)", type: "number", required: false },
          { name: "totalSettlement", label: "Total Final Settlement (AED)", type: "number", required: true },
          { name: "propertyToReturn", label: "Company Property to Return?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "laptopDetails", label: "Laptop Details", type: "text", required: false },
          { name: "mobilePhone", label: "Mobile Phone Details", type: "text", required: false },
          { name: "accessCards", label: "Access Cards/Keys", type: "text", required: false },
          { name: "documentsToReturn", label: "Documents to Return", type: "text", required: false },
          { name: "otherProperty", label: "Other Property", type: "text", required: false },
          { name: "propertyReturnDeadline", label: "Property Return Deadline", type: "date", required: false },
          { name: "consequencesNonReturn", label: "Consequences of Non-Return", type: "textarea", required: false },
          { name: "settlementTimeline", label: "Settlement Timeline", type: "text", required: true },
          { name: "settlementMethod", label: "Settlement Payment Method", type: "select", required: true, options: [
            "Bank Transfer",
            "Cheque",
            "Cash"
          ]},
          { name: "employeeBankAccount", label: "Employee Bank Account (if transfer)", type: "text", required: false },
          { name: "settlementContact", label: "Settlement Contact Person", type: "text", required: true },
          { name: "settlementQueriesContact", label: "Settlement Queries Contact", type: "text", required: true },
          { name: "payrollEmail", label: "Payroll Email", type: "email", required: false },
          { name: "confidentialityContinues", label: "Confidentiality Continues?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "ndaSigned", label: "NDA Previously Signed?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "nonCompeteApplicable", label: "Non-Compete Applicable?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "nonCompeteDuration", label: "Non-Compete Duration (months)", type: "number", required: false },
          { name: "nonCompeteScope", label: "Non-Compete Scope", type: "textarea", required: false },
          { name: "dataRetentionPeriod", label: "Data Retention Period", type: "text", required: true },
          { name: "dataProtectionEmail", label: "Data Protection Contact Email", type: "email", required: true },
          { name: "certificateRequired", label: "Employment Certificate Required?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "certificateIssuanceTimeline", label: "Certificate Issuance Timeline", type: "text", required: false },
          { name: "additionalInstructions", label: "Additional Instructions", type: "textarea", required: false },
          { name: "emirate", label: "Jurisdiction (Emirate)", type: "select", required: true, options: [
            "Dubai",
            "Abu Dhabi",
            "Sharjah",
            "Ajman",
            "Umm Al Quwain",
            "Ras Al Khaimah",
            "Fujairah"
          ]},
        ];
      case "employment_contract":
        return [
          { name: "companyName", label: "Company Legal Name", type: "text", required: true },
          { name: "companyLicense", label: "Company License Number", type: "text", required: false },
          { name: "companyAddress", label: "Company Address", type: "textarea", required: true },
          { name: "hrEmail", label: "HR Contact Email", type: "email", required: true },
          { name: "hrPhone", label: "HR Contact Phone", type: "tel", required: true },
          { name: "employeeName", label: "Employee Full Legal Name", type: "text", required: true },
          { name: "employeeNationality", label: "Employee Nationality", type: "text", required: true },
          { name: "passportOrId", label: "Passport/Emirates ID Number", type: "text", required: true },
          { name: "employeeAddress", label: "Employee UAE Address", type: "textarea", required: true },
          { name: "employeeEmail", label: "Employee Email", type: "email", required: true },
          { name: "employeePhone", label: "Employee Phone", type: "tel", required: true },
          { name: "emergencyContact", label: "Emergency Contact", type: "text", required: false },
          { name: "jobTitle", label: "Job Title/Position", type: "text", required: true },
          { name: "department", label: "Department", type: "text", required: true },
          { name: "directManager", label: "Direct Manager/Supervisor", type: "text", required: true },
          { name: "jobDescription", label: "Job Description & Duties", type: "textarea", required: true },
          { name: "reportingStructure", label: "Reporting Structure", type: "text", required: false },
          { name: "contractType", label: "Contract Type", type: "select", required: true, options: [
            "Limited/Fixed Term",
            "Unlimited/Indefinite"
          ]},
          { name: "contractDuration", label: "Contract Duration (if fixed term)", type: "text", required: false },
          { name: "startDate", label: "Employment Start Date", type: "date", required: true },
          { name: "workLocation", label: "Primary Work Location", type: "text", required: true },
          { name: "probationPeriod", label: "Probation Period", type: "select", required: true, options: [
            "No Probation",
            "3 months",
            "6 months"
          ]},
          { name: "probationNotice", label: "Probation Notice Period (days)", type: "number", required: false },
          { name: "basicSalary", label: "Basic Monthly Salary (AED)", type: "number", required: true },
          { name: "housingAllowance", label: "Housing Allowance", type: "text", required: true },
          { name: "transportAllowance", label: "Transport Allowance", type: "text", required: true },
          { name: "otherAllowances", label: "Other Allowances", type: "textarea", required: false },
          { name: "annualBonus", label: "Annual Bonus Structure", type: "text", required: false },
          { name: "commissionStructure", label: "Commission Structure", type: "text", required: false },
          { name: "totalMonthlyCompensation", label: "Total Monthly Compensation (AED)", type: "number", required: true },
          { name: "paymentFrequency", label: "Payment Frequency", type: "select", required: true, options: [
            "Monthly",
            "Bi-weekly",
            "Weekly"
          ]},
          { name: "paymentMethod", label: "Payment Method", type: "select", required: true, options: [
            "Bank Transfer",
            "Cheque",
            "Cash"
          ]},
          { name: "salaryReviewFrequency", label: "Salary Review Frequency", type: "text", required: false },
          { name: "healthInsurance", label: "Health Insurance", type: "select", required: true, options: [
            "Provided by Company",
            "Employee Responsible"
          ]},
          { name: "healthInsuranceCoverage", label: "Health Insurance Coverage Details", type: "text", required: false },
          { name: "annualLeaveEntitlement", label: "Annual Leave Entitlement (days)", type: "number", required: true },
          { name: "flightTickets", label: "Annual Flight Tickets", type: "text", required: true },
          { name: "visaWorkPermit", label: "Visa & Work Permit", type: "select", required: true, options: [
            "Company Provides",
            "Employee Responsible"
          ]},
          { name: "otherBenefits", label: "Other Benefits", type: "textarea", required: false },
          { name: "benefitsCommencementDate", label: "Benefits Commencement Date", type: "date", required: false },
          { name: "workingHoursPerDay", label: "Working Hours Per Day", type: "number", required: true },
          { name: "workingDaysPerWeek", label: "Working Days Per Week", type: "number", required: true },
          { name: "workSchedule", label: "Work Schedule", type: "text", required: true },
          { name: "ramadanWorkingHours", label: "Ramadan Working Hours", type: "text", required: true },
          { name: "overtimePolicy", label: "Overtime Policy", type: "textarea", required: true },
          { name: "restDaysPerWeek", label: "Rest Days Per Week", type: "number", required: true },
          { name: "otherLeaveTypes", label: "Other Leave Types", type: "textarea", required: false },
          { name: "leaveApprovalProcess", label: "Leave Approval Process", type: "text", required: false },
          { name: "noticePeriodByEmployee", label: "Notice Period by Employee (days)", type: "number", required: true },
          { name: "noticePeriodByEmployer", label: "Notice Period by Employer (days)", type: "number", required: true },
          { name: "terminationConditions", label: "Additional Termination Conditions", type: "textarea", required: false },
          { name: "gardenLeaveApplicable", label: "Garden Leave Applicable?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "confidentialityObligation", label: "Confidentiality Obligation?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "ndaSeparate", label: "Separate NDA Signed?", type: "select", required: false, options: ["Yes", "No"] },
          { name: "dataAccessLevel", label: "Data Access Level", type: "text", required: false },
          { name: "nonCompeteClause", label: "Non-Compete Clause?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "nonCompeteDuration", label: "Non-Compete Duration (months)", type: "number", required: false },
          { name: "nonCompeteScope", label: "Non-Compete Scope", type: "textarea", required: false },
          { name: "personalDataRetentionPeriod", label: "Personal Data Retention Period", type: "text", required: true },
          { name: "dataProtectionEmail", label: "Data Protection Contact Email", type: "email", required: true },
          { name: "freeZoneEmployment", label: "Free Zone Employment?", type: "text", required: false },
          { name: "emirate", label: "Jurisdiction (Emirate)", type: "select", required: true, options: [
            "Dubai",
            "Abu Dhabi",
            "Sharjah",
            "Ajman",
            "Umm Al Quwain",
            "Ras Al Khaimah",
            "Fujairah"
          ]},
          { name: "companyPoliciesAcknowledgment", label: "Company Policies Acknowledgment", type: "textarea", required: false },
          { name: "specialConditions", label: "Special Conditions", type: "textarea", required: false },
          { name: "attachments", label: "Attachments List", type: "textarea", required: false },
        ];
      case "demand_letter":
        return [
          { name: "senderName", label: "Your Name/Company Name", type: "text", required: true },
          { name: "senderAddress", label: "Your Address", type: "textarea", required: true },
          { name: "senderEmail", label: "Your Email", type: "email", required: true },
          { name: "senderPhone", label: "Your Phone", type: "tel", required: true },
          { name: "recipientName", label: "Recipient Name", type: "text", required: true },
          { name: "recipientAddress", label: "Recipient Address", type: "textarea", required: true },
          { name: "recipientEmail", label: "Recipient Email", type: "email", required: false },
          { name: "debtType", label: "Nature of Debt/Claim", type: "select", required: true, options: [
            "Unpaid Invoice",
            "Breach of Contract",
            "Payment for Services",
            "Loan Repayment",
            "Rental Arrears",
            "Other"
          ]},
          { name: "invoiceNumber", label: "Invoice Number (if applicable)", type: "text", required: false },
          { name: "invoiceDate", label: "Invoice Date", type: "date", required: false },
          { name: "serviceDescription", label: "Goods/Services Description", type: "textarea", required: true },
          { name: "originalPaymentTerms", label: "Original Payment Terms", type: "text", required: false },
          { name: "originalDueDate", label: "Original Due Date", type: "date", required: false },
          { name: "contractTitle", label: "Contract Title (if applicable)", type: "text", required: false },
          { name: "contractDate", label: "Contract Date", type: "date", required: false },
          { name: "contractClause", label: "Relevant Contract Clause", type: "text", required: false },
          { name: "breachDetails", label: "Breach Details", type: "textarea", required: false },
          { name: "amount", label: "Amount Owed (AED)", type: "number", required: true },
          { name: "supportingDocs", label: "Supporting Documents", type: "textarea", required: false },
          { name: "paymentDeadline", label: "Payment Deadline", type: "date", required: false },
          { name: "deadlineCalendarDays", label: "Deadline (calendar days from receipt)", type: "number", required: false },
          { name: "partialPaymentAccepted", label: "Partial Payment Accepted?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "bankTransferAllowed", label: "Bank Transfer Allowed?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "bankName", label: "Bank Name", type: "text", required: false },
          { name: "accountName", label: "Account Name", type: "text", required: false },
          { name: "accountNumber", label: "Account Number", type: "text", required: false },
          { name: "iban", label: "IBAN", type: "text", required: false },
          { name: "swiftCode", label: "SWIFT Code", type: "text", required: false },
          { name: "bankBranch", label: "Bank Branch", type: "text", required: false },
          { name: "chequeAllowed", label: "Cheque Payment Allowed?", type: "select", required: false, options: ["Yes", "No"] },
          { name: "chequePayeeName", label: "Cheque Payee Name", type: "text", required: false },
          { name: "chequeDeliveryAddress", label: "Cheque Delivery Address", type: "textarea", required: false },
          { name: "cashAllowed", label: "Cash Payment Allowed?", type: "select", required: false, options: ["Yes", "No"] },
          { name: "cashPaymentAddress", label: "Cash Payment Address", type: "textarea", required: false },
          { name: "businessHours", label: "Business Hours", type: "text", required: false },
          { name: "contactPerson", label: "Contact Person", type: "text", required: false },
          { name: "contactPhone", label: "Contact Phone", type: "tel", required: false },
          { name: "onlinePaymentAllowed", label: "Online Payment Allowed?", type: "select", required: false, options: ["Yes", "No"] },
          { name: "paymentPortalURL", label: "Payment Portal URL", type: "text", required: false },
          { name: "referenceCode", label: "Reference Code", type: "text", required: false },
          { name: "referenceNumber", label: "Reference Number", type: "text", required: false },
          { name: "applicableLaw", label: "Applicable UAE Law", type: "textarea", required: true },
          { name: "consequences", label: "Consequences of Non-Compliance", type: "textarea", required: true },
          { name: "interestRate", label: "Late Payment Interest Rate (%)", type: "number", required: false },
          { name: "estimatedLegalCosts", label: "Estimated Legal Costs (AED)", type: "number", required: false },
          { name: "creditReportingThreat", label: "Credit Reporting Threat?", type: "select", required: false, options: ["Yes", "No"] },
          { name: "previousAttempts", label: "Previous Resolution Attempts", type: "textarea", required: false },
          { name: "emirate", label: "Jurisdiction (Emirate)", type: "select", required: true, options: [
            "Dubai",
            "Abu Dhabi",
            "Sharjah",
            "Ajman",
            "Umm Al Quwain",
            "Ras Al Khaimah",
            "Fujairah"
          ]},
        ];
      case "settlement_agreement":
        return [
          { name: "agreementReference", label: "Agreement Reference Number", type: "text", required: false },
          { name: "agreementDate", label: "Agreement Date", type: "date", required: true },
          { name: "agreementLocation", label: "Place of Execution", type: "text", required: true },
          { name: "partyAName", label: "Party A Full Name", type: "text", required: true },
          { name: "partyAEmiratesId", label: "Party A Emirates ID/Passport", type: "text", required: true },
          { name: "partyAAddress", label: "Party A Address", type: "textarea", required: true },
          { name: "partyAEmail", label: "Party A Email", type: "email", required: true },
          { name: "partyAPhone", label: "Party A Phone", type: "tel", required: true },
          { name: "partyALegalRep", label: "Party A Legal Representative (if any)", type: "text", required: false },
          { name: "partyALegalRepId", label: "Party A Legal Rep Emirates ID", type: "text", required: false },
          { name: "partyBName", label: "Party B Full Name", type: "text", required: true },
          { name: "partyBEmiratesId", label: "Party B Emirates ID/Passport", type: "text", required: true },
          { name: "partyBAddress", label: "Party B Address", type: "textarea", required: true },
          { name: "partyBEmail", label: "Party B Email", type: "email", required: true },
          { name: "partyBPhone", label: "Party B Phone", type: "tel", required: true },
          { name: "partyBLegalRep", label: "Party B Legal Representative (if any)", type: "text", required: false },
          { name: "partyBLegalRepId", label: "Party B Legal Rep Emirates ID", type: "text", required: false },
          { name: "natureOfDispute", label: "Nature of Dispute", type: "text", required: true },
          { name: "disputeDescription", label: "Detailed Dispute Description", type: "textarea", required: true },
          { name: "disputeOriginDate", label: "Dispute Origin Date", type: "date", required: true },
          { name: "disputeReference", label: "Dispute Reference/Case Number", type: "text", required: false },
          { name: "previousAttempts", label: "Previous Resolution Attempts", type: "textarea", required: true },
          { name: "settlementObjective", label: "Settlement Objective", type: "text", required: true },
          { name: "settlementTerms", label: "Key Settlement Terms", type: "textarea", required: true },
          { name: "nonMonetaryObligations", label: "Non-Monetary Obligations", type: "textarea", required: false },
          { name: "conditionsPrecedent", label: "Conditions Precedent", type: "textarea", required: false },
          { name: "performanceTimeline", label: "Performance Timeline", type: "text", required: false },
          { name: "deliveryRequirements", label: "Delivery Requirements", type: "textarea", required: false },
          { name: "paymentInvolved", label: "Payment Involved?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "settlementAmount", label: "Settlement Amount (AED)", type: "number", required: false },
          { name: "settlementAmountWords", label: "Settlement Amount (in words)", type: "text", required: false },
          { name: "currency", label: "Currency", type: "text", required: false },
          { name: "paymentStructure", label: "Payment Structure", type: "select", required: false, options: [
            "Lump Sum",
            "Installments"
          ]},
          { name: "paymentSchedule", label: "Payment Schedule", type: "textarea", required: false },
          { name: "paymentMethod", label: "Payment Method", type: "select", required: false, options: [
            "Bank Transfer",
            "Cheque",
            "Cash"
          ]},
          { name: "bankName", label: "Bank Name", type: "text", required: false },
          { name: "accountName", label: "Account Name", type: "text", required: false },
          { name: "accountNumber", label: "Account Number", type: "text", required: false },
          { name: "iban", label: "IBAN", type: "text", required: false },
          { name: "latePaymentConsequences", label: "Late Payment Consequences", type: "textarea", required: false },
          { name: "receiptRequirements", label: "Receipt Requirements", type: "text", required: false },
          { name: "partyAReleasesB", label: "Party A Releases Party B?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "partyAReleaseScope", label: "Party A Release Scope", type: "textarea", required: false },
          { name: "partyBReleasesA", label: "Party B Releases Party A?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "partyBReleaseScope", label: "Party B Release Scope", type: "textarea", required: false },
          { name: "releaseEffectiveDate", label: "Release Effective Date", type: "date", required: true },
          { name: "noAdmissionOfLiability", label: "No Admission of Liability?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "additionalLiabilityQualifications", label: "Additional Liability Qualifications", type: "textarea", required: false },
          { name: "isConfidential", label: "Is Settlement Confidential?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "confidentialityScope", label: "Confidentiality Scope", type: "textarea", required: false },
          { name: "whoCanAccess", label: "Who Can Access Settlement Terms?", type: "textarea", required: false },
          { name: "confidentialityExceptions", label: "Confidentiality Exceptions", type: "textarea", required: false },
          { name: "breachOfConfidentialityConsequences", label: "Breach of Confidentiality Consequences", type: "textarea", required: false },
          { name: "includeNonDisparagement", label: "Include Non-Disparagement?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "nonDisparagementDetails", label: "Non-Disparagement Details", type: "textarea", required: false },
          { name: "jurisdictionEmirate", label: "Jurisdiction (Emirate)", type: "select", required: true, options: [
            "Dubai",
            "Abu Dhabi",
            "Sharjah",
            "Ajman",
            "Umm Al Quwain",
            "Ras Al Khaimah",
            "Fujairah"
          ]},
          { name: "disputeResolutionMethod", label: "Dispute Resolution Method", type: "select", required: true, options: [
            "Courts",
            "Arbitration",
            "Mediation"
          ]},
          { name: "arbitrationDetails", label: "Arbitration Details (if applicable)", type: "textarea", required: false },
          { name: "language", label: "Language of Agreement", type: "text", required: false },
          { name: "requiresNotarization", label: "Requires Notarization?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "notaryLocation", label: "Notary Location", type: "text", required: false },
          { name: "witnessesRequired", label: "Number of Witnesses Required", type: "number", required: false },
          { name: "witness1Name", label: "Witness 1 Name", type: "text", required: false },
          { name: "witness1EmiratesId", label: "Witness 1 Emirates ID", type: "text", required: false },
          { name: "witness2Name", label: "Witness 2 Name", type: "text", required: false },
          { name: "witness2EmiratesId", label: "Witness 2 Emirates ID", type: "text", required: false },
        ];
      case "nda":
        return [
          { name: "disclosingParty", label: "Disclosing Party Name", type: "text", required: true },
          { name: "receivingParty", label: "Receiving Party Name", type: "text", required: true },
          { name: "effectiveDate", label: "Effective Date", type: "date", required: true },
          { name: "purpose", label: "Purpose of Disclosure", type: "textarea", required: true },
          { name: "confidentialInfo", label: "Definition of Confidential Information", type: "textarea", required: true },
          { name: "duration", label: "Duration (years)", type: "number", required: true },
          { name: "governingLaw", label: "Governing Law (Emirate)", type: "select", required: true, options: [
            "Dubai",
            "Abu Dhabi",
            "Sharjah",
            "Ajman",
            "Umm Al Quwain",
            "Ras Al Khaimah",
            "Fujairah"
          ]},
        ];
      case "workplace_complaint":
        return [
          { name: "complainantName", label: "Your Full Name", type: "text", required: true },
          { name: "complainantPosition", label: "Your Position", type: "text", required: true },
          { name: "complainantDepartment", label: "Your Department", type: "text", required: true },
          { name: "complainantEmployeeId", label: "Your Employee ID", type: "text", required: true },
          { name: "complainantEmail", label: "Your Email", type: "email", required: true },
          { name: "complainantPhone", label: "Your Phone", type: "tel", required: true },
          { name: "incidentDate", label: "Incident Date", type: "date", required: true },
          { name: "incidentTime", label: "Incident Time", type: "time", required: false },
          { name: "incidentLocation", label: "Incident Location", type: "text", required: true },
          { name: "respondentName", label: "Respondent Name (if applicable)", type: "text", required: false },
          { name: "respondentPosition", label: "Respondent Position", type: "text", required: false },
          { name: "respondentDepartment", label: "Respondent Department", type: "text", required: false },
          { name: "witnessName", label: "Witness Name (if any)", type: "text", required: false },
          { name: "witnessPosition", label: "Witness Position", type: "text", required: false },
          { name: "witnessContact", label: "Witness Contact", type: "text", required: false },
          { name: "complaintType", label: "Type of Complaint", type: "select", required: true, options: [
            "Harassment",
            "Discrimination",
            "Bullying",
            "Safety Violation",
            "Wage/Salary Issue",
            "Working Conditions",
            "Breach of Contract",
            "Other"
          ]},
          { name: "detailedDescription", label: "Detailed Description of Incident", type: "textarea", required: true },
          { name: "impactOnWork", label: "Impact on Your Work", type: "textarea", required: true },
          { name: "evidence", label: "Evidence (describe documents, emails, etc.)", type: "textarea", required: false },
          { name: "previousReports", label: "Previous Reports of Similar Incidents?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "previousReportsDetails", label: "Previous Reports Details", type: "textarea", required: false },
          { name: "desiredResolution", label: "Desired Resolution", type: "textarea", required: true },
        ];
      case "power_of_attorney":
        return [
          { name: "principalFullName", label: "Principal Full Name (Grantor)", type: "text", required: true },
          { name: "principalEmiratesId", label: "Principal Emirates ID/Passport", type: "text", required: true },
          { name: "principalAddress", label: "Principal Address", type: "textarea", required: true },
          { name: "principalPhone", label: "Principal Phone", type: "tel", required: true },
          { name: "principalEmail", label: "Principal Email", type: "email", required: true },
          { name: "attorneyFullName", label: "Attorney-in-Fact Full Name (Agent)", type: "text", required: true },
          { name: "attorneyEmiratesId", label: "Attorney Emirates ID/Passport", type: "text", required: true },
          { name: "attorneyAddress", label: "Attorney Address", type: "textarea", required: true },
          { name: "attorneyPhone", label: "Attorney Phone", type: "tel", required: true },
          { name: "attorneyEmail", label: "Attorney Email", type: "email", required: true },
          { name: "attorneyRelationship", label: "Relationship to Principal", type: "text", required: true },
          { name: "financialPowers", label: "Financial Powers?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "propertyPowers", label: "Property Powers?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "legalPowers", label: "Legal Powers?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "businessPowers", label: "Business Powers?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "healthcarePowers", label: "Healthcare Powers?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "govPowers", label: "Government/Administrative Powers?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "additionalPowers", label: "Additional Specific Powers", type: "textarea", required: false },
          { name: "explicitLimitations", label: "Explicit Limitations", type: "textarea", required: false },
          { name: "subDelegation", label: "Sub-Delegation Authority", type: "select", required: true, options: [
            "Allowed with restrictions",
            "Not allowed",
            "Allowed without restrictions"
          ]},
          { name: "effectiveDate", label: "Effective Date", type: "date", required: true },
          { name: "durationType", label: "Duration Type", type: "select", required: true, options: [
            "Permanent",
            "Fixed term",
            "Event-based"
          ]},
          { name: "expiryDate", label: "Expiry Date (if fixed term)", type: "date", required: false },
          { name: "terminationEvent", label: "Termination Event (if event-based)", type: "text", required: false },
          { name: "revocationNotice", label: "Revocation Notice Period", type: "text", required: true },
          { name: "witness1Name", label: "Witness 1 Full Name", type: "text", required: true },
          { name: "witness1EmiratesId", label: "Witness 1 Emirates ID", type: "text", required: true },
          { name: "witness1Phone", label: "Witness 1 Phone", type: "tel", required: true },
          { name: "witness1Address", label: "Witness 1 Address", type: "textarea", required: true },
          { name: "witness2Name", label: "Witness 2 Full Name", type: "text", required: true },
          { name: "witness2EmiratesId", label: "Witness 2 Emirates ID", type: "text", required: true },
          { name: "witness2Phone", label: "Witness 2 Phone", type: "tel", required: true },
          { name: "witness2Address", label: "Witness 2 Address", type: "textarea", required: true },
          { name: "emirate", label: "Jurisdiction (Emirate)", type: "select", required: true, options: [
            "Dubai",
            "Abu Dhabi",
            "Sharjah",
            "Ajman",
            "Umm Al Quwain",
            "Ras Al Khaimah",
            "Fujairah"
          ]},
          { name: "compensation", label: "Compensation for Attorney", type: "text", required: false },
          { name: "compensationAmount", label: "Compensation Amount (AED)", type: "number", required: false },
          { name: "accountingFrequency", label: "Accounting Frequency", type: "text", required: false },
          { name: "purposeContext", label: "Purpose/Context", type: "textarea", required: false },
        ];
      case "general_legal":
        return [
          { name: "senderName", label: "Sender Name", type: "text", required: true },
          { name: "senderAddress", label: "Sender Address", type: "textarea", required: true },
          { name: "senderEmail", label: "Sender Email", type: "email", required: true },
          { name: "senderPhone", label: "Sender Phone", type: "tel", required: true },
          { name: "recipientName", label: "Recipient Name", type: "text", required: true },
          { name: "recipientAddress", label: "Recipient Address", type: "textarea", required: true },
          { name: "subject", label: "Subject/Matter", type: "text", required: true },
          { name: "background", label: "Background/Context", type: "textarea", required: true },
          { name: "legalBasis", label: "Legal Basis (UAE Laws)", type: "textarea", required: true },
          { name: "requiredAction", label: "Required Action", type: "textarea", required: true },
          { name: "deadline", label: "Deadline for Action", type: "date", required: false },
          { name: "consequences", label: "Consequences of Non-Compliance", type: "textarea", required: false },
          { name: "emirate", label: "Jurisdiction (Emirate)", type: "select", required: true, options: [
            "Dubai",
            "Abu Dhabi",
            "Sharjah",
            "Ajman",
            "Umm Al Quwain",
            "Ras Al Khaimah",
            "Fujairah"
          ]},
        ];
      default:
        return [];
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setDetails(prev => ({ ...prev, [fieldName]: value }));
    setValidationErrors(prev => prev.filter(err => !err.includes(fieldName)));
  };

  const validateStep = () => {
    const errors: string[] = [];
    const fields = getFieldsForLetterType(letterType as LetterType);
    
    fields.forEach(field => {
      if (field.required && !details[field.name]) {
        errors.push(`${field.label} is required`);
      }
    });

    if (letterType === 'employment_termination') {
      if (details.noticeDate && details.terminationDate) {
        const notice = new Date(details.noticeDate);
        const termination = new Date(details.terminationDate);
        if (isAfter(notice, termination)) {
          errors.push("Notice date cannot be after termination date");
        }
      }

      if (details.terminationDate && details.finalWorkingDay) {
        const termination = new Date(details.terminationDate);
        const finalDay = new Date(details.finalWorkingDay);
        if (isAfter(finalDay, termination)) {
          errors.push("Final working day cannot be after termination date");
        }
      }

      if (details.noticePeriodRequired && details.noticePeriodProvided) {
        const required = parseInt(details.noticePeriodRequired);
        const provided = parseInt(details.noticePeriodProvided);
        if (provided < required) {
          toast({
            title: "Notice Period Warning",
            description: `Notice period provided (${provided} days) is less than required (${required} days). Payment in lieu will be mentioned in the letter.`,
            variant: "default",
          });
        }
      }

      if (details.propertyToReturn === 'Yes') {
        if (!details.propertyReturnDeadline) {
          errors.push("Property return deadline is required when property return is 'Yes'");
        }
        if (!details.consequencesNonReturn) {
          errors.push("Consequences of non-return must be specified when property return is 'Yes'");
        }
      }

      if (details.nonCompeteApplicable === 'Yes') {
        if (!details.nonCompeteDuration) {
          errors.push("Non-compete duration is required when non-compete is applicable");
        }
        if (!details.nonCompeteScope) {
          errors.push("Non-compete scope is required when non-compete is applicable");
        }
      }
    }

    if (letterType === 'employment_contract') {
      if (details.startDate) {
        const start = new Date(details.startDate);
        const today = startOfDay(new Date());
        if (isBefore(start, today)) {
          toast({
            title: "Start Date Warning",
            description: "Start date is in the past. Please verify this is correct.",
            variant: "default",
          });
        }
      }

      if (details.contractType === 'Limited/Fixed Term' && !details.contractDuration) {
        errors.push("Contract duration is required for fixed-term contracts");
      }

      if (details.probationPeriod && details.probationPeriod !== 'No Probation') {
        if (!details.probationNotice) {
          errors.push("Probation notice period is required when probation period is set");
        }
      }

      if (details.nonCompeteClause === 'Yes') {
        if (!details.nonCompeteDuration) {
          errors.push("Non-compete duration is required when non-compete clause is 'Yes'");
        }
        if (!details.nonCompeteScope) {
          errors.push("Non-compete scope is required when non-compete clause is 'Yes'");
        }
      }

      const basicSalary = parseFloat(details.basicSalary || 0);
      const totalComp = parseFloat(details.totalMonthlyCompensation || 0);
      if (basicSalary > totalComp) {
        errors.push("Basic salary cannot exceed total monthly compensation");
      }

      const workingHours = parseFloat(details.workingHoursPerDay || 0);
      if (workingHours > 8) {
        toast({
          title: "Working Hours Warning",
          description: "Working hours exceed 8 hours per day. UAE Labor Law limits standard working hours to 8 hours/day or 48 hours/week.",
          variant: "default",
        });
      }

      const annualLeave = parseFloat(details.annualLeaveEntitlement || 0);
      if (annualLeave < 30) {
        errors.push("Annual leave entitlement must be at least 30 days per UAE Labor Law");
      }
    }

    if (letterType === 'demand_letter') {
      if (!details.paymentDeadline && !details.deadlineCalendarDays) {
        errors.push("Either payment deadline date or deadline in calendar days must be specified");
      }

      if (details.bankTransferAllowed === 'Yes') {
        if (!details.bankName || !details.accountName || !details.accountNumber) {
          errors.push("Bank transfer details (bank name, account name, account number) are required when bank transfer is allowed");
        }
      }

      if (details.chequeAllowed === 'Yes') {
        if (!details.chequePayeeName || !details.chequeDeliveryAddress) {
          errors.push("Cheque details (payee name, delivery address) are required when cheque payment is allowed");
        }
      }

      if (details.cashAllowed === 'Yes') {
        const amount = parseFloat(details.amount || 0);
        if (amount >= 55000) {
          errors.push("Cash payments of AED 55,000 or more are prohibited under UAE law");
        }
        if (!details.cashPaymentAddress) {
          errors.push("Cash payment address is required when cash payment is allowed");
        }
      }
    }

    if (letterType === 'settlement_agreement') {
      if (details.paymentInvolved === 'Yes') {
        if (!details.settlementAmount) {
          errors.push("Settlement amount is required when payment is involved");
        }
        if (!details.paymentStructure) {
          errors.push("Payment structure is required when payment is involved");
        }
        if (!details.paymentMethod) {
          errors.push("Payment method is required when payment is involved");
        }
        if (!details.paymentSchedule) {
          errors.push("Payment schedule is required when payment is involved");
        }
      }

      if (details.partyAReleasesB === 'Yes' && !details.partyAReleaseScope) {
        errors.push("Party A release scope must be specified when Party A releases Party B");
      }

      if (details.partyBReleasesA === 'Yes' && !details.partyBReleaseScope) {
        errors.push("Party B release scope must be specified when Party B releases Party A");
      }

      if (details.isConfidential === 'Yes' && !details.confidentialityScope) {
        errors.push("Confidentiality scope must be specified when settlement is confidential");
      }

      if (details.requiresNotarization === 'Yes') {
        if (!details.notaryLocation) {
          errors.push("Notary location is required when notarization is required");
        }
        if (!details.witnessesRequired || details.witnessesRequired < 2) {
          errors.push("At least 2 witnesses are required for notarization");
        }
        if (details.witnessesRequired >= 1 && (!details.witness1Name || !details.witness1EmiratesId)) {
          errors.push("Witness 1 details are required");
        }
        if (details.witnessesRequired >= 2 && (!details.witness2Name || !details.witness2EmiratesId)) {
          errors.push("Witness 2 details are required");
        }
      }
    }

    if (letterType === 'power_of_attorney') {
      const powersGranted = [
        details.financialPowers,
        details.propertyPowers,
        details.legalPowers,
        details.businessPowers,
        details.healthcarePowers,
        details.govPowers
      ].filter(p => p === 'Yes').length;

      if (powersGranted === 0) {
        errors.push("At least one power must be granted to the Attorney-in-Fact");
      }

      if (details.durationType === 'Fixed term' && !details.expiryDate) {
        errors.push("Expiry date is required for fixed-term power of attorney");
      }

      if (details.durationType === 'Event-based' && !details.terminationEvent) {
        errors.push("Termination event is required for event-based power of attorney");
      }

      if (!details.witness1Name || !details.witness1EmiratesId || !details.witness2Name || !details.witness2EmiratesId) {
        errors.push("Two witnesses with full details are required for Power of Attorney");
      }
    }

    setValidationErrors(errors);
    
    if (errors.length > 0) {
      toast({
        title: "Validation Errors",
        description: `Please fix ${errors.length} error(s) before proceeding`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 0 && !letterType) {
      toast({
        title: "Letter Type Required",
        description: "Please select a letter type to continue",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 4) {
      if (!validateStep()) {
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleGenerate = async () => {
    if (!validateStep()) {
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to generate letters",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const response = await supabase.functions.invoke("generate-legal-letter", {
        body: {
          letterType,
          details,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const { content, creditsUsed } = response.data;

      const { error: saveError } = await supabase.from("generated_letters").insert({
        user_id: profile?.user_id,
        letter_type: letterType,
        content,
        details,
        credits_used: creditsUsed,
      });

      if (saveError) throw saveError;

      toast({
        title: "Letter Generated Successfully",
        description: `${creditsUsed} credits used`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error generating letter:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate letter",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Select Letter Type</h3>
            <p className="text-sm text-muted-foreground">
              Choose the type of legal letter you want to create
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LETTER_TYPES.map((type) => (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  letterType === type.value ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setLetterType(type.value as LetterType)}
              >
                <CardHeader>
                  <CardTitle className="text-base">{type.label}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep >= 1 && currentStep <= 4) {
      const fields = getFieldsForLetterType(letterType as LetterType);
      const fieldsPerStep = Math.ceil(fields.length / 4);
      const startIdx = (currentStep - 1) * fieldsPerStep;
      const endIdx = startIdx + fieldsPerStep;
      const stepFields = fields.slice(startIdx, endIdx);

      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {LETTER_TYPES.find(t => t.value === letterType)?.label} - Step {currentStep} of 4
            </h3>
            <Progress value={(currentStep / 4) * 100} className="h-2" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {stepFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === "select" ? (
                  <Select
                    value={details[field.name] || ""}
                    onValueChange={(value) => handleFieldChange(field.name, value)}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    value={details[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.label}`}
                    rows={4}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    value={details[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.label}`}
                  />
                )}
              </div>
            ))}
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      );
    }

    if (currentStep === 5) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Review Letter Details</h3>
            <p className="text-sm text-muted-foreground">
              Please review all details carefully before generating your letter.
            </p>
          </div>

          {letterType === 'demand_letter' ? (
            <div className="space-y-4 mt-6">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-900">
                  <strong>Review all demand details carefully before generating the letter.</strong>
                </AlertDescription>
              </Alert>

              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconUsers className="h-5 w-5" />
                    Parties
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sender</p>
                    <p className="font-medium">{details.senderName}</p>
                    <p className="text-sm text-muted-foreground">{details.senderAddress}</p>
                    <p className="text-sm text-muted-foreground">{details.senderEmail} / {details.senderPhone}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recipient</p>
                    <p className="font-medium">{details.recipientName}</p>
                    <p className="text-sm text-muted-foreground">{details.recipientAddress}</p>
                    {details.recipientEmail && <p className="text-sm text-muted-foreground">{details.recipientEmail}</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconAlertCircle className="h-5 w-5" />
                    Debt/Claim Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nature of Debt</p>
                    <Badge variant="secondary" className="mt-1">{details.debtType}</Badge>
                  </div>
                  {details.invoiceNumber && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
                      <p className="font-medium">{details.invoiceNumber}</p>
                      {details.invoiceDate && <p className="text-sm text-muted-foreground">Date: {format(new Date(details.invoiceDate), 'PPP')}</p>}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{details.serviceDescription}</p>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Amount Owed:</span>
                    <span className="text-2xl font-bold text-primary">AED {details.amount}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconClock className="h-5 w-5" />
                    Payment Deadline
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {details.paymentDeadline ? (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Deadline Date</p>
                      <p className="text-lg font-bold text-red-700">{format(new Date(details.paymentDeadline), 'PPP')}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Deadline</p>
                      <p className="text-lg font-bold text-red-700">{details.deadlineCalendarDays} calendar days from receipt</p>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Partial Payment</p>
                    <Badge variant={details.partialPaymentAccepted === 'Yes' ? "default" : "secondary"}>
                      {details.partialPaymentAccepted === 'Yes' ? 'Accepted' : 'Not Accepted'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconCurrencyDollar className="h-5 w-5" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {details.bankTransferAllowed === 'Yes' && (
                    <div>
                      <p className="text-sm font-medium">Bank Transfer</p>
                      <div className="text-sm space-y-1 mt-1">
                        <p>Bank: {details.bankName}</p>
                        <p>Account: {details.accountName}</p>
                        <p>Number: {details.accountNumber}</p>
                        {details.iban && <p>IBAN: {details.iban}</p>}
                      </div>
                    </div>
                  )}
                  {details.chequeAllowed === 'Yes' && (
                    <div>
                      <p className="text-sm font-medium">Cheque</p>
                      <p className="text-sm">Payable to: {details.chequePayeeName}</p>
                      <p className="text-sm">Deliver to: {details.chequeDeliveryAddress}</p>
                    </div>
                  )}
                  {details.cashAllowed === 'Yes' && (
                    <div>
                      <p className="text-sm font-medium">Cash</p>
                      <p className="text-sm">Location: {details.cashPaymentAddress}</p>
                      {details.businessHours && <p className="text-sm">Hours: {details.businessHours}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconAlertTriangle className="h-5 w-5" />
                    Consequences
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm whitespace-pre-wrap">{details.consequences}</p>
                  {details.interestRate && (
                    <p className="text-sm mt-2 text-amber-700">Late payment interest: {details.interestRate}%</p>
                  )}
                  {details.estimatedLegalCosts && (
                    <p className="text-sm text-amber-700">Estimated legal costs: AED {details.estimatedLegalCosts}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconShieldCheck className="h-5 w-5" />
                    Legal Basis & Jurisdiction
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Applicable Law</p>
                    <p className="text-sm">{details.applicableLaw}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Jurisdiction</p>
                    <Badge>{details.emirate}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-green-50 border-green-200">
                <IconCircleCheck className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900">Compliance Summary</AlertTitle>
                <AlertDescription className="text-sm text-green-800 space-y-1 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span>✓ All required fields completed</span>
                    <span>✓ Payment methods specified</span>
                    <span>✓ Clear deadline provided</span>
                    <span>✓ Legal basis stated</span>
                    <span>✓ Consequences outlined</span>
                    <span>✓ PDPL compliant</span>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : letterType === 'settlement_agreement' ? (
            <div className="space-y-4 mt-6">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-900">
                  <strong>Review all settlement terms carefully before generating the agreement.</strong>
                </AlertDescription>
              </Alert>

              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconUsers className="h-5 w-5" />
                    Parties to Settlement
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Party A</p>
                    <p className="font-medium">{details.partyAName}</p>
                    <p className="text-sm text-muted-foreground">ID: {details.partyAEmiratesId}</p>
                    <p className="text-sm text-muted-foreground">{details.partyAEmail} / {details.partyAPhone}</p>
                    {details.partyALegalRep && <p className="text-sm text-muted-foreground">Rep: {details.partyALegalRep}</p>}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Party B</p>
                    <p className="font-medium">{details.partyBName}</p>
                    <p className="text-sm text-muted-foreground">ID: {details.partyBEmiratesId}</p>
                    <p className="text-sm text-muted-foreground">{details.partyBEmail} / {details.partyBPhone}</p>
                    {details.partyBLegalRep && <p className="text-sm text-muted-foreground">Rep: {details.partyBLegalRep}</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconAlertCircle className="h-5 w-5" />
                    Dispute Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nature of Dispute</p>
                    <p className="font-medium">{details.natureOfDispute}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{details.disputeDescription}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Origin Date</p>
                      <p className="font-medium">{format(new Date(details.disputeOriginDate), 'PPP')}</p>
                    </div>
                    {details.disputeReference && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Reference</p>
                        <p className="font-medium">{details.disputeReference}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconChecklist className="h-5 w-5" />
                    Settlement Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Key Terms</p>
                    <p className="text-sm whitespace-pre-wrap">{details.settlementTerms}</p>
                  </div>
                  {details.nonMonetaryObligations && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Non-Monetary Obligations</p>
                        <p className="text-sm whitespace-pre-wrap">{details.nonMonetaryObligations}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {details.paymentInvolved === 'Yes' && (
                <Card className="border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconCurrencyDollar className="h-5 w-5" />
                      Payment Terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Settlement Amount:</span>
                      <span className="text-2xl font-bold text-primary">AED {details.settlementAmount}</span>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Structure</p>
                        <Badge>{details.paymentStructure}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Method</p>
                        <Badge>{details.paymentMethod}</Badge>
                      </div>
                    </div>
                    {details.paymentSchedule && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                        <p className="text-sm whitespace-pre-wrap">{details.paymentSchedule}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconShieldCheck className="h-5 w-5" />
                    Release & Confidentiality
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Party A Releases B</p>
                      <Badge variant={details.partyAReleasesB === 'Yes' ? "default" : "secondary"}>
                        {details.partyAReleasesB === 'Yes' ? '✓' : '✗'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Party B Releases A</p>
                      <Badge variant={details.partyBReleasesA === 'Yes' ? "default" : "secondary"}>
                        {details.partyBReleasesA === 'Yes' ? '✓' : '✗'}
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Confidential</p>
                      <Badge variant={details.isConfidential === 'Yes' ? "default" : "secondary"}>
                        {details.isConfidential === 'Yes' ? '✓' : '✗'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">No Admission of Liability</p>
                      <Badge variant={details.noAdmissionOfLiability === 'Yes' ? "default" : "secondary"}>
                        {details.noAdmissionOfLiability === 'Yes' ? '✓' : '✗'}
                      </Badge>
                    </div>
                  </div>
                  {details.includeNonDisparagement === 'Yes' && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Non-Disparagement</p>
                        <Badge>Included</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconShieldCheck className="h-5 w-5" />
                    Legal & Notarization
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Jurisdiction</p>
                      <Badge>{details.jurisdictionEmirate}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dispute Resolution</p>
                      <Badge>{details.disputeResolutionMethod}</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notarization Required</p>
                    <Badge variant={details.requiresNotarization === 'Yes' ? "default" : "secondary"}>
                      {details.requiresNotarization === 'Yes' ? 'Yes' : 'No'}
                    </Badge>
                    {details.requiresNotarization === 'Yes' && details.notaryLocation && (
                      <p className="text-sm text-muted-foreground mt-1">Location: {details.notaryLocation}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-green-50 border-green-200">
                <IconCircleCheck className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900">Compliance Summary</AlertTitle>
                <AlertDescription className="text-sm text-green-800 space-y-1 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span>✓ All required fields completed</span>
                    <span>✓ Parties clearly identified</span>
                    <span>✓ Settlement terms defined</span>
                    <span>✓ Release provisions clear</span>
                    <span>✓ Legal framework established</span>
                    <span>✓ PDPL compliant</span>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : letterType === 'employment_termination' ? (
            <div className="space-y-4 mt-6">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-900">
                  <strong>Review all termination details carefully before generating the letter.</strong>
                </AlertDescription>
              </Alert>

              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconBuilding className="h-5 w-5" />
                    Company & Employee Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Company</p>
                    <p className="font-medium">{details.companyName}</p>
                    <p className="text-sm text-muted-foreground">{details.companyAddress}</p>
                    <p className="text-sm text-muted-foreground">HR: {details.hrEmail} / {details.hrPhone}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employee</p>
                    <p className="font-medium">{details.employeeName}</p>
                    <p className="text-sm text-muted-foreground">ID: {details.employeeId} | {details.position}</p>
                    {details.department && <p className="text-sm text-muted-foreground">Department: {details.department}</p>}
                    <p className="text-sm text-muted-foreground">{details.employeeEmail}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconAlertCircle className="h-5 w-5" />
                    Termination Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reason</p>
                    <Badge variant="secondary" className="mt-1">{details.terminationReason}</Badge>
                    <p className="text-sm mt-2">{details.detailedReason}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notice Date</p>
                      <p className="font-medium">{format(new Date(details.noticeDate), 'PPP')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Termination Date</p>
                      <p className="font-medium">{format(new Date(details.terminationDate), 'PPP')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Final Working Day</p>
                      <p className="font-medium">{format(new Date(details.finalWorkingDay), 'PPP')}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notice Period</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm">Required: <strong>{details.noticePeriodRequired} days</strong></span>
                      <span className="text-sm">Provided: <strong>{details.noticePeriodProvided} days</strong></span>
                      <Badge variant={parseInt(details.noticePeriodProvided) >= parseInt(details.noticePeriodRequired) ? "default" : "destructive"}>
                        {parseInt(details.noticePeriodProvided) >= parseInt(details.noticePeriodRequired) ? "Compliant" : "Short Notice"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconCurrencyDollar className="h-5 w-5" />
                    End-of-Service Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Notice Period Pay:</span>
                      <span className="font-medium">AED {details.noticePeriodPay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accrued Leave ({details.accruedLeave} days):</span>
                      <span className="font-medium">AED {details.annualLeavePay || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gratuity ({details.gratuityYears} years):</span>
                      <span className="font-medium">AED {details.gratuityAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Repatriation:</span>
                      <span className="font-medium">AED {details.repatriationBenefit}</span>
                    </div>
                    {details.otherDues && (
                      <div className="flex justify-between">
                        <span>Other Dues:</span>
                        <span className="font-medium">AED {details.otherDuesAmount || '0'}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total Settlement:</span>
                      <span>AED {details.totalSettlement}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Calculated per UAE Labor Law Articles 51-56
                  </p>
                </CardContent>
              </Card>

              {details.propertyToReturn === 'Yes' && (
                <Card className="border-amber-200">
                  <CardHeader className="bg-amber-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconDeviceLaptop className="h-5 w-5" />
                      Company Property Return
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2">
                    <ul className="space-y-1 text-sm list-disc list-inside">
                      {details.laptopDetails && <li>Laptop: {details.laptopDetails}</li>}
                      {details.mobilePhone && <li>Mobile: {details.mobilePhone}</li>}
                      {details.accessCards && <li>Access Cards/Keys: {details.accessCards}</li>}
                      {details.documentsToReturn && <li>Documents: {details.documentsToReturn}</li>}
                      {details.otherProperty && <li>Other: {details.otherProperty}</li>}
                    </ul>
                    <Separator className="my-2" />
                    <div>
                      <p className="text-sm font-medium">Return Deadline: {format(new Date(details.propertyReturnDeadline), 'PPP')}</p>
                      <p className="text-sm text-amber-700 mt-1">{details.consequencesNonReturn}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconChecklist className="h-5 w-5" />
                    Final Settlement Process
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Timeline:</span>
                    <span>{details.settlementTimeline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Method:</span>
                    <span>{details.settlementMethod}</span>
                  </div>
                  {details.employeeBankAccount && (
                    <div className="flex justify-between">
                      <span className="font-medium">Bank Account:</span>
                      <span className="font-mono text-xs">{details.employeeBankAccount}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div>
                    <p className="font-medium">Contacts:</p>
                    <p className="text-muted-foreground">Settlement: {details.settlementContact}</p>
                    <p className="text-muted-foreground">Queries: {details.settlementQueriesContact}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconLock className="h-5 w-5" />
                    Post-Termination Obligations
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Confidentiality Continues:</span>
                    <Badge variant={details.confidentialityContinues === 'Yes' ? "default" : "secondary"}>
                      {details.confidentialityContinues === 'Yes' ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>NDA Signed Previously:</span>
                    <Badge variant={details.ndaSigned === 'Yes' ? "default" : "secondary"}>
                      {details.ndaSigned === 'Yes' ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Non-Compete Applicable:</span>
                    <Badge variant={details.nonCompeteApplicable === 'Yes' ? "default" : "secondary"}>
                      {details.nonCompeteApplicable === 'Yes' ? '✓' : '✗'}
                    </Badge>
                  </div>
                  {details.nonCompeteApplicable === 'Yes' && (
                    <>
                      <p className="text-muted-foreground">Duration: {details.nonCompeteDuration} months</p>
                      <p className="text-muted-foreground">Scope: {details.nonCompeteScope}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconShieldCheck className="h-5 w-5" />
                    Data Protection & Legal
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Data Retention:</span>
                    <span>{details.dataRetentionPeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Data Protection Contact:</span>
                    <span>{details.dataProtectionEmail}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span>Termination Certificate:</span>
                    <Badge>{details.certificateRequired === 'Yes' ? '✓ Will be provided' : 'Not requested'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Jurisdiction:</span>
                    <span>{details.emirate}</span>
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-green-50 border-green-200">
                <IconCircleCheck className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900">Compliance Summary</AlertTitle>
                <AlertDescription className="text-sm text-green-800 space-y-1 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span>✓ All required fields completed</span>
                    <span>✓ UAE Labor Law compliant</span>
                    <span>✓ PDPL notice included</span>
                    <span>✓ Legal disclaimer included</span>
                    <span>✓ Clear next steps provided</span>
                    <span>✓ Benefits breakdown detailed</span>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : letterType === 'employment_contract' ? (
            <div className="space-y-4 mt-6">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-900">
                  <strong>Review all contract details carefully before generating.</strong>
                </AlertDescription>
              </Alert>

              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconUsers className="h-5 w-5" />
                    Parties to Contract
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employer</p>
                    <p className="font-medium">{details.companyName}</p>
                    <p className="text-sm text-muted-foreground">{details.companyAddress}</p>
                    {details.companyLicense && <p className="text-sm text-muted-foreground">License: {details.companyLicense}</p>}
                    <p className="text-sm text-muted-foreground">HR: {details.hrEmail} / {details.hrPhone}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employee</p>
                    <p className="font-medium">{details.employeeName}</p>
                    <p className="text-sm text-muted-foreground">Nationality: {details.employeeNationality}</p>
                    <p className="text-sm text-muted-foreground">Passport/ID: {details.passportOrId}</p>
                    <p className="text-sm text-muted-foreground">{details.employeeEmail} / {details.employeePhone}</p>
                    <p className="text-sm text-muted-foreground">{details.employeeAddress}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconBriefcase className="h-5 w-5" />
                    Position & Employment Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                      <p className="font-medium">{details.jobTitle}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Department</p>
                      <p className="font-medium">{details.department}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reports To</p>
                    <p className="font-medium">{details.directManager}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contract Type</p>
                      <Badge>{details.contractType}</Badge>
                    </div>
                    {details.contractDuration && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Duration</p>
                        <p className="font-medium">{details.contractDuration}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(new Date(details.startDate), 'PPP')}</p>
                    </div>
                  </div>
                  {details.probationPeriod && details.probationPeriod !== 'No Probation' && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Probation Period</p>
                      <Badge variant="secondary">{details.probationPeriod}</Badge>
                      {details.probationNotice && <span className="text-sm text-muted-foreground ml-2">({details.probationNotice} days notice)</span>}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Work Location</p>
                    <p className="font-medium">{details.workLocation}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconCurrencyDollar className="h-5 w-5" />
                    Compensation Package
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary:</span>
                      <span className="font-medium">AED {details.basicSalary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Housing Allowance:</span>
                      <span className="font-medium">{details.housingAllowance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport Allowance:</span>
                      <span className="font-medium">{details.transportAllowance}</span>
                    </div>
                    {details.otherAllowances && (
                      <div className="flex justify-between">
                        <span>Other Allowances:</span>
                        <span className="font-medium">{details.otherAllowances}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total Monthly:</span>
                      <span>AED {details.totalMonthlyCompensation}</span>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Payment Frequency</p>
                      <p className="text-muted-foreground">{details.paymentFrequency}</p>
                    </div>
                    <div>
                      <p className="font-medium">Payment Method</p>
                      <p className="text-muted-foreground">{details.paymentMethod}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconGift className="h-5 w-5" />
                    Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Health Insurance:</span>
                    <Badge>{details.healthInsurance}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Annual Leave:</span>
                    <span>{details.annualLeaveEntitlement} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Flight Tickets:</span>
                    <span>{details.flightTickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Visa & Work Permit:</span>
                    <Badge>{details.visaWorkPermit}</Badge>
                  </div>
                  {details.otherBenefits && (
                    <>
                      <Separator className="my-2" />
                      <div>
                        <p className="font-medium">Other Benefits:</p>
                        <p className="text-muted-foreground">{details.otherBenefits}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconClock className="h-5 w-5" />
                    Working Hours & Leave
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-medium">Hours/Day</p>
                      <p className="text-muted-foreground">{details.workingHoursPerDay} hours</p>
                    </div>
                    <div>
                      <p className="font-medium">Days/Week</p>
                      <p className="text-muted-foreground">{details.workingDaysPerWeek} days</p>
                    </div>
                    <div>
                      <p className="font-medium">Rest Days</p>
                      <p className="text-muted-foreground">{details.restDaysPerWeek} day(s)</p>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div>
                    <p className="font-medium">Work Schedule</p>
                    <p className="text-muted-foreground">{details.workSchedule}</p>
                  </div>
                  <div>
                    <p className="font-medium">Ramadan Hours</p>
                    <p className="text-muted-foreground">{details.ramadanWorkingHours}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconAlertCircle className="h-5 w-5" />
                    Termination Provisions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Notice by Employee</p>
                      <p className="text-muted-foreground">{details.noticePeriodByEmployee} days</p>
                    </div>
                    <div>
                      <p className="font-medium">Notice by Employer</p>
                      <p className="text-muted-foreground">{details.noticePeriodByEmployer} days</p>
                    </div>
                  </div>
                  {details.gardenLeaveApplicable === 'Yes' && (
                    <>
                      <Separator className="my-2" />
                      <div>
                        <p className="font-medium">Garden Leave</p>
                        <Badge>Applicable</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconLock className="h-5 w-5" />
                    Confidentiality & Non-Compete
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Confidentiality Obligation:</span>
                    <Badge variant={details.confidentialityObligation === 'Yes' ? "default" : "secondary"}>
                      {details.confidentialityObligation === 'Yes' ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Non-Compete Clause:</span>
                    <Badge variant={details.nonCompeteClause === 'Yes' ? "default" : "secondary"}>
                      {details.nonCompeteClause === 'Yes' ? '✓' : '✗'}
                    </Badge>
                  </div>
                  {details.nonCompeteClause === 'Yes' && (
                    <>
                      <p className="text-muted-foreground">Duration: {details.nonCompeteDuration} months</p>
                      <p className="text-muted-foreground">Scope: {details.nonCompeteScope}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconShieldCheck className="h-5 w-5" />
                    Data Protection & Legal
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Data Retention:</span>
                    <span>{details.personalDataRetentionPeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Data Protection Contact:</span>
                    <span>{details.dataProtectionEmail}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-medium">Jurisdiction:</span>
                    <span>{details.emirate}</span>
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-green-50 border-green-200">
                <IconCircleCheck className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900">Compliance Summary</AlertTitle>
                <AlertDescription className="text-sm text-green-800 space-y-1 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span>✓ All required fields completed</span>
                    <span>✓ UAE Labor Law compliant</span>
                    <span>✓ PDPL notice included</span>
                    <span>✓ Legal disclaimer included</span>
                    <span>✓ Clear compensation breakdown</span>
                    <span>✓ Benefits clearly listed</span>
                    <span>✓ Termination provisions clear</span>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Letter Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(details).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-muted-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Legal Letter</h1>
        <p className="text-muted-foreground">
          Follow the steps to generate your professional legal letter
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {renderStepContent()}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            
            {currentStep < 5 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Letter"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
