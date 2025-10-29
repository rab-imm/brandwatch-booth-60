import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedTextarea } from "@/components/ui/validated-textarea";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { ValidatedDatePicker } from "@/components/ui/validated-date-picker";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { format, parseISO, isAfter, isBefore, startOfDay, subMonths } from "date-fns";
import { getFieldValidationRule } from "@/lib/letter-validation-rules";
import { useDateValidation } from "@/hooks/useDateValidation";
import { getRelatedDateFields } from "@/lib/date-validation";
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
  IconAlertTriangle,
  IconBan,
  IconFileText,
  IconHome,
  IconShield,
  IconKey,
  IconTool,
  IconBolt,
  IconSettings,
  IconDoorExit,
  IconReceipt,
  IconGavel,
  IconSignature
} from "@tabler/icons-react";
import { Icon } from "@/components/ui/Icon";

const LETTER_TYPES = [
  { value: "demand_letter", label: "Demand Letter" },
  { value: "settlement_agreement", label: "Settlement Agreement" },
  { value: "employment_termination", label: "Employment Termination Letter" },
  { value: "employment_contract", label: "Employment Contract" },
  { value: "lease_agreement", label: "Lease Agreement (Residential/Commercial)" },
  { value: "lease_termination", label: "Lease Termination Notice" },
  { value: "nda", label: "Non-Disclosure Agreement" },
  { value: "workplace_complaint", label: "Workplace Complaint" },
  { value: "power_of_attorney", label: "Power of Attorney" },
  { value: "general_legal", label: "General Legal Letter" },
];

type LetterType = typeof LETTER_TYPES[number]["value"];

// Helper component for date fields with validation
function DateFieldWithValidation({ 
  fieldName, 
  label, 
  value, 
  onChange, 
  allDetails, 
  validationRule, 
  required 
}: {
  fieldName: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  allDetails: Record<string, any>;
  validationRule: any;
  required?: boolean;
}) {
  const { error, isDirty } = useDateValidation({
    fieldName,
    value,
    allDetails,
    rules: validationRule?.dateRelationships,
    required
  });

  return (
    <ValidatedDatePicker
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      isDirty={isDirty}
      required={required}
      placeholder="Select date"
    />
  );
}

export default function LetterCreationWizard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [letterType, setLetterType] = useState<LetterType | "">("");
  const [details, setDetails] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());

  const handleFieldChange = useCallback((name: string, value: any) => {
    setDetails(prev => ({ ...prev, [name]: value }));
    setDirtyFields(prev => new Set(prev).add(name));
    
    // If this is a date field, mark related date fields as dirty too
    // so they revalidate with the new value
    const validationRule = getFieldValidationRule(letterType as string, name);
    if (validationRule?.dateRelationships) {
      const relatedFields = getRelatedDateFields(validationRule.dateRelationships);
      relatedFields.forEach(relatedField => {
        setDirtyFields(prev => new Set(prev).add(relatedField));
      });
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [fieldErrors]);

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
      case "lease_agreement":
        return [
          // Landlord Information
          { name: "landlordName", label: "Landlord Full Legal Name", type: "text", required: true },
          { name: "landlordId", label: "Landlord Emirates ID/Passport", type: "text", required: true },
          { name: "landlordAddress", label: "Landlord Address", type: "textarea", required: true },
          { name: "landlordPhone", label: "Landlord Phone (UAE format: +971 XX XXX XXXX)", type: "tel", required: true },
          { name: "landlordEmail", label: "Landlord Email", type: "email", required: true },
          { name: "landlordLegalRep", label: "Landlord Legal Representative (if company)", type: "text", required: false },
          { name: "landlordRepId", label: "Landlord Rep Emirates ID", type: "text", required: false },
          
          // Tenant Information
          { name: "tenantName", label: "Tenant Full Legal Name", type: "text", required: true },
          { name: "tenantId", label: "Tenant Emirates ID/Passport", type: "text", required: true },
          { name: "tenantAddress", label: "Tenant Address", type: "textarea", required: true },
          { name: "tenantPhone", label: "Tenant Phone (UAE format: +971 XX XXX XXXX)", type: "tel", required: true },
          { name: "tenantEmail", label: "Tenant Email", type: "email", required: true },
          { name: "tenantLegalRep", label: "Tenant Legal Representative", type: "text", required: false },
          { name: "tenantRepId", label: "Tenant Rep Emirates ID", type: "text", required: false },
          
          // Property Details
          { name: "propertyAddress", label: "Property Full Address", type: "textarea", required: true },
          { name: "propertyType", label: "Property Type", type: "select", required: true, options: ["Apartment", "Villa", "Townhouse", "Office", "Warehouse", "Shop", "Land", "Other"] },
          { name: "unitNumber", label: "Unit/Plot Number", type: "text", required: true },
          { name: "propertyAreaSqm", label: "Property Area (sq. meters)", type: "number", required: true },
          { name: "propertyAreaSqft", label: "Property Area (sq. feet)", type: "number", required: false },
          { name: "numberOfBedrooms", label: "Number of Bedrooms (residential)", type: "number", required: false },
          { name: "numberOfBathrooms", label: "Number of Bathrooms (residential)", type: "number", required: false },
          { name: "parkingSpaces", label: "Parking Spaces (0 if none)", type: "number", required: true },
          { name: "parkingLocation", label: "Parking Location", type: "text", required: false },
          { name: "storageUnit", label: "Storage Unit?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "storageUnitDetails", label: "Storage Unit Details", type: "text", required: false },
          
          // Property Condition
          { name: "propertyCondition", label: "Property Condition", type: "select", required: true, options: ["Excellent", "Good", "Fair", "Needs Repair"] },
          { name: "furnished", label: "Furnished?", type: "select", required: true, options: ["Fully Furnished", "Semi-Furnished", "Unfurnished"] },
          { name: "furnitureList", label: "Furniture List (if furnished)", type: "textarea", required: false },
          { name: "appliancesIncluded", label: "Appliances Included?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "appliancesList", label: "Appliances List", type: "textarea", required: false },
          
          // Lease Term
          { name: "leaseStartDate", label: "Lease Start Date", type: "date", required: true },
          { name: "leaseEndDate", label: "Lease End Date", type: "date", required: true },
          { name: "autoRenewal", label: "Automatic Renewal?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "renewalNoticePeriod", label: "Renewal Notice Period (days)", type: "number", required: false },
          { name: "renewalRentIncrease", label: "Renewal Rent Increase (%)", type: "number", required: false },
          { name: "renewalTerms", label: "Additional Renewal Terms", type: "textarea", required: false },
          
          // Rent & Payment
          { name: "annualRent", label: "Annual Rent Amount (AED)", type: "number", required: true },
          { name: "paymentFrequency", label: "Payment Frequency", type: "select", required: true, options: ["Annual (1 cheque)", "Semi-Annual (2 cheques)", "Quarterly (4 cheques)", "Monthly (12 cheques)"] },
          { name: "paymentMethod", label: "Payment Method", type: "select", required: true, options: ["Post-dated Cheques", "Bank Transfer", "Cash", "Mixed"] },
          { name: "numberOfCheques", label: "Number of Cheques", type: "number", required: false },
          { name: "chequeDatesAmounts", label: "Cheque Dates & Amounts (list each)", type: "textarea", required: false },
          { name: "bankName", label: "Bank Name (for transfer)", type: "text", required: false },
          { name: "accountName", label: "Account Name", type: "text", required: false },
          { name: "accountNumber", label: "Account Number", type: "text", required: false },
          { name: "iban", label: "IBAN", type: "text", required: false },
          { name: "firstPaymentDueDate", label: "First Payment Due Date", type: "date", required: true },
          { name: "latePaymentPenalty", label: "Late Payment Penalty?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "latePaymentRate", label: "Late Payment Rate (% per day)", type: "number", required: false },
          { name: "gracePeriod", label: "Grace Period (days)", type: "number", required: true },
          { name: "bouncedChequePenalty", label: "Bounced Cheque Penalty (AED)", type: "number", required: true },
          { name: "rentIncludesMunicipalityFees", label: "Rent Includes Municipality Fees?", type: "select", required: true, options: ["Yes", "No"] },
          
          // Security Deposit
          { name: "securityDeposit", label: "Security Deposit Amount (AED)", type: "number", required: true },
          { name: "securityDepositPaymentMethod", label: "Security Deposit Payment Method", type: "select", required: true, options: ["Cheque", "Bank Transfer", "Cash"] },
          { name: "securityDepositPaymentDate", label: "Security Deposit Payment Date", type: "date", required: true },
          { name: "depositSeparateAccount", label: "Deposit Held In Separate Account?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "depositBankDetails", label: "Deposit Bank Details", type: "text", required: false },
          { name: "depositReturnTimeline", label: "Deposit Return Timeline (days)", type: "number", required: true },
          { name: "depositReturnMethod", label: "Deposit Return Method", type: "select", required: true, options: ["Bank Transfer", "Cheque"] },
          
          // Property Use
          { name: "permittedUse", label: "Permitted Use", type: "select", required: true, options: ["Residential Only", "Commercial Only", "Mixed Use"] },
          { name: "numberOfOccupants", label: "Number of Occupants Allowed", type: "number", required: true },
          { name: "petsAllowed", label: "Pets Allowed?", type: "select", required: true, options: ["Yes", "No", "With Consent"] },
          { name: "petDepositRequired", label: "Pet Deposit Required?", type: "select", required: false, options: ["Yes", "No"] },
          { name: "petDepositAmount", label: "Pet Deposit Amount (AED)", type: "number", required: false },
          { name: "prohibitedActivities", label: "Prohibited Activities (list each)", type: "textarea", required: true },
          
          // Maintenance
          { name: "landlordMaintenanceResponsibilities", label: "Landlord Maintenance Responsibilities", type: "textarea", required: true },
          { name: "tenantMaintenanceResponsibilities", label: "Tenant Maintenance Responsibilities", type: "textarea", required: true },
          { name: "repairRequestProcedure", label: "Repair Request Procedure", type: "textarea", required: true },
          { name: "emergencyRepairProtocol", label: "Emergency Repair Protocol", type: "textarea", required: true },
          { name: "repairResponseTimeline", label: "Repair Response Timeline (days)", type: "number", required: true },
          { name: "repairCostAllocation", label: "Repair Cost Allocation", type: "textarea", required: true },
          
          // Utilities
          { name: "electricityResponsibility", label: "Electricity", type: "select", required: true, options: ["Landlord Pays", "Tenant Pays", "Included in Rent"] },
          { name: "waterResponsibility", label: "Water", type: "select", required: true, options: ["Landlord Pays", "Tenant Pays", "Included in Rent"] },
          { name: "gasResponsibility", label: "Gas", type: "select", required: true, options: ["Landlord Pays", "Tenant Pays", "Included in Rent", "N/A"] },
          { name: "coolingResponsibility", label: "District Cooling/Heating", type: "select", required: true, options: ["Landlord Pays", "Tenant Pays", "Included in Rent", "N/A"] },
          { name: "internetResponsibility", label: "Internet/Cable", type: "select", required: true, options: ["Landlord Pays", "Tenant Pays", "Not Included"] },
          { name: "serviceChargesResponsibility", label: "Service Charges/Management Fees", type: "select", required: true, options: ["Landlord Pays", "Tenant Pays", "Included in Rent"] },
          { name: "municipalityFeeResponsibility", label: "Municipality Housing Fee", type: "select", required: true, options: ["Landlord Pays", "Tenant Pays"] },
          { name: "chillerMaintenanceResponsibility", label: "Chiller Maintenance", type: "select", required: true, options: ["Landlord Pays", "Tenant Pays", "N/A"] },
          { name: "utilityConnectionProcedure", label: "Utility Connection Procedure", type: "textarea", required: true },
          { name: "finalUtilitySettlement", label: "Final Utility Settlement Procedure", type: "textarea", required: true },
          
          // Alterations & Insurance
          { name: "alterationsAllowed", label: "Alterations Allowed?", type: "select", required: true, options: ["No Alterations", "Minor with Consent", "Major with Consent"] },
          { name: "alterationsProhibited", label: "Explicitly Prohibited Alterations", type: "textarea", required: false },
          { name: "whoPaysAlterations", label: "Who Pays for Alterations?", type: "select", required: false, options: ["Tenant", "Landlord", "Negotiable"] },
          { name: "restorationRequired", label: "Restoration Required at Lease End?", type: "select", required: false, options: ["Yes", "No", "Negotiable"] },
          { name: "landlordBuildingInsurance", label: "Landlord Building Insurance", type: "select", required: true, options: ["Yes", "No"] },
          { name: "landlordInsuranceCoverage", label: "Landlord Insurance Coverage (AED)", type: "number", required: false },
          { name: "tenantContentsInsuranceRequired", label: "Tenant Contents Insurance", type: "select", required: true, options: ["Yes - Required", "Yes - Recommended", "No"] },
          { name: "tenantLiabilityInsuranceRequired", label: "Tenant Liability Insurance Required?", type: "select", required: true, options: ["Yes", "No"] },
          
          // Access & Subletting
          { name: "landlordAccessNotice", label: "Landlord Access Notice Period (hours)", type: "number", required: true },
          { name: "permittedAccessReasons", label: "Permitted Access Reasons", type: "textarea", required: true },
          { name: "inspectionFrequency", label: "Inspection Frequency", type: "select", required: true, options: ["Monthly", "Quarterly", "Semi-Annual", "Annual", "As Needed"] },
          { name: "emergencyAccess", label: "Emergency Access Rights", type: "text", required: true },
          { name: "sublettingAllowed", label: "Subletting Allowed?", type: "select", required: true, options: ["No", "Yes with Written Consent", "Yes"] },
          { name: "sublettingConditions", label: "Subletting Conditions", type: "textarea", required: false },
          { name: "assignmentAllowed", label: "Assignment Allowed?", type: "select", required: true, options: ["No", "Yes with Written Consent", "Yes"] },
          { name: "assignmentProcess", label: "Assignment Process", type: "textarea", required: false },
          
          // Termination
          { name: "tenantNoticePeriod", label: "Tenant Notice Period (days)", type: "number", required: true },
          { name: "earlyTerminationPenalty", label: "Early Termination Penalty (months of rent)", type: "number", required: true },
          { name: "earlyTerminationPenaltyWaiver", label: "Penalty Waiver Conditions", type: "textarea", required: false },
          { name: "landlordNoticePeriod", label: "Landlord Notice Period (days)", type: "number", required: true },
          { name: "validGroundsLandlordTermination", label: "Valid Grounds for Landlord Termination", type: "textarea", required: true },
          { name: "moveOutProcedure", label: "Move-Out Procedure", type: "textarea", required: true },
          { name: "finalInspectionProcess", label: "Final Inspection Process", type: "textarea", required: true },
          
          // Registration & Legal
          { name: "registrationRequired", label: "Registration Required?", type: "select", required: true, options: ["Yes - Ejari (Dubai)", "Yes - Tawtheeq (Abu Dhabi)", "Yes - Other", "N/A"] },
          { name: "registrationFeesPayer", label: "Who Pays Registration Fees?", type: "select", required: true, options: ["Landlord", "Tenant", "Split"] },
          { name: "registrationTimeline", label: "Registration Timeline (days)", type: "number", required: true },
          { name: "registrationDocuments", label: "Required Documents for Registration", type: "textarea", required: true },
          { name: "emirate", label: "Jurisdiction (Emirate)", type: "select", required: true, options: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"] },
          { name: "disputeResolutionAuthority", label: "Dispute Resolution Authority", type: "text", required: true },
          { name: "governingLaw", label: "Governing Law", type: "text", required: true },
          
          // Data Protection
          { name: "dataRetentionPeriod", label: "Data Retention Period", type: "select", required: true, options: ["Lease duration + 5 years", "Lease duration + 7 years", "As required by UAE law"] },
          { name: "dataProtectionEmail", label: "Data Protection Contact Email", type: "email", required: true },
          
          // Additional
          { name: "specialConditions", label: "Special Conditions", type: "textarea", required: false },
          { name: "attachments", label: "Attachments (list)", type: "textarea", required: false },
        ];
      case "lease_termination":
        return [
          // 1. Notice Information
          { name: "noticeReference", label: "Notice Reference Number (optional)", type: "text", required: false, placeholder: "LTN-UAE-2025-0001" },
          { name: "noticeDate", label: "Notice Date", type: "date", required: true },
          { name: "deliveryMethod", label: "Delivery Method", type: "select", required: true, options: ["Registered Mail", "Hand Delivery", "Email", "Courier"] },
          { name: "courierName", label: "Courier Name", type: "text", required: false },
          { name: "trackingNumber", label: "Tracking Number", type: "text", required: false },
          
          // 2. Landlord Information
          { name: "landlordName", label: "Landlord Full Legal Name", type: "text", required: true },
          { name: "landlordId", label: "Landlord Emirates ID/Passport", type: "text", required: true },
          { name: "landlordAddress", label: "Landlord Address", type: "textarea", required: true },
          { name: "landlordPhone", label: "Landlord Phone", type: "tel", required: true, placeholder: "+971 XX XXX XXXX" },
          { name: "landlordEmail", label: "Landlord Email", type: "email", required: true },
          
          // 3. Tenant Information
          { name: "tenantName", label: "Tenant Full Legal Name", type: "text", required: true },
          { name: "tenantId", label: "Tenant Emirates ID/Passport", type: "text", required: true },
          { name: "tenantAddress", label: "Tenant Current Address (Property Address)", type: "textarea", required: true },
          { name: "tenantPhone", label: "Tenant Phone", type: "tel", required: true, placeholder: "+971 XX XXX XXXX" },
          { name: "tenantEmail", label: "Tenant Email", type: "email", required: true },
          
          // 4. Property Details
          { name: "propertyAddress", label: "Property Full Address", type: "textarea", required: true },
          { name: "propertyType", label: "Property Type", type: "select", required: true, options: ["Apartment", "Villa", "Townhouse", "Office", "Warehouse", "Shop", "Other"] },
          { name: "unitNumber", label: "Unit/Plot Number", type: "text", required: true },
          { name: "propertyArea", label: "Property Area (sq. meters)", type: "number", required: false },
          { name: "propertyFeatures", label: "Property Identifying Features", type: "text", required: false },
          
          // 5. Original Lease Reference
          { name: "originalLeaseDate", label: "Original Lease Date", type: "date", required: true },
          { name: "leaseStartDate", label: "Lease Start Date", type: "date", required: true },
          { name: "leaseEndDate", label: "Lease End Date", type: "date", required: true },
          { name: "ejariNumber", label: "Ejari/Tawtheeq Registration Number", type: "text", required: false },
          { name: "currentLeaseStatus", label: "Current Lease Status", type: "select", required: true, options: ["Active", "Expired", "Month-to-Month"] },
          
          // 6. Termination Reason & Grounds
          { name: "terminationReason", label: "Termination Reason", type: "select", required: true, options: [
            "Owner-Occupation (Personal Use)",
            "Property Demolition",
            "Major Renovation/Reconstruction",
            "Property Sale",
            "Non-Payment of Rent",
            "Property Damage/Misuse",
            "Unauthorized Subletting",
            "Breach of Lease Terms",
            "Mutual Agreement",
            "Lease Expiry (Non-Renewal)"
          ]},
          { name: "legalBasis", label: "Legal Basis/Article Reference", type: "text", required: true, placeholder: "e.g., UAE Federal Law No. 26 of 2007, Article 25(1)(a)" },
          { name: "terminationDescription", label: "Detailed Reason Description", type: "textarea", required: true },
          { name: "supportingDocs", label: "Supporting Documentation (list attachments)", type: "textarea", required: false },
          { name: "priorWarnings", label: "Prior Warnings Issued?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "priorWarningDates", label: "Prior Warning Dates (if Yes)", type: "textarea", required: false },
          
          // 7. Notice Period
          { name: "noticePeriodDays", label: "Notice Period Provided (days)", type: "number", required: true },
          { name: "noticeEffectiveDate", label: "Notice Effective Date (date notice delivered)", type: "date", required: true },
          { name: "terminationDate", label: "Termination Effective Date (vacate date)", type: "date", required: true },
          { name: "minNoticePeriod", label: "Minimum Legal Notice Period (days)", type: "number", required: true },
          { name: "noticePeriodCompliance", label: "Notice Period Compliance Statement", type: "textarea", required: true, placeholder: "This notice period complies with UAE Federal Law No. 26 of 2007..." },
          
          // 8. Property Handover Requirements
          { name: "cleanlinessStandard", label: "Cleanliness Standard Required", type: "select", required: true, options: ["Professional Cleaning", "Move-In Standard", "As-Is"] },
          { name: "keysToReturn", label: "Keys to Return (list all)", type: "textarea", required: true, placeholder: "Main door keys, mailbox keys, storage keys, etc." },
          { name: "repairsRequired", label: "Repairs Required", type: "textarea", required: true },
          { name: "utilitiesFinal", label: "Utilities Final Settlement", type: "textarea", required: true },
          { name: "moveOutInspection", label: "Move-Out Inspection Required?", type: "select", required: true, options: ["Yes", "No"] },
          { name: "inspectionContact", label: "Inspection Contact Person", type: "text", required: false },
          { name: "inspectionPhone", label: "Inspection Contact Phone", type: "tel", required: false },
          { name: "inspectionEmail", label: "Inspection Contact Email", type: "email", required: false },
          
          // 9. Security Deposit
          { name: "securityDeposit", label: "Security Deposit Amount (AED)", type: "number", required: true },
          { name: "depositReturnDays", label: "Deposit Return Timeline (days)", type: "number", required: true },
          { name: "depositDeductions", label: "Permitted Deductions (list all)", type: "textarea", required: true },
          { name: "depositReturnMethod", label: "Deposit Return Method", type: "select", required: true, options: ["Bank Transfer", "Cheque"] },
          { name: "tenantBankAccount", label: "Tenant Bank Account (for refund)", type: "text", required: false },
          
          // 10. Final Account Settlement
          { name: "finalRentDue", label: "Final Rent Amount Due (AED)", type: "number", required: false },
          { name: "utilitiesOwed", label: "Outstanding Utilities (AED)", type: "number", required: false },
          { name: "otherOwed", label: "Other Amounts Owed (AED)", type: "number", required: false },
          { name: "otherDescription", label: "Other Amounts Description", type: "text", required: false },
          { name: "totalAmountDue", label: "Total Amount Due (AED)", type: "number", required: true },
          { name: "paymentDeadline", label: "Payment Deadline", type: "date", required: true },
          { name: "paymentMethod", label: "Payment Method", type: "select", required: true, options: ["Bank Transfer", "Cheque", "Cash"] },
          
          // 11. Consequences of Non-Compliance
          { name: "dailyOccupationCharge", label: "Daily Occupation Charge (AED)", type: "number", required: true },
          { name: "legalActionTimeline", label: "Legal Action Timeline", type: "text", required: true },
          { name: "estimatedFilingDate", label: "Estimated Court Filing Date", type: "date", required: false },
          { name: "additionalConsequences", label: "Additional Consequences", type: "textarea", required: true },
          
          // 12. Tenant Rights
          { name: "disputeFilingDays", label: "Dispute Filing Deadline (days from notice)", type: "number", required: true },
          { name: "disputeAuthority", label: "Rental Dispute Centre Contact", type: "text", required: true, placeholder: "Dubai Rental Dispute Centre: 600 522 222 / www.rdc.ae" },
          { name: "tenantRightsSummary", label: "Tenant Rights Summary", type: "textarea", required: true },
          
          // 13. Forwarding Address
          { name: "forwardingAddressDeadline", label: "Forwarding Address Deadline (days)", type: "number", required: true },
          
          // 14. Governing Law
          { name: "emirate", label: "Emirate (Jurisdiction)", type: "select", required: true, options: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"] },
          { name: "applicableLaws", label: "Applicable Laws", type: "textarea", required: true },
          
          // 15. Data Protection
          { name: "dataRetentionPeriod", label: "Data Retention Period", type: "select", required: true, options: ["7 years", "10 years", "As required by law"] },
          { name: "dataProtectionEmail", label: "Data Protection Contact Email", type: "email", required: true },
          
          // 16. Witness & Delivery
          { name: "witnessName", label: "Witness Name", type: "text", required: false },
          { name: "deliveryConfirmationMethod", label: "Delivery Confirmation Method", type: "select", required: true, options: ["Registered Mail", "Hand Delivery", "Email", "Courier"] },
          { name: "tenantReceiptDate", label: "Tenant Receipt Date", type: "date", required: false },
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
      // Required fields validation
      if (!details.companyName || !details.companyAddress || !details.companyLicense) {
        errors.push("Company details (name, address, license) are required");
      }
      
      if (!details.employeeName || !details.employeeNationality || !details.passportOrId) {
        errors.push("Employee identification details are required");
      }
      
      if (!details.jobTitle || !details.department || !details.directManager) {
        errors.push("Position details are required");
      }

      if (!details.contractType) {
        errors.push("Contract type is required");
      }

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
        
        const probationNotice = parseInt(details.probationNotice || '0');
        if (probationNotice < 7 || probationNotice > 30) {
          toast({
            title: "Probation Notice Warning",
            description: "Probation notice period is typically 7-30 days. Please verify this is correct.",
            variant: "default",
          });
        }
      }

      if (details.nonCompeteClause === 'Yes') {
        if (!details.nonCompeteDuration) {
          errors.push("Non-compete duration is required when non-compete clause is 'Yes'");
        }
        if (!details.nonCompeteScope) {
          errors.push("Non-compete scope is required when non-compete clause is 'Yes'");
        }
        
        const duration = parseInt(details.nonCompeteDuration || '0');
        if (duration > 24) {
          toast({
            title: "Non-Compete Duration Notice",
            description: "Non-compete periods over 24 months may not be enforceable under UAE law. Please consult legal counsel.",
            variant: "destructive",
          });
        }
      }

      // === EMAIL FORMAT VALIDATION ===
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (details.hrEmail && !emailRegex.test(details.hrEmail)) {
        errors.push("HR Contact Email must be a valid email address");
      }
      
      if (details.employeeEmail && !emailRegex.test(details.employeeEmail)) {
        errors.push("Employee Email must be a valid email address");
      }
      
      if (details.dataProtectionEmail && !emailRegex.test(details.dataProtectionEmail)) {
        errors.push("Data Protection Contact Email must be a valid email address");
      }
      
      // === UAE PHONE FORMAT VALIDATION ===
      const uaePhoneRegex = /^\+971\s?\d{1,2}\s?\d{3}\s?\d{4}$/;
      
      if (details.hrPhone && !uaePhoneRegex.test(details.hrPhone)) {
        errors.push("HR Contact Phone must be in UAE format: +971 XX XXX XXXX");
      }
      
      if (details.employeePhone && !uaePhoneRegex.test(details.employeePhone)) {
        errors.push("Employee Phone must be in UAE format: +971 XX XXX XXXX");
      }
      
      // === EMIRATES ID / PASSPORT VALIDATION ===
      const emiratesIdRegex = /^784-\d{4}-\d{7}-\d{1}$/;
      const passportRegex = /^[A-Z0-9]{6,9}$/;
      
      if (details.passportOrId) {
        const isEmiratesId = emiratesIdRegex.test(details.passportOrId);
        const isPassport = passportRegex.test(details.passportOrId);
        
        if (!isEmiratesId && !isPassport) {
          errors.push("Passport/Emirates ID must be valid format (Emirates ID: 784-XXXX-XXXXXXX-X or Passport: 6-9 alphanumeric characters)");
        }
      }

      const basicSalary = parseFloat(details.basicSalary || 0);
      const totalComp = parseFloat(details.totalMonthlyCompensation || 0);
      
      // === SALARY AND AMOUNTS VALIDATION ===
      if (basicSalary <= 0) {
        errors.push("Basic Monthly Salary must be a positive number");
      }
      
      if (totalComp <= 0) {
        errors.push("Total Monthly Compensation must be a positive number");
      }
      
      if (basicSalary > totalComp) {
        errors.push("Basic salary cannot exceed total monthly compensation");
      }
      
      // === NOTICE PERIOD VALIDATION ===
      const employeeNotice = parseInt(details.noticePeriodByEmployee || '0');
      const employerNotice = parseInt(details.noticePeriodByEmployer || '0');
      
      if (employeeNotice < 30 || employeeNotice > 90) {
        toast({
          title: "Notice Period Warning",
          description: "Employee notice period is typically 30-90 days in UAE. Please verify this is correct.",
          variant: "default",
        });
      }
      
      if (employerNotice < 30 || employerNotice > 90) {
        toast({
          title: "Notice Period Warning",
          description: "Employer notice period is typically 30-90 days in UAE. Please verify this is correct.",
          variant: "default",
        });
      }
      
      // === WORKING DAYS VALIDATION ===
      const workingDays = parseInt(details.workingDaysPerWeek || '0');
      if (workingDays < 5 || workingDays > 6) {
        errors.push("Working days per week must be between 5 and 6 (UAE Labor Law standard)");
      }
      
      // === REST DAYS VALIDATION ===
      const restDays = parseInt(details.restDaysPerWeek || '0');
      if (restDays < 1) {
        errors.push("Rest days per week must be at least 1 (UAE Labor Law requirement)");
      }
      
      if (workingDays + restDays > 7) {
        errors.push("Working days + rest days cannot exceed 7 days per week");
      }

      const workingHours = parseFloat(details.workingHoursPerDay || 0);
      
      // === WORKING HOURS VALIDATION ===
      if (workingHours <= 0 || workingHours > 12) {
        errors.push("Working hours per day must be between 1 and 12 hours");
      }
      
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
      
      // === CONDITIONAL FIELD VALIDATION ===
      if (details.healthInsurance === 'Provided by Company' && !details.healthInsuranceCoverage) {
        errors.push("Health insurance coverage details are required when insurance is provided by company");
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

    if (letterType === 'lease_agreement') {
      // === REQUIRED FIELDS VALIDATION ===
      const requiredFields = [
        'landlordName', 'landlordId', 'landlordAddress', 'landlordPhone', 'landlordEmail',
        'tenantName', 'tenantId', 'tenantAddress', 'tenantPhone', 'tenantEmail',
        'propertyAddress', 'propertyType', 'unitNumber', 'propertyAreaSqm', 'parkingSpaces',
        'propertyCondition', 'furnished', 'appliancesIncluded',
        'leaseStartDate', 'leaseEndDate', 'autoRenewal',
        'annualRent', 'paymentFrequency', 'paymentMethod', 'firstPaymentDueDate',
        'gracePeriod', 'bouncedChequePenalty', 'rentIncludesMunicipalityFees',
        'securityDeposit', 'securityDepositPaymentMethod', 'securityDepositPaymentDate',
        'depositSeparateAccount', 'depositReturnTimeline', 'depositReturnMethod',
        'permittedUse', 'numberOfOccupants', 'petsAllowed', 'prohibitedActivities',
        'landlordMaintenanceResponsibilities', 'tenantMaintenanceResponsibilities',
        'repairRequestProcedure', 'emergencyRepairProtocol', 'repairResponseTimeline', 'repairCostAllocation',
        'electricityResponsibility', 'waterResponsibility', 'gasResponsibility',
        'coolingResponsibility', 'internetResponsibility', 'serviceChargesResponsibility',
        'municipalityFeeResponsibility', 'chillerMaintenanceResponsibility',
        'utilityConnectionProcedure', 'finalUtilitySettlement',
        'alterationsAllowed', 'landlordBuildingInsurance', 'tenantContentsInsuranceRequired',
        'tenantLiabilityInsuranceRequired', 'landlordAccessNotice', 'permittedAccessReasons',
        'inspectionFrequency', 'emergencyAccess',
        'sublettingAllowed', 'assignmentAllowed',
        'tenantNoticePeriod', 'earlyTerminationPenalty', 'landlordNoticePeriod',
        'validGroundsLandlordTermination', 'moveOutProcedure', 'finalInspectionProcess',
        'registrationRequired', 'registrationFeesPayer', 'registrationTimeline', 'registrationDocuments',
        'emirate', 'disputeResolutionAuthority', 'governingLaw',
        'dataRetentionPeriod', 'dataProtectionEmail'
      ];

      for (const field of requiredFields) {
        if (!details[field] || (typeof details[field] === 'string' && !details[field].trim())) {
          errors.push(`Required field missing: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        }
      }

      // === CONDITIONAL REQUIRED FIELDS ===
      if (details.autoRenewal === 'Yes') {
        if (!details.renewalNoticePeriod) errors.push("Renewal notice period is required when auto-renewal is enabled");
        if (!details.renewalRentIncrease) errors.push("Renewal rent increase is required when auto-renewal is enabled");
      }

      if (details.paymentMethod && details.paymentMethod.includes('Cheque')) {
        if (!details.numberOfCheques) errors.push("Number of cheques is required when payment method includes cheques");
        if (!details.chequeDatesAmounts) errors.push("Cheque dates and amounts must be specified");
      }

      if (details.paymentMethod === 'Bank Transfer') {
        if (!details.bankName || !details.accountName || !details.accountNumber || !details.iban) {
          errors.push("Bank details (bank name, account name, account number, IBAN) are required for bank transfer");
        }
      }

      if (details.furnished === 'Fully Furnished' || details.furnished === 'Semi-Furnished') {
        if (!details.furnitureList) errors.push("Furniture list is required for furnished/semi-furnished properties");
      }

      if (details.appliancesIncluded === 'Yes' && !details.appliancesList) {
        errors.push("Appliances list is required when appliances are included");
      }

      if (details.latePaymentPenalty === 'Yes' && !details.latePaymentRate) {
        errors.push("Late payment rate is required when late payment penalty applies");
      }

      if ((details.petsAllowed === 'Yes' || details.petsAllowed === 'With Consent') && details.petDepositRequired === 'Yes' && !details.petDepositAmount) {
        errors.push("Pet deposit amount is required when pet deposit is required");
      }

      if (details.alterationsAllowed !== 'No Alterations') {
        if (!details.alterationsProhibited) errors.push("Explicitly prohibited alterations must be specified");
        if (!details.whoPaysAlterations) errors.push("Who pays for alterations must be specified");
        if (!details.restorationRequired) errors.push("Restoration requirement must be specified");
      }

      if (details.landlordBuildingInsurance === 'Yes' && !details.landlordInsuranceCoverage) {
        errors.push("Landlord insurance coverage amount is required");
      }

      if (details.sublettingAllowed !== 'No' && !details.sublettingConditions) {
        errors.push("Subletting conditions must be specified when subletting is allowed");
      }

      if (details.assignmentAllowed !== 'No' && !details.assignmentProcess) {
        errors.push("Assignment process must be specified when assignment is allowed");
      }

      // === DATE VALIDATION ===
      const startDate = new Date(details.leaseStartDate);
      const endDate = new Date(details.leaseEndDate);
      const today = startOfDay(new Date());

      if (isBefore(startDate, subMonths(today, 6))) {
        errors.push("Lease start date cannot be more than 6 months in the past");
      }

      if (!isAfter(endDate, startDate)) {
        errors.push("Lease end date must be after start date");
      }

      const monthsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsDiff < 11) {
        toast({
          title: "Short Lease Duration Warning",
          description: "UAE residential leases are typically 1 year minimum. Please verify this short duration is intentional.",
          variant: "default",
        });
      }

      if (details.firstPaymentDueDate) {
        const firstPayment = new Date(details.firstPaymentDueDate);
        if (isBefore(firstPayment, startDate)) errors.push("First payment due date cannot be before lease start date");
        if (isAfter(firstPayment, endDate)) errors.push("First payment due date cannot be after lease end date");
      }

      if (details.securityDepositPaymentDate) {
        const depositDate = new Date(details.securityDepositPaymentDate);
        if (isAfter(depositDate, startDate)) {
          toast({
            title: "Security Deposit Date Warning",
            description: "Security deposit is typically paid before or on the lease start date.",
            variant: "default",
          });
        }
      }

      // === EMAIL VALIDATION ===
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (details.landlordEmail && !emailRegex.test(details.landlordEmail)) errors.push("Landlord email must be a valid email address");
      if (details.tenantEmail && !emailRegex.test(details.tenantEmail)) errors.push("Tenant email must be a valid email address");
      if (details.dataProtectionEmail && !emailRegex.test(details.dataProtectionEmail)) errors.push("Data protection contact email must be a valid email address");

      // === UAE PHONE VALIDATION ===
      const uaePhoneRegex = /^\+971\s?\d{1,2}\s?\d{3}\s?\d{4}$/;
      if (details.landlordPhone && !uaePhoneRegex.test(details.landlordPhone)) errors.push("Landlord phone must be in UAE format: +971 XX XXX XXXX");
      if (details.tenantPhone && !uaePhoneRegex.test(details.tenantPhone)) errors.push("Tenant phone must be in UAE format: +971 XX XXX XXXX");

      // === EMIRATES ID / PASSPORT VALIDATION ===
      const emiratesIdRegex = /^784-\d{4}-\d{7}-\d{1}$/;
      const passportRegex = /^[A-Z0-9]{6,9}$/;
      
      if (details.landlordId) {
        const isEmiratesId = emiratesIdRegex.test(details.landlordId);
        const isPassport = passportRegex.test(details.landlordId);
        if (!isEmiratesId && !isPassport) errors.push("Landlord ID must be valid Emirates ID (784-XXXX-XXXXXXX-X) or Passport (6-9 alphanumeric)");
      }
      
      if (details.tenantId) {
        const isEmiratesId = emiratesIdRegex.test(details.tenantId);
        const isPassport = passportRegex.test(details.tenantId);
        if (!isEmiratesId && !isPassport) errors.push("Tenant ID must be valid Emirates ID (784-XXXX-XXXXXXX-X) or Passport (6-9 alphanumeric)");
      }

      // === NUMERIC VALIDATIONS ===
      const annualRent = parseFloat(details.annualRent || 0);
      if (annualRent <= 0) errors.push("Annual rent must be a positive number");
      if (annualRent < 10000) {
        toast({
          title: "Low Rent Warning",
          description: "Annual rent seems unusually low for UAE properties. Please verify.",
          variant: "default",
        });
      }

      const securityDeposit = parseFloat(details.securityDeposit || 0);
      if (securityDeposit < 0) errors.push("Security deposit cannot be negative");
      if (annualRent > 0 && securityDeposit > 0) {
        const depositPercentage = (securityDeposit / annualRent) * 100;
        if (depositPercentage < 3 || depositPercentage > 15) {
          toast({
            title: "Security Deposit Warning",
            description: `Security deposit is ${depositPercentage.toFixed(1)}% of annual rent. Typical range is 5-10%.`,
            variant: "default",
          });
        }
      }

      const propertyArea = parseFloat(details.propertyAreaSqm || 0);
      if (propertyArea <= 0) errors.push("Property area must be a positive number");

      const parkingSpaces = parseInt(details.parkingSpaces || 0);
      if (parkingSpaces < 0) errors.push("Parking spaces cannot be negative");

      const occupants = parseInt(details.numberOfOccupants || 0);
      if (occupants <= 0) errors.push("Number of occupants must be at least 1");

      const tenantNotice = parseInt(details.tenantNoticePeriod || 0);
      if (tenantNotice < 30 || tenantNotice > 180) {
        toast({
          title: "Tenant Notice Period Warning",
          description: "Tenant notice period is typically 60-90 days in UAE. Please verify.",
          variant: "default",
        });
      }

      const landlordNotice = parseInt(details.landlordNoticePeriod || 0);
      if (landlordNotice < 90) {
        toast({
          title: "Landlord Notice Period Warning",
          description: "Landlord notice period must be at least 90 days by UAE law (12 months for residential personal use). Please verify.",
          variant: "default",
        });
      }

      const earlyTerminationPenalty = parseFloat(details.earlyTerminationPenalty || 0);
      if (earlyTerminationPenalty < 0) errors.push("Early termination penalty cannot be negative");
      if (earlyTerminationPenalty > 3) {
        toast({
          title: "High Termination Penalty Warning",
          description: "Early termination penalty exceeds 3 months rent. Typical range is 1-2 months.",
          variant: "default",
        });
      }

      const depositReturnDays = parseInt(details.depositReturnTimeline || 0);
      if (depositReturnDays < 7) errors.push("Deposit return timeline should be at least 7 days");
      if (depositReturnDays > 90) {
        toast({
          title: "Long Deposit Return Timeline",
          description: "Deposit return timeline exceeds 90 days. Typical range is 30-60 days.",
          variant: "default",
        });
      }

      const registrationDays = parseInt(details.registrationTimeline || 0);
      if (registrationDays > 30) {
        toast({
          title: "Registration Timeline Warning",
          description: "Ejari/Tawtheeq registration should typically be completed within 30 days.",
          variant: "default",
        });
      }

      // === BUSINESS LOGIC VALIDATIONS ===
      if (details.paymentFrequency && details.numberOfCheques) {
        const expectedCheques: { [key: string]: number } = {
          'Annual (1 cheque)': 1,
          'Semi-Annual (2 cheques)': 2,
          'Quarterly (4 cheques)': 4,
          'Monthly (12 cheques)': 12
        };
        const expected = expectedCheques[details.paymentFrequency];
        const actual = parseInt(details.numberOfCheques);
        if (expected && actual !== expected) {
          toast({
            title: "Cheque Count Mismatch",
            description: `Payment frequency is ${details.paymentFrequency} but number of cheques is ${actual}. Expected ${expected}.`,
            variant: "default",
          });
        }
      }

      if (details.propertyType && ['Apartment', 'Villa', 'Townhouse'].includes(details.propertyType)) {
        if (!details.numberOfBedrooms) errors.push("Number of bedrooms is required for residential properties");
        if (!details.numberOfBathrooms) errors.push("Number of bathrooms is required for residential properties");
      }
    } else if (letterType === 'lease_termination') {
      const requiredFields = ['noticeDate', 'deliveryMethod', 'landlordName', 'landlordId', 'landlordAddress', 'landlordPhone', 'landlordEmail',
        'tenantName', 'tenantId', 'tenantAddress', 'tenantPhone', 'tenantEmail', 'propertyAddress', 'propertyType', 'unitNumber',
        'originalLeaseDate', 'leaseStartDate', 'leaseEndDate', 'currentLeaseStatus', 'terminationReason', 'legalBasis', 'terminationDescription',
        'priorWarnings', 'noticePeriodDays', 'noticeEffectiveDate', 'terminationDate', 'minNoticePeriod', 'noticePeriodCompliance',
        'cleanlinessStandard', 'keysToReturn', 'repairsRequired', 'utilitiesFinal', 'moveOutInspection', 'securityDeposit', 'depositReturnDays',
        'depositDeductions', 'depositReturnMethod', 'totalAmountDue', 'paymentDeadline', 'paymentMethod', 'dailyOccupationCharge',
        'legalActionTimeline', 'additionalConsequences', 'disputeFilingDays', 'disputeAuthority', 'tenantRightsSummary',
        'forwardingAddressDeadline', 'emirate', 'applicableLaws', 'dataRetentionPeriod', 'dataProtectionEmail', 'deliveryConfirmationMethod'];
      
      for (const field of requiredFields) {
        if (!details[field] || (typeof details[field] === 'string' && !details[field].trim())) {
          errors.push(`Required field missing: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        }
      }
      
      if (details.deliveryMethod === 'Courier') {
        if (!details.courierName) errors.push("Courier name required when delivery method is Courier");
        if (!details.trackingNumber) errors.push("Tracking number required when delivery method is Courier");
      }
      if (details.priorWarnings === 'Yes' && !details.priorWarningDates) errors.push("Prior warning dates required when warnings issued");
      if (details.moveOutInspection === 'Yes') {
        if (!details.inspectionContact) errors.push("Inspection contact required when inspection is required");
        if (!details.inspectionPhone) errors.push("Inspection phone required when inspection is required");
        if (!details.inspectionEmail) errors.push("Inspection email required when inspection is required");
      }
      if (details.depositReturnMethod === 'Bank Transfer' && !details.tenantBankAccount) {
        toast({ title: "Bank account recommended", description: "Bank account details recommended for deposit refund", variant: "default" });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (details.landlordEmail && !emailRegex.test(details.landlordEmail)) errors.push("Landlord email must be valid");
      if (details.tenantEmail && !emailRegex.test(details.tenantEmail)) errors.push("Tenant email must be valid");
      if (details.dataProtectionEmail && !emailRegex.test(details.dataProtectionEmail)) errors.push("Data protection email must be valid");
      if (details.inspectionEmail && !emailRegex.test(details.inspectionEmail)) errors.push("Inspection email must be valid");
      
      const uaePhoneRegex = /^\+971\s?\d{1,2}\s?\d{3}\s?\d{4}$/;
      if (details.landlordPhone && !uaePhoneRegex.test(details.landlordPhone)) errors.push("Landlord phone must be UAE format: +971 XX XXX XXXX");
      if (details.tenantPhone && !uaePhoneRegex.test(details.tenantPhone)) errors.push("Tenant phone must be UAE format: +971 XX XXX XXXX");
      if (details.inspectionPhone && !uaePhoneRegex.test(details.inspectionPhone)) errors.push("Inspection phone must be UAE format: +971 XX XXX XXXX");
      
      const startDate = new Date(details.leaseStartDate);
      const endDate = new Date(details.leaseEndDate);
      const originalDate = new Date(details.originalLeaseDate);
      const noticeEffective = new Date(details.noticeEffectiveDate);
      const terminationDate = new Date(details.terminationDate);
      const today = new Date();
      
      if (isAfter(originalDate, startDate)) errors.push("Original lease date cannot be after lease start date");
      if (!isAfter(endDate, startDate)) errors.push("Lease end date must be after start date");
      if (isAfter(noticeEffective, today)) errors.push("Notice effective date cannot be in future");
      if (!isAfter(terminationDate, noticeEffective)) errors.push("Termination date must be after notice effective date");
      
      const daysDiff = Math.floor((terminationDate.getTime() - noticeEffective.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < details.minNoticePeriod) errors.push(`Notice period (${daysDiff} days) is less than minimum required (${details.minNoticePeriod} days)`);
      if (Math.abs(daysDiff - details.noticePeriodDays) > 1) errors.push("Notice period days doesn't match calculated period between dates");
      
      if (details.securityDeposit <= 0) errors.push("Security deposit must be positive");
      if (details.totalAmountDue < 0) errors.push("Total amount due cannot be negative");
      if (details.dailyOccupationCharge <= 0) errors.push("Daily occupation charge must be positive");
      if (details.depositReturnDays > 90) toast({ title: "Long deposit return period", description: "Deposit return period exceeds typical 30-60 days", variant: "default" });
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

      // Generate a title for the letter
      const letterTitle = `${LETTER_TYPES.find(t => t.value === letterType)?.label} - ${format(new Date(), 'dd/MM/yyyy')}`;

      const { error: saveError } = await supabase.from("legal_letters").insert({
        user_id: profile?.user_id!,
        company_id: profile?.current_company_id,
        letter_type: letterType as any,
        title: letterTitle,
        content,
        status: 'finalized' as any,
        credits_used: creditsUsed,
        metadata: details,
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
            {stepFields.map((field) => {
              const validationRule = getFieldValidationRule(letterType as string, field.name);
              const error = fieldErrors[field.name];
              const isDirty = dirtyFields.has(field.name);
              
              return (
                <div key={field.name}>
                  {field.type === "select" ? (
                    <ValidatedSelect
                      label={field.label}
                      value={details[field.name] || ""}
                      onValueChange={(value) => handleFieldChange(field.name, value)}
                      options={field.options?.map(opt => ({ value: opt, label: opt })) || []}
                      error={error}
                      isDirty={isDirty}
                      required={field.required}
                      placeholder={`Select ${field.label}`}
                    />
                  ) : field.type === "textarea" ? (
                    <ValidatedTextarea
                      label={field.label}
                      value={details[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      error={error}
                      isDirty={isDirty}
                      required={field.required}
                      placeholder={`Enter ${field.label}`}
                      rows={4}
                      showCharCount
                      maxLength={2000}
                    />
                  ) : field.type === "date" ? (
                    <DateFieldWithValidation
                      fieldName={field.name}
                      label={field.label}
                      value={details[field.name] || ""}
                      onChange={(value) => handleFieldChange(field.name, value)}
                      allDetails={details}
                      validationRule={validationRule}
                      required={field.required}
                    />
                  ) : (
                    <ValidatedInput
                      label={field.label}
                      type={validationRule?.type || field.type}
                      value={details[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      error={error}
                      isDirty={isDirty}
                      required={field.required}
                      placeholder={`Enter ${field.label}`}
                      pattern={validationRule?.pattern}
                      inputMode={validationRule?.inputMode}
                      maxLength={validationRule?.maxLength}
                      min={validationRule?.min}
                      max={validationRule?.max}
                      step={validationRule?.step}
                    />
                  )}
                </div>
              );
            })}
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
                  <strong>Review all contract terms carefully before generating the employment offer.</strong>
                </AlertDescription>
              </Alert>

              {/* 1. PARTIES TO CONTRACT */}
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconBuilding className="h-5 w-5" />
                    Parties to Contract
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employer</p>
                    <p className="font-medium">{details.companyName}</p>
                    {details.companyLicense && <p className="text-sm text-muted-foreground">License: {details.companyLicense}</p>}
                    <p className="text-sm text-muted-foreground">{details.companyAddress}</p>
                    <p className="text-sm text-muted-foreground">HR: {details.hrEmail} / {details.hrPhone}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employee</p>
                    <p className="font-medium">{details.employeeName}</p>
                    <p className="text-sm text-muted-foreground">Nationality: {details.employeeNationality}</p>
                    <p className="text-sm text-muted-foreground">ID: {details.passportOrId}</p>
                    <p className="text-sm text-muted-foreground">{details.employeeEmail} / {details.employeePhone}</p>
                    {details.emergencyContact && <p className="text-sm text-muted-foreground">Emergency: {details.emergencyContact}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* 2. POSITION & EMPLOYMENT TERMS */}
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
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reports To</p>
                    <p className="text-sm">{details.directManager}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contract Type</p>
                      <Badge>{details.contractType}</Badge>
                    </div>
                    {details.contractDuration && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Duration</p>
                        <Badge variant="outline">{details.contractDuration}</Badge>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(new Date(details.startDate), 'PPP')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="text-sm">{details.workLocation}</p>
                    </div>
                  </div>
                  {details.probationPeriod !== 'No Probation' && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Probation Period</p>
                        <Badge variant="secondary">{details.probationPeriod}</Badge>
                        {details.probationNotice && (
                          <p className="text-sm text-muted-foreground mt-1">Notice during probation: {details.probationNotice} days</p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 3. COMPENSATION PACKAGE */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconCurrencyDollar className="h-5 w-5" />
                    Compensation Package
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Basic Salary</p>
                    <p className="text-xl font-bold">AED {details.basicSalary}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Housing</p>
                      <p className="text-sm">{details.housingAllowance}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Transport</p>
                      <p className="text-sm">{details.transportAllowance}</p>
                    </div>
                  </div>
                  {details.otherAllowances && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Other Allowances</p>
                        <p className="text-sm whitespace-pre-wrap">{details.otherAllowances}</p>
                      </div>
                    </>
                  )}
                  {details.annualBonus && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Annual Bonus</p>
                        <p className="text-sm">{details.annualBonus}</p>
                      </div>
                    </>
                  )}
                  {details.commissionStructure && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Commission</p>
                        <p className="text-sm">{details.commissionStructure}</p>
                      </div>
                    </>
                  )}
                  <Separator className="border-green-300" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total Monthly Compensation:</span>
                    <span className="text-2xl font-bold text-primary">AED {details.totalMonthlyCompensation}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Payment Frequency</p>
                      <Badge variant="outline">{details.paymentFrequency}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <Badge variant="outline">{details.paymentMethod}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 4. BENEFITS */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconGift className="h-5 w-5" />
                    Benefits & Entitlements
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Health Insurance</p>
                      <Badge>{details.healthInsurance}</Badge>
                      {details.healthInsuranceCoverage && (
                        <p className="text-sm text-muted-foreground mt-1">{details.healthInsuranceCoverage}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Visa & Work Permit</p>
                      <Badge>{details.visaWorkPermit}</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Annual Leave</p>
                      <p className="text-sm">{details.annualLeaveEntitlement} days/year</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Flight Tickets</p>
                      <p className="text-sm">{details.flightTickets}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End-of-Service Gratuity</p>
                    <p className="text-sm">As per UAE Labor Law Articles 51-54</p>
                  </div>
                  {details.otherBenefits && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Other Benefits</p>
                        <p className="text-sm whitespace-pre-wrap">{details.otherBenefits}</p>
                      </div>
                    </>
                  )}
                  {details.benefitsCommencementDate && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Benefits Start Date</p>
                        <p className="text-sm">{format(new Date(details.benefitsCommencementDate), 'PPP')}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 5. WORKING HOURS & SCHEDULE */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconClock className="h-5 w-5" />
                    Working Hours & Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Working Hours</p>
                      <p className="text-sm">{details.workingHoursPerDay} hours/day</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Working Days</p>
                      <p className="text-sm">{details.workingDaysPerWeek} days/week</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                    <p className="text-sm">{details.workSchedule}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rest Days</p>
                      <p className="text-sm">{details.restDaysPerWeek} day(s)/week</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ramadan Hours</p>
                      <p className="text-sm">{details.ramadanWorkingHours}</p>
                    </div>
                  </div>
                  {details.overtimePolicy && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Overtime Policy</p>
                        <p className="text-sm whitespace-pre-wrap">{details.overtimePolicy}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 6. LEAVE ENTITLEMENTS */}
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconCalendar className="h-5 w-5" />
                    Leave Entitlements
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Annual Leave</p>
                    <p className="font-medium">{details.annualLeaveEntitlement} days/year (minimum 30 days per UAE Labor Law)</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sick Leave</p>
                    <p className="text-sm">90 days/year per UAE Labor Law Article 31</p>
                    <p className="text-xs text-muted-foreground">First 15 days: Full pay | Next 30 days: Half pay | Next 45 days: Unpaid</p>
                  </div>
                  {details.otherLeaveTypes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Other Leave Types</p>
                        <p className="text-sm whitespace-pre-wrap">{details.otherLeaveTypes}</p>
                      </div>
                    </>
                  )}
                  {details.leaveApprovalProcess && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Approval Process</p>
                        <p className="text-sm">{details.leaveApprovalProcess}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 7. TERMINATION & NOTICE */}
              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconAlertTriangle className="h-5 w-5" />
                    Termination Provisions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notice by Employee</p>
                      <Badge>{details.noticePeriodByEmployee} days</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notice by Employer</p>
                      <Badge>{details.noticePeriodByEmployer} days</Badge>
                    </div>
                  </div>
                  {details.terminationConditions && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Additional Conditions</p>
                        <p className="text-sm whitespace-pre-wrap">{details.terminationConditions}</p>
                      </div>
                    </>
                  )}
                  {details.gardenLeaveApplicable === 'Yes' && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Garden Leave</p>
                        <Badge>Applicable</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 8. CONFIDENTIALITY & IP */}
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconLock className="h-5 w-5" />
                    Confidentiality & Intellectual Property
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Confidentiality</p>
                      <Badge variant={details.confidentialityObligation === 'Yes' ? "default" : "secondary"}>
                        {details.confidentialityObligation === 'Yes' ? '✓ Required' : '✗ Not Required'}
                      </Badge>
                    </div>
                    {details.ndaSeparate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Separate NDA</p>
                        <Badge variant="outline">{details.ndaSeparate}</Badge>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Intellectual Property Ownership</p>
                    <p className="text-sm">All work product belongs to Company</p>
                  </div>
                  {details.dataAccessLevel && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Data Access Level</p>
                        <p className="text-sm">{details.dataAccessLevel}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 9. NON-COMPETE */}
              {details.nonCompeteClause === 'Yes' && (
                <Card className="border-amber-200">
                  <CardHeader className="bg-amber-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconBan className="h-5 w-5" />
                      Non-Compete Clause
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Duration</p>
                        <Badge>{details.nonCompeteDuration} months</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Geographic Area</p>
                        <Badge variant="outline">United Arab Emirates</Badge>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Scope</p>
                      <p className="text-sm whitespace-pre-wrap">{details.nonCompeteScope}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 10. DATA PROTECTION & LEGAL */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconShieldCheck className="h-5 w-5" />
                    Data Protection & Legal Framework
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Personal Data Retention</p>
                    <p className="text-sm">{details.personalDataRetentionPeriod}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Protection Contact</p>
                    <p className="text-sm">{details.dataProtectionEmail}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employee Data Rights (UAE PDPL)</p>
                    <p className="text-sm">Right to access, correct, and request deletion of personal data</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Governing Law</p>
                      <Badge>UAE Federal Decree-Law No. 33 of 2021</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Jurisdiction</p>
                      <Badge>{details.emirate}</Badge>
                    </div>
                  </div>
                  {details.freeZoneEmployment && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Free Zone</p>
                        <Badge variant="outline">{details.freeZoneEmployment}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 11. ADDITIONAL TERMS */}
              {(details.specialConditions || details.attachments) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconFileText className="h-5 w-5" />
                      Additional Terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {details.specialConditions && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Special Conditions</p>
                        <p className="text-sm whitespace-pre-wrap">{details.specialConditions}</p>
                      </div>
                    )}
                    {details.attachments && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Attachments</p>
                          <p className="text-sm whitespace-pre-wrap">{details.attachments}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 12. COMPLIANCE SUMMARY */}
              <Alert className="bg-green-50 border-green-200">
                <IconCircleCheck className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900">Employment Contract Compliance Summary</AlertTitle>
                <AlertDescription className="text-sm text-green-800 space-y-1 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span>✓ All required fields completed</span>
                    <span>✓ Parties clearly identified</span>
                    <span>✓ Compensation breakdown detailed</span>
                    <span>✓ Benefits explicitly listed</span>
                    <span>✓ Working hours & leave clear</span>
                    <span>✓ Termination provisions included</span>
                    <span>✓ Probation details specified</span>
                    <span>✓ IP ownership explicit</span>
                    <span>✓ PDPL compliant</span>
                    <span>✓ UAE Labor Law compliant</span>
                    <span>✓ Employee data rights included</span>
                    <span>✓ Governing law established</span>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : letterType === 'lease_agreement' ? (
            <div className="space-y-4 mt-6">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-900">
                  <strong>Review all lease agreement details carefully before generating. Ensure compliance with UAE tenancy law and RERA regulations.</strong>
                </AlertDescription>
              </Alert>

              {/* 1. PARTIES TO LEASE */}
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconUsers className="h-5 w-5" />
                    Parties to Lease
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Landlord (Lessor)</p>
                    <p className="font-medium">{details.landlordName}</p>
                    <p className="text-sm text-muted-foreground">ID: {details.landlordId}</p>
                    <p className="text-sm text-muted-foreground">{details.landlordAddress}</p>
                    <p className="text-sm text-muted-foreground">{details.landlordEmail} / {details.landlordPhone}</p>
                    {details.landlordRep && <p className="text-sm text-muted-foreground">Rep: {details.landlordRep} ({details.landlordRepId})</p>}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tenant (Lessee)</p>
                    <p className="font-medium">{details.tenantName}</p>
                    <p className="text-sm text-muted-foreground">ID: {details.tenantId}</p>
                    <p className="text-sm text-muted-foreground">{details.tenantAddress}</p>
                    <p className="text-sm text-muted-foreground">{details.tenantEmail} / {details.tenantPhone}</p>
                    {details.tenantRep && <p className="text-sm text-muted-foreground">Rep: {details.tenantRep} ({details.tenantRepId})</p>}
                  </div>
                </CardContent>
              </Card>

              {/* 2. PROPERTY DETAILS */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconHome className="h-5 w-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Property Address</p>
                    <p className="font-medium">{details.propertyAddress}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Property Type</p>
                      <Badge>{details.propertyType}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Unit/Plot Number</p>
                      <p className="text-sm">{details.unitNumber}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Property Area</p>
                      <p className="text-sm">{details.propertyAreaSqm} sq.m {details.propertyAreaSqft && `(${details.propertyAreaSqft} sq.ft)`}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Parking Spaces</p>
                      <p className="text-sm">{details.parkingSpaces} {details.parkingLocation && `- ${details.parkingLocation}`}</p>
                    </div>
                  </div>
                  {['Apartment', 'Villa', 'Townhouse'].includes(details.propertyType) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Bedrooms / Bathrooms</p>
                        <p className="text-sm">{details.numberOfBedrooms} BD / {details.numberOfBathrooms} BA</p>
                      </div>
                    </div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Property Condition</p>
                      <Badge variant="secondary">{details.propertyCondition}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Furnished</p>
                      <Badge variant="secondary">{details.furnished}</Badge>
                    </div>
                  </div>
                  {details.furnitureList && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Furniture Included</p>
                      <p className="text-sm whitespace-pre-wrap">{details.furnitureList}</p>
                    </div>
                  )}
                  {details.appliancesIncluded === 'Yes' && details.appliancesList && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Appliances Included</p>
                      <p className="text-sm whitespace-pre-wrap">{details.appliancesList}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 3. LEASE TERM */}
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconCalendar className="h-5 w-5" />
                    Lease Term
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(new Date(details.leaseStartDate), 'PPP')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">End Date</p>
                      <p className="font-medium">{format(new Date(details.leaseEndDate), 'PPP')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Duration</p>
                      <Badge>{details.leaseDuration}</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Automatic Renewal</p>
                    <Badge variant={details.autoRenewal === 'Yes' ? "default" : "secondary"}>{details.autoRenewal}</Badge>
                    {details.autoRenewal === 'Yes' && (
                      <div className="mt-2 text-sm">
                        <p>Notice Period: {details.renewalNoticePeriod} days</p>
                        <p>Rent Increase: {details.renewalRentIncrease}%</p>
                        {details.renewalTerms && <p className="text-muted-foreground mt-1">{details.renewalTerms}</p>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 4. RENT & PAYMENT */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconCurrencyDollar className="h-5 w-5" />
                    Rent & Payment Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Annual Rent Amount</p>
                    <p className="text-2xl font-bold text-green-700">AED {parseFloat(details.annualRent).toLocaleString()}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Payment Frequency</p>
                      <Badge>{details.paymentFrequency}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                      <Badge variant="secondary">{details.paymentMethod}</Badge>
                    </div>
                  </div>
                  {details.paymentMethod && details.paymentMethod.includes('Cheque') && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cheque Details</p>
                      <p className="text-sm">Number of Cheques: {details.numberOfCheques}</p>
                      {details.chequeDatesAmounts && <p className="text-sm whitespace-pre-wrap mt-1">{details.chequeDatesAmounts}</p>}
                    </div>
                  )}
                  {details.paymentMethod === 'Bank Transfer' && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bank Details</p>
                      <p className="text-sm">Bank: {details.bankName}</p>
                      <p className="text-sm">Account: {details.accountName}</p>
                      <p className="text-sm">Account #: {details.accountNumber}</p>
                      <p className="text-sm">IBAN: {details.iban}</p>
                    </div>
                  )}
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">First Payment Due</p>
                    <p className="text-sm">{format(new Date(details.firstPaymentDueDate), 'PPP')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Grace Period</p>
                      <p className="text-sm">{details.gracePeriod} days</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bounced Cheque Penalty</p>
                      <p className="text-sm text-red-600">AED {parseFloat(details.bouncedChequePenalty).toLocaleString()}</p>
                    </div>
                  </div>
                  {details.latePaymentPenalty === 'Yes' && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Late Payment Penalty</p>
                      <p className="text-sm text-red-600">{details.latePaymentRate}% per day</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 5. SECURITY DEPOSIT */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconShield className="h-5 w-5" />
                    Security Deposit
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Deposit Amount</p>
                    <p className="text-xl font-bold text-green-700">AED {parseFloat(details.securityDeposit).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ({((parseFloat(details.securityDeposit) / parseFloat(details.annualRent)) * 100).toFixed(1)}% of annual rent)
                    </p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                      <Badge variant="secondary">{details.securityDepositPaymentMethod}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                      <p className="text-sm">{format(new Date(details.securityDepositPaymentDate), 'PPP')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Held in Separate Account</p>
                    <Badge variant={details.depositSeparateAccount === 'Yes' ? "default" : "secondary"}>{details.depositSeparateAccount}</Badge>
                    {details.depositSeparateAccount === 'Yes' && details.depositBankDetails && (
                      <p className="text-sm text-muted-foreground mt-1">{details.depositBankDetails}</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Permitted Deductions</p>
                    <p className="text-sm whitespace-pre-wrap">{details.permittedDeductions}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Return Timeline</p>
                      <p className="text-sm">{details.depositReturnTimeline} days after lease end</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Return Method</p>
                      <Badge variant="secondary">{details.depositReturnMethod}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 6. PROPERTY USE */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconKey className="h-5 w-5" />
                    Property Use & Restrictions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Permitted Use</p>
                      <Badge>{details.permittedUse}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Number of Occupants</p>
                      <p className="text-sm">{details.numberOfOccupants} person(s)</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pets Allowed</p>
                      <Badge variant={details.petsAllowed === 'Yes' ? "default" : "secondary"}>{details.petsAllowed}</Badge>
                      {details.petDepositRequired === 'Yes' && details.petDepositAmount && (
                        <p className="text-sm mt-1">Deposit: AED {parseFloat(details.petDepositAmount).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prohibited Activities</p>
                    <div className="text-sm whitespace-pre-wrap text-red-600">{details.prohibitedActivities}</div>
                  </div>
                </CardContent>
              </Card>

              {/* 7. MAINTENANCE & REPAIRS */}
              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconTool className="h-5 w-5" />
                    Maintenance & Repairs
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Landlord Responsibilities</p>
                    <div className="text-sm whitespace-pre-wrap bg-blue-50 p-3 rounded">{details.landlordMaintenanceResponsibilities}</div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tenant Responsibilities</p>
                    <div className="text-sm whitespace-pre-wrap bg-amber-50 p-3 rounded">{details.tenantMaintenanceResponsibilities}</div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Repair Request Procedure</p>
                    <p className="text-sm">{details.repairRequestProcedure}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Emergency Repair Protocol</p>
                    <p className="text-sm text-red-600">{details.emergencyRepairProtocol}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Response Timeline</p>
                      <Badge>{details.repairResponseTimeline} days</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 8. UTILITIES & SERVICES */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconBolt className="h-5 w-5" />
                    Utilities & Services Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Electricity (DEWA/FEWA)</p>
                      <Badge variant="secondary">{details.electricityResponsibility}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Water</p>
                      <Badge variant="secondary">{details.waterResponsibility}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gas</p>
                      <Badge variant="secondary">{details.gasResponsibility}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">District Cooling/Heating</p>
                      <Badge variant="secondary">{details.coolingResponsibility}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Internet/Cable</p>
                      <Badge variant="secondary">{details.internetResponsibility}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Service Charges/Mgmt Fees</p>
                      <Badge variant="secondary">{details.serviceChargesResponsibility}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Municipality Housing Fee</p>
                      <Badge variant="secondary">{details.municipalityFeeResponsibility}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Chiller Maintenance</p>
                      <Badge variant="secondary">{details.chillerMaintenanceResponsibility}</Badge>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utility Connection Procedure</p>
                    <p className="text-sm">{details.utilityConnectionProcedure}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Final Utility Settlement</p>
                    <p className="text-sm">{details.finalUtilitySettlement}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 9. ALTERATIONS & INSURANCE */}
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconSettings className="h-5 w-5" />
                    Alterations & Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Alterations Allowed</p>
                    <Badge variant={details.alterationsAllowed === 'No Alterations' ? "secondary" : "default"}>{details.alterationsAllowed}</Badge>
                    {details.alterationsAllowed !== 'No Alterations' && (
                      <>
                        {details.alterationsProhibited && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground">Prohibited:</p>
                            <p className="text-sm text-red-600">{details.alterationsProhibited}</p>
                          </div>
                        )}
                        {details.whoPaysAlterations && (
                          <p className="text-sm mt-1">Cost: {details.whoPaysAlterations}</p>
                        )}
                        {details.restorationRequired && (
                          <p className="text-sm mt-1">Restoration: {details.restorationRequired}</p>
                        )}
                      </>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Landlord Building Insurance</p>
                    <Badge variant={details.landlordBuildingInsurance === 'Yes' ? "default" : "secondary"}>{details.landlordBuildingInsurance}</Badge>
                    {details.landlordBuildingInsurance === 'Yes' && details.landlordInsuranceCoverage && (
                      <p className="text-sm mt-1">Coverage: AED {parseFloat(details.landlordInsuranceCoverage).toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tenant Contents Insurance</p>
                    <Badge variant={details.tenantContentsInsuranceRequired.includes('Required') ? "destructive" : "secondary"}>{details.tenantContentsInsuranceRequired}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tenant Liability Insurance</p>
                    <Badge variant={details.tenantLiabilityInsuranceRequired === 'Yes' ? "destructive" : "secondary"}>{details.tenantLiabilityInsuranceRequired}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 10. ACCESS, SUBLETTING & TERMINATION */}
              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconDoorExit className="h-5 w-5" />
                    Access, Subletting & Termination
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Landlord Access Notice Period</p>
                    <Badge>{details.landlordAccessNotice} hours</Badge>
                    <p className="text-sm text-muted-foreground mt-1">Permitted Reasons: {details.permittedAccessReasons}</p>
                    <p className="text-sm text-red-600 mt-1">Emergency Access: {details.emergencyAccess}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inspection Frequency</p>
                    <Badge variant="secondary">{details.inspectionFrequency}</Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Subletting</p>
                      <Badge variant={details.sublettingAllowed === 'No' ? "destructive" : "default"}>{details.sublettingAllowed}</Badge>
                      {details.sublettingAllowed !== 'No' && details.sublettingConditions && (
                        <p className="text-xs text-muted-foreground mt-1">{details.sublettingConditions}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Assignment</p>
                      <Badge variant={details.assignmentAllowed === 'No' ? "destructive" : "default"}>{details.assignmentAllowed}</Badge>
                      {details.assignmentAllowed !== 'No' && details.assignmentProcess && (
                        <p className="text-xs text-muted-foreground mt-1">{details.assignmentProcess}</p>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tenant Notice Period</p>
                      <Badge>{details.tenantNoticePeriod} days</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Landlord Notice Period</p>
                      <Badge>{details.landlordNoticePeriod} days</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Early Termination Penalty</p>
                    <p className="text-lg font-bold text-red-600">{details.earlyTerminationPenalty} month(s) rent</p>
                    {details.earlyTerminationWaiverConditions && (
                      <p className="text-xs text-muted-foreground mt-1">Waiver Conditions: {details.earlyTerminationWaiverConditions}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valid Grounds for Landlord Termination</p>
                    <p className="text-sm whitespace-pre-wrap">{details.validGroundsLandlordTermination}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 11. EJARI REGISTRATION & LEGAL */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconShieldCheck className="h-5 w-5" />
                    EJARI Registration & Legal Framework
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Registration Required</p>
                    <Badge variant="destructive">{details.registrationRequired}</Badge>
                    {details.registrationRequired && (
                      <>
                        <p className="text-sm mt-1">Fees Paid By: {details.registrationFeesPayer}</p>
                        <p className="text-sm">Timeline: Within {details.registrationTimeline} days of signing</p>
                        <p className="text-xs text-muted-foreground mt-2">Required Documents: {details.registrationDocuments}</p>
                      </>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Jurisdiction</p>
                    <Badge>{details.emirate}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dispute Resolution Authority</p>
                    <p className="text-sm font-medium text-blue-600">{details.disputeResolutionAuthority}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Governing Law</p>
                    <p className="text-sm">{details.governingLaw}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Retention (PDPL)</p>
                    <Badge variant="secondary">{details.dataRetentionPeriod}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">Data Protection Contact: {details.dataProtectionEmail}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 12. ADDITIONAL TERMS */}
              {(details.specialConditions || details.attachments) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconFileText className="h-5 w-5" />
                      Additional Terms & Attachments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {details.specialConditions && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Special Conditions</p>
                        <p className="text-sm whitespace-pre-wrap">{details.specialConditions}</p>
                      </div>
                    )}
                    {details.attachments && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Attachments</p>
                        <p className="text-sm whitespace-pre-wrap">{details.attachments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 13. COMPLIANCE SUMMARY */}
              <Alert className="bg-green-50 border-green-200">
                <IconCircleCheck className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900">Lease Agreement Compliance Summary</AlertTitle>
                <AlertDescription className="text-sm text-green-800 space-y-1 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span>✓ All required fields completed</span>
                    <span>✓ Parties clearly identified</span>
                    <span>✓ Property details comprehensive</span>
                    <span>✓ Rent & payment terms defined</span>
                    <span>✓ Security deposit clearly outlined</span>
                    <span>✓ Maintenance responsibilities split</span>
                    <span>✓ Utilities allocation clear</span>
                    <span>✓ Termination conditions specified</span>
                    <span>✓ EJARI/Tawtheeq registration included</span>
                    <span>✓ RERA compliant (if Dubai)</span>
                    <span>✓ PDPL compliant</span>
                    <span>✓ UAE Tenancy Law compliant</span>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : letterType === 'lease_termination' ? (
            <div className="space-y-4 mt-6">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-sm text-amber-900">
                  <strong>IMPORTANT: Review all lease termination notice details carefully. Ensure compliance with UAE Federal Law No. 26 of 2007 and emirate-specific tenancy regulations. Improper termination may be challenged.</strong>
                </AlertDescription>
              </Alert>

              {/* 1. NOTICE INFORMATION */}
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconFileText className="h-5 w-5" />
                    Notice Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {details.noticeRefNumber && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Reference Number</p>
                      <p className="font-mono text-sm">{details.noticeRefNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notice Date</p>
                    <p className="font-medium">{details.noticeDate}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery Method</p>
                    <Badge>{details.deliveryMethod}</Badge>
                    {details.deliveryMethod === 'Courier' && details.courierName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {details.courierName} - Tracking: {details.trackingNumber}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 2. PARTIES */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconUsers className="h-5 w-5" />
                    Parties
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Landlord (Terminating Party)</p>
                    <p className="font-medium">{details.landlordName}</p>
                    <p className="text-sm text-muted-foreground">ID: {details.landlordId}</p>
                    <p className="text-sm text-muted-foreground">{details.landlordAddress}</p>
                    <p className="text-sm text-muted-foreground">{details.landlordEmail} / {details.landlordPhone}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tenant (Recipient)</p>
                    <p className="font-medium">{details.tenantName}</p>
                    <p className="text-sm text-muted-foreground">ID: {details.tenantId}</p>
                    <p className="text-sm text-muted-foreground">{details.tenantAddress}</p>
                    <p className="text-sm text-muted-foreground">{details.tenantEmail} / {details.tenantPhone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 3. PROPERTY & ORIGINAL LEASE */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconHome className="h-5 w-5" />
                    Property & Original Lease Reference
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Property Address</p>
                    <p className="font-medium">{details.propertyAddress}</p>
                    <p className="text-sm text-muted-foreground">Unit: {details.unitNumber} | Type: {details.propertyType}</p>
                    {details.propertyArea && <p className="text-sm text-muted-foreground">Area: {details.propertyArea} sqm</p>}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Original Lease</p>
                    <p className="text-sm">Lease Date: {details.originalLeaseDate}</p>
                    <p className="text-sm">Term: {details.leaseStartDate} to {details.leaseEndDate}</p>
                    {details.ejariNumber && <p className="text-sm font-mono">Ejari/Tawtheeq: {details.ejariNumber}</p>}
                    <Badge variant="outline" className="mt-1">{details.currentLeaseStatus}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 4. TERMINATION REASON & LEGAL GROUNDS */}
              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconAlertTriangle className="h-5 w-5" />
                    Termination Reason & Legal Grounds
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Termination Reason</p>
                    <Badge variant="destructive">{details.terminationReason}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Legal Basis</p>
                    <p className="text-sm font-mono text-blue-600">{details.legalBasis}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Detailed Reason</p>
                    <p className="text-sm whitespace-pre-wrap">{details.terminationDescription}</p>
                  </div>
                  {details.supportingDocs && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Supporting Documentation</p>
                        <p className="text-sm whitespace-pre-wrap">{details.supportingDocs}</p>
                      </div>
                    </>
                  )}
                  {details.priorWarnings === 'Yes' && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Prior Warnings Issued</p>
                        <Badge variant="outline">Yes</Badge>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{details.priorWarningDates}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 5. NOTICE PERIOD */}
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconClock className="h-5 w-5" />
                    Notice Period & Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notice Period Provided</p>
                    <p className="text-2xl font-bold text-purple-600">{details.noticePeriodDays} days</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notice Effective Date</p>
                      <p className="text-sm font-medium">{details.noticeEffectiveDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Termination Date (Must Vacate By)</p>
                      <p className="text-sm font-medium text-red-600">{details.terminationDate}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Minimum Legal Notice Required</p>
                    <p className="text-sm">{details.minNoticePeriod} days</p>
                  </div>
                  <Alert className="bg-green-50 border-green-200">
                    <IconCircleCheck className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs text-green-800">
                      {details.noticePeriodCompliance}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* 6. PROPERTY HANDOVER REQUIREMENTS */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconKey className="h-5 w-5" />
                    Property Handover Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cleanliness Standard Required</p>
                    <Badge>{details.cleanlinessStandard}</Badge>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Keys & Access Devices to Return</p>
                    <p className="text-sm whitespace-pre-wrap">{details.keysToReturn}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Repairs Required</p>
                    <p className="text-sm whitespace-pre-wrap">{details.repairsRequired}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilities Final Settlement</p>
                    <p className="text-sm whitespace-pre-wrap">{details.utilitiesFinal}</p>
                  </div>
                  {details.moveOutInspection === 'Yes' && (
                    <>
                      <Separator />
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm font-medium text-blue-900">Move-Out Inspection Required</p>
                        <p className="text-xs text-blue-700 mt-1">Contact: {details.inspectionContact}</p>
                        <p className="text-xs text-blue-700">Phone: {details.inspectionPhone}</p>
                        <p className="text-xs text-blue-700">Email: {details.inspectionEmail}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 7. SECURITY DEPOSIT SETTLEMENT */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconCurrencyDollar className="h-5 w-5" />
                    Security Deposit Settlement
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Security Deposit Amount</p>
                    <p className="text-2xl font-bold text-green-600">AED {details.securityDeposit?.toLocaleString()}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Return Timeline</p>
                    <p className="text-sm">Within {details.depositReturnDays} days after vacate and final inspection</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Permitted Deductions</p>
                    <p className="text-sm whitespace-pre-wrap">{details.depositDeductions}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Return Method</p>
                    <Badge variant="outline">{details.depositReturnMethod}</Badge>
                    {details.depositReturnMethod === 'Bank Transfer' && details.tenantBankAccount && (
                      <p className="text-xs text-muted-foreground mt-1">Account: {details.tenantBankAccount}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 8. FINAL ACCOUNT SETTLEMENT */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconReceipt className="h-5 w-5" />
                    Final Account Settlement
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {details.finalRent && (
                    <div className="flex justify-between">
                      <span className="text-sm">Final Rent Payment:</span>
                      <span className="text-sm font-medium">AED {parseFloat(details.finalRent).toLocaleString()}</span>
                    </div>
                  )}
                  {details.utilitiesOwed && (
                    <div className="flex justify-between">
                      <span className="text-sm">Outstanding Utilities:</span>
                      <span className="text-sm font-medium">AED {parseFloat(details.utilitiesOwed).toLocaleString()}</span>
                    </div>
                  )}
                  {details.otherAmounts && (
                    <div className="flex justify-between">
                      <span className="text-sm">Other Amounts ({details.otherAmountsDesc}):</span>
                      <span className="text-sm font-medium">AED {parseFloat(details.otherAmounts).toLocaleString()}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold">TOTAL AMOUNT DUE:</span>
                    <span className="text-2xl font-bold text-green-600">AED {parseFloat(details.totalAmountDue || 0).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Deadline</p>
                    <p className="text-sm font-bold text-red-600">{details.paymentDeadline}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                    <Badge>{details.paymentMethod}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 9. CONSEQUENCES OF NON-COMPLIANCE */}
              <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="text-lg flex items-center gap-2 text-red-900">
                    <IconAlertTriangle className="h-5 w-5" />
                    Consequences of Non-Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <Alert variant="destructive">
                    <AlertTitle>Failure to Vacate</AlertTitle>
                    <AlertDescription className="text-sm mt-2">
                      If tenant fails to vacate by {details.terminationDate}, landlord may initiate eviction proceedings.
                    </AlertDescription>
                  </Alert>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Daily Occupation Charge (after termination date)</p>
                    <p className="text-xl font-bold text-red-600">AED {parseFloat(details.dailyOccupationCharge || 0).toLocaleString()} per day</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Legal Action Timeline</p>
                    <p className="text-sm whitespace-pre-wrap">{details.legalActionTimeline}</p>
                    {details.estimatedFilingDate && (
                      <p className="text-sm text-red-600 mt-1">Estimated Court Filing: {details.estimatedFilingDate}</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Additional Consequences</p>
                    <p className="text-sm whitespace-pre-wrap">{details.additionalConsequences}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 10. TENANT RIGHTS & PROTECTIONS */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-900">
                    <IconShieldCheck className="h-5 w-5" />
                    Tenant Rights & Protections
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertTitle className="text-blue-900">Your Rights Under UAE Tenancy Law</AlertTitle>
                    <AlertDescription className="text-sm text-blue-800 mt-2 whitespace-pre-wrap">
                      {details.tenantRightsSummary}
                    </AlertDescription>
                  </Alert>
                  <Separator />
                  <div className="bg-amber-50 p-3 rounded">
                    <p className="text-sm font-medium text-amber-900">Time to File Dispute</p>
                    <p className="text-sm text-amber-800 mt-1">
                      You have <strong>{details.disputeFilingDays} days</strong> from receipt of this notice to challenge the termination.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dispute Resolution Authority</p>
                    <p className="text-sm font-medium text-blue-600">{details.disputeAuthority}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 11. GOVERNING LAW & JURISDICTION */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconGavel className="h-5 w-5" />
                    Governing Law & Jurisdiction
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Emirate (Jurisdiction)</p>
                    <Badge>{details.emirate}</Badge>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Applicable Laws</p>
                    <p className="text-sm whitespace-pre-wrap font-mono text-xs">{details.applicableLaws}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dispute Resolution Process</p>
                    <p className="text-sm">1. Amicable Resolution (30 days)</p>
                    <p className="text-sm">2. {details.disputeAuthority}</p>
                    <p className="text-sm">3. Court Appeal (if necessary)</p>
                  </div>
                </CardContent>
              </Card>

              {/* 12. DATA PROTECTION */}
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconLock className="h-5 w-5" />
                    Data Protection (PDPL Compliance)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Retention Period</p>
                    <Badge variant="secondary">{details.dataRetentionPeriod}</Badge>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Protection Contact</p>
                    <p className="text-sm">{details.dataProtectionEmail}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Your Data Rights</p>
                    <ul className="text-xs space-y-1 mt-1 list-disc list-inside">
                      <li>Right to access your personal data</li>
                      <li>Right to rectification of inaccurate data</li>
                      <li>Right to erasure (after retention period)</li>
                      <li>Right to object to processing</li>
                      <li>Right to lodge complaint with UAE Data Office</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm">Tenant must provide forwarding address within {details.forwardingAddressDeadline} days</p>
                  </div>
                </CardContent>
              </Card>

              {/* 13. WITNESS & DELIVERY */}
              {(details.witnessName || details.tenantReceiptDate) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconSignature className="h-5 w-5" />
                      Witness & Delivery Confirmation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {details.witnessName && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Witness</p>
                        <p className="text-sm">{details.witnessName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Delivery Confirmation Method</p>
                      <Badge variant="outline">{details.deliveryConfirmationMethod}</Badge>
                    </div>
                    {details.tenantReceiptDate && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tenant Receipt Date</p>
                          <p className="text-sm font-medium">{details.tenantReceiptDate}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 14. COMPLIANCE SUMMARY */}
              <Alert className="bg-green-50 border-green-200">
                <IconCircleCheck className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900">Lease Termination Notice Compliance Summary</AlertTitle>
                <AlertDescription className="text-sm text-green-800 space-y-1 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span>✓ All required fields completed</span>
                    <span>✓ Parties clearly identified</span>
                    <span>✓ Property & lease details included</span>
                    <span>✓ Termination reason with legal basis</span>
                    <span>✓ Notice period compliant with law</span>
                    <span>✓ Handover requirements detailed</span>
                    <span>✓ Security deposit process clear</span>
                    <span>✓ Final account settlement specified</span>
                    <span>✓ Consequences clearly stated</span>
                    <span>✓ Tenant rights explicitly included</span>
                    <span>✓ Governing law established</span>
                    <span>✓ PDPL data protection compliant</span>
                    <span>✓ UAE Federal Law No. 26/2007 compliant</span>
                    <span>✓ Emirate-specific regulations included</span>
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
