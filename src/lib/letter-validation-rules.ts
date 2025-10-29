import { z } from 'zod'
import { 
  emiratesIdSchema, 
  emailSchema, 
  uaePhoneSchema, 
  aedAmountSchema,
  nameSchema,
  companyNameSchema,
  addressSchema,
  noticePeriodSchema,
  salarySchema,
} from './validation-schemas'

// Reference number validator (numbers only)
const referenceNumberSchema = z.string().regex(/^[0-9]+$/, "Must contain numbers only")

// Invoice number validator (numbers only)
const invoiceNumberSchema = z.string().regex(/^[0-9]+$/, "Must contain numbers only")

// Positive number validator
const positiveNumberSchema = z.coerce.number().positive("Must be a positive number")

// Date validator
const dateSchema = z.string().min(1, "Date is required")

// Non-empty text validator
const requiredTextSchema = z.string().trim().min(1, "This field is required")

interface FieldValidationRule {
  validator?: z.ZodSchema
  pattern?: string
  inputMode?: 'text' | 'numeric' | 'email' | 'tel' | 'url' | 'search' | 'none' | 'decimal'
  type?: string
  maxLength?: number
  min?: number
  max?: number
  step?: number
  message?: string
}

type LetterValidationRules = {
  [letterType: string]: {
    [fieldName: string]: FieldValidationRule
  }
}

export const LETTER_VALIDATION_RULES: LetterValidationRules = {
  // ============= DEMAND LETTER =============
  demand_letter: {
    senderName: { validator: nameSchema },
    senderAddress: { validator: addressSchema },
    senderPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    senderEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    recipientName: { validator: nameSchema },
    recipientAddress: { validator: addressSchema },
    recipientPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    recipientEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    referenceNumber: { 
      validator: referenceNumberSchema, 
      pattern: '[0-9]*', 
      inputMode: 'numeric',
      message: 'Reference number must contain numbers only'
    },
    amount: { 
      validator: aedAmountSchema, 
      type: 'number', 
      inputMode: 'decimal', 
      min: 0, 
      step: 0.01,
      message: 'Must be a positive amount'
    },
    dueDate: { validator: dateSchema, type: 'date' },
    invoiceNumber: { 
      validator: invoiceNumberSchema, 
      pattern: '[0-9]*', 
      inputMode: 'numeric',
      message: 'Invoice number must contain numbers only'
    },
    invoiceDate: { validator: dateSchema, type: 'date' },
  },

  // ============= SETTLEMENT AGREEMENT =============
  settlement_agreement: {
    partyAName: { validator: nameSchema },
    partyAEmiratesId: { 
      validator: emiratesIdSchema, 
      pattern: '[0-9-]*', 
      inputMode: 'numeric', 
      maxLength: 18,
      message: 'Emirates ID must be in format 784-XXXX-XXXXXXX-X'
    },
    partyAAddress: { validator: addressSchema },
    partyAPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    partyAEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    partyBName: { validator: nameSchema },
    partyBEmiratesId: { 
      validator: emiratesIdSchema, 
      pattern: '[0-9-]*', 
      inputMode: 'numeric', 
      maxLength: 18,
      message: 'Emirates ID must be in format 784-XXXX-XXXXXXX-X'
    },
    partyBAddress: { validator: addressSchema },
    partyBPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    partyBEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    settlementAmount: { 
      validator: aedAmountSchema, 
      type: 'number', 
      inputMode: 'decimal', 
      min: 0, 
      step: 0.01 
    },
    paymentDate: { validator: dateSchema, type: 'date' },
  },

  // ============= EMPLOYMENT TERMINATION =============
  employment_termination: {
    employerName: { validator: companyNameSchema },
    employerAddress: { validator: addressSchema },
    employerPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    employerEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    employeeName: { validator: nameSchema },
    employeePosition: { validator: requiredTextSchema },
    emiratesIdOrPassport: { 
      validator: z.string().min(5, "Valid ID required"), 
      pattern: '[A-Z0-9-]*', 
      maxLength: 20 
    },
    employeeAddress: { validator: addressSchema },
    employeePhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    employeeEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    noticePeriodProvided: { 
      validator: noticePeriodSchema, 
      type: 'number', 
      inputMode: 'numeric', 
      min: 30, 
      max: 90,
      message: 'Notice period must be 30-90 days per UAE Labor Law'
    },
    basicSalary: { 
      validator: salarySchema, 
      type: 'number', 
      inputMode: 'decimal', 
      min: 1000, 
      step: 0.01,
      message: 'Salary must be at least AED 1,000'
    },
    terminationDate: { validator: dateSchema, type: 'date' },
    lastWorkingDate: { validator: dateSchema, type: 'date' },
  },

  // ============= EMPLOYMENT CONTRACT =============
  employment_contract: {
    employerName: { validator: companyNameSchema },
    employerAddress: { validator: addressSchema },
    employerTradeLicense: { 
      validator: requiredTextSchema, 
      pattern: '[A-Z0-9-]*',
      message: 'Trade license number required'
    },
    employerPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    employerEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    employeeName: { validator: nameSchema },
    passportOrEmiratesId: { 
      validator: z.string().min(5, "Valid ID required"), 
      pattern: '[A-Z0-9-]*', 
      maxLength: 20 
    },
    nationality: { validator: requiredTextSchema },
    dateOfBirth: { validator: dateSchema, type: 'date' },
    employeeAddress: { validator: addressSchema },
    employeePhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    employeeEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    jobTitle: { validator: requiredTextSchema },
    basicSalary: { 
      validator: salarySchema, 
      type: 'number', 
      inputMode: 'decimal', 
      min: 1000, 
      step: 0.01 
    },
    housingAllowance: { 
      validator: positiveNumberSchema.optional(), 
      type: 'number', 
      inputMode: 'decimal', 
      min: 0, 
      step: 0.01 
    },
    transportAllowance: { 
      validator: positiveNumberSchema.optional(), 
      type: 'number', 
      inputMode: 'decimal', 
      min: 0, 
      step: 0.01 
    },
    startDate: { validator: dateSchema, type: 'date' },
    probationPeriod: { 
      validator: z.coerce.number().min(0).max(6, "Maximum 6 months per UAE law"), 
      type: 'number', 
      inputMode: 'numeric', 
      min: 0, 
      max: 6 
    },
    workingHoursPerWeek: { 
      validator: z.coerce.number().min(1).max(48, "Maximum 48 hours per week per UAE law"), 
      type: 'number', 
      inputMode: 'numeric', 
      min: 1, 
      max: 48 
    },
  },

  // ============= LEASE AGREEMENT =============
  lease_agreement: {
    landlordName: { validator: nameSchema },
    landlordEmiratesId: { 
      validator: emiratesIdSchema, 
      pattern: '[0-9-]*', 
      inputMode: 'numeric', 
      maxLength: 18 
    },
    landlordAddress: { validator: addressSchema },
    landlordPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    landlordEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    tenantName: { validator: nameSchema },
    tenantEmiratesId: { 
      validator: emiratesIdSchema, 
      pattern: '[0-9-]*', 
      inputMode: 'numeric', 
      maxLength: 18 
    },
    tenantAddress: { validator: addressSchema },
    tenantPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    tenantEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    propertyAddress: { validator: addressSchema },
    monthlyRent: { 
      validator: aedAmountSchema, 
      type: 'number', 
      inputMode: 'decimal', 
      min: 0, 
      step: 0.01 
    },
    securityDeposit: { 
      validator: aedAmountSchema, 
      type: 'number', 
      inputMode: 'decimal', 
      min: 0, 
      step: 0.01 
    },
    leaseStartDate: { validator: dateSchema, type: 'date' },
    leaseEndDate: { validator: dateSchema, type: 'date' },
  },

  // ============= LEASE TERMINATION =============
  lease_termination: {
    landlordName: { validator: nameSchema },
    landlordAddress: { validator: addressSchema },
    landlordPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    landlordEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    tenantName: { validator: nameSchema },
    tenantAddress: { validator: addressSchema },
    tenantPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    tenantEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    propertyAddress: { validator: addressSchema },
    leaseStartDate: { validator: dateSchema, type: 'date' },
    leaseEndDate: { validator: dateSchema, type: 'date' },
    noticeDate: { validator: dateSchema, type: 'date' },
    terminationDate: { validator: dateSchema, type: 'date' },
  },

  // ============= NDA (Non-Disclosure Agreement) =============
  nda: {
    partyAName: { validator: nameSchema },
    partyAAddress: { validator: addressSchema },
    partyBName: { validator: nameSchema },
    partyBAddress: { validator: addressSchema },
    effectiveDate: { validator: dateSchema, type: 'date' },
    expiryDate: { validator: dateSchema, type: 'date' },
  },

  // ============= WORKPLACE COMPLAINT =============
  workplace_complaint: {
    complainantName: { validator: nameSchema },
    complainantPosition: { validator: requiredTextSchema },
    complainantEmiratesId: { 
      validator: emiratesIdSchema, 
      pattern: '[0-9-]*', 
      inputMode: 'numeric', 
      maxLength: 18 
    },
    complainantPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    complainantEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    respondentName: { validator: nameSchema },
    respondentPosition: { validator: requiredTextSchema },
    incidentDate: { validator: dateSchema, type: 'date' },
  },

  // ============= POWER OF ATTORNEY =============
  power_of_attorney: {
    principalName: { validator: nameSchema },
    principalEmiratesId: { 
      validator: emiratesIdSchema, 
      pattern: '[0-9-]*', 
      inputMode: 'numeric', 
      maxLength: 18 
    },
    principalAddress: { validator: addressSchema },
    principalPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    principalEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    agentName: { validator: nameSchema },
    agentEmiratesId: { 
      validator: emiratesIdSchema, 
      pattern: '[0-9-]*', 
      inputMode: 'numeric', 
      maxLength: 18 
    },
    agentAddress: { validator: addressSchema },
    agentPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    agentEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    effectiveDate: { validator: dateSchema, type: 'date' },
    expiryDate: { validator: dateSchema, type: 'date' },
  },

  // ============= GENERAL LEGAL LETTER =============
  general_legal: {
    senderName: { validator: nameSchema },
    senderAddress: { validator: addressSchema },
    senderPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    senderEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    recipientName: { validator: nameSchema },
    recipientAddress: { validator: addressSchema },
    recipientPhone: { validator: uaePhoneSchema, type: 'tel', inputMode: 'tel' },
    recipientEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
  },
}

/**
 * Get validation rule for a specific field in a letter type
 */
export function getFieldValidationRule(
  letterType: string, 
  fieldName: string
): FieldValidationRule | undefined {
  return LETTER_VALIDATION_RULES[letterType]?.[fieldName]
}

/**
 * Get all validation rules for a letter type
 */
export function getLetterValidationRules(letterType: string): Record<string, FieldValidationRule> {
  return LETTER_VALIDATION_RULES[letterType] || {}
}
