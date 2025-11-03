import { z } from 'zod'
import { 
  emiratesIdSchema, 
  emailSchema, 
  uaePhoneSchema,
  internationalPhoneSchema,
  aedAmountSchema,
  nameSchema,
  companyNameSchema,
  addressSchema,
  noticePeriodSchema,
  salarySchema,
} from './validation-schemas'
import { DateValidationRule } from './date-validation'

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
  dateRelationships?: DateValidationRule[]
}

// Conditional field dependencies
export const CONDITIONAL_FIELD_DEPENDENCIES: Record<string, Record<string, {
  fields: string[];
  naLabel: string;
}>> = {
  employment_termination: {
    propertyToReturn: {
      fields: ['laptopDetails', 'mobilePhone', 'accessCards', 'documentsToReturn', 'otherProperty', 'propertyReturnDeadline', 'consequencesNonReturn'],
      naLabel: 'Not Applicable - No company property to return'
    },
    nonCompeteApplicable: {
      fields: ['nonCompeteDuration', 'nonCompeteScope'],
      naLabel: 'Not Applicable - Non-compete clause waived'
    },
    certificateRequired: {
      fields: ['certificateIssuanceTimeline'],
      naLabel: 'Not Applicable - Certificate not required'
    }
  },
  employment_contract: {
    gardenLeaveApplicable: {
      fields: ['gardenLeaveDuration'],
      naLabel: 'Not Applicable - Garden leave not applicable'
    },
    nonCompeteClause: {
      fields: ['nonCompeteDuration', 'nonCompeteScope'],
      naLabel: 'Not Applicable - Non-compete clause not included'
    }
  },
  demand_letter: {
    bankTransferAllowed: {
      fields: ['bankName', 'accountName', 'accountNumber', 'iban', 'swiftCode', 'bankBranch'],
      naLabel: 'Not Applicable - Bank transfer not accepted'
    },
    chequeAllowed: {
      fields: ['chequePayeeName', 'chequeDeliveryAddress'],
      naLabel: 'Not Applicable - Cheque payment not accepted'
    },
    cashAllowed: {
      fields: ['cashPaymentAddress', 'businessHours', 'contactPerson', 'contactPhone'],
      naLabel: 'Not Applicable - Cash payment not accepted'
    },
    onlinePaymentAllowed: {
      fields: ['paymentPortalURL', 'referenceCode'],
      naLabel: 'Not Applicable - Online payment not available'
    }
  },
  settlement_agreement: {
    paymentInvolved: {
      fields: ['settlementAmount', 'settlementAmountWords', 'currency', 'paymentStructure', 'paymentSchedule', 'paymentMethod', 'bankName', 'accountName', 'accountNumber', 'iban', 'latePaymentConsequences', 'receiptRequirements'],
      naLabel: 'Not Applicable - No monetary settlement'
    },
    partyAReleasesB: {
      fields: ['partyAReleaseScope'],
      naLabel: 'Not Applicable - Party A does not release Party B'
    },
    partyBReleasesA: {
      fields: ['partyBReleaseScope'],
      naLabel: 'Not Applicable - Party B does not release Party A'
    },
    isConfidential: {
      fields: ['confidentialityScope', 'whoCanAccess', 'confidentialityExceptions', 'breachOfConfidentialityConsequences'],
      naLabel: 'Not Applicable - Agreement is not confidential'
    },
    includeNonDisparagement: {
      fields: ['nonDisparagementDetails'],
      naLabel: 'Not Applicable - Non-disparagement clause not included'
    },
    requiresNotarization: {
      fields: ['notaryLocation', 'notaryDate'],
      naLabel: 'Not Applicable - Notarization not required'
    }
  },
  workplace_complaint: {
    previousReports: {
      fields: ['previousReportsDetails', 'previousReportDate'],
      naLabel: 'Not Applicable - No previous reports filed'
    }
  },
  power_of_attorney: {
    financialPowers: {
      fields: ['financialPowersDetails'],
      naLabel: 'Not Applicable - Financial powers not granted'
    },
    propertyPowers: {
      fields: ['propertyPowersDetails'],
      naLabel: 'Not Applicable - Property powers not granted'
    },
    legalPowers: {
      fields: ['legalPowersDetails'],
      naLabel: 'Not Applicable - Legal powers not granted'
    },
    businessPowers: {
      fields: ['businessPowersDetails'],
      naLabel: 'Not Applicable - Business powers not granted'
    },
    healthcarePowers: {
      fields: ['healthcarePowersDetails'],
      naLabel: 'Not Applicable - Healthcare powers not granted'
    },
    govPowers: {
      fields: ['govPowersDetails'],
      naLabel: 'Not Applicable - Government powers not granted'
    }
  },
  lease_agreement: {
    storageUnit: {
      fields: ['storageUnitDetails'],
      naLabel: 'Not Applicable - No storage unit included'
    },
    appliancesIncluded: {
      fields: ['appliancesList'],
      naLabel: 'Not Applicable - No appliances included'
    },
    autoRenewal: {
      fields: ['renewalNoticePeriod', 'renewalRentIncrease', 'renewalTerms'],
      naLabel: 'Not Applicable - No automatic renewal'
    },
    latePaymentPenalty: {
      fields: ['latePaymentRate'],
      naLabel: 'Not Applicable - No late payment penalty'
    },
    depositSeparateAccount: {
      fields: ['depositBankDetails'],
      naLabel: 'Not Applicable - Deposit not in separate account'
    },
    petDepositRequired: {
      fields: ['petDepositAmount'],
      naLabel: 'Not Applicable - No pet deposit required'
    }
  },
  nda: {
    includesNonSolicitation: {
      fields: ['nonSolicitationDuration', 'nonSolicitationScope'],
      naLabel: 'Not Applicable - Non-solicitation clause not included'
    }
  }
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
    senderPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
    senderEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    recipientName: { validator: nameSchema },
    recipientAddress: { validator: addressSchema },
    recipientPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
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
    dueDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          relatedField: 'invoiceDate',
          type: 'mustBeAfter',
          errorMessage: 'Due date should be after invoice date'
        }
      ]
    },
    invoiceNumber: { 
      validator: invoiceNumberSchema, 
      pattern: '[0-9]*', 
      inputMode: 'numeric',
      message: 'Invoice number must contain numbers only'
    },
    invoiceDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          type: 'cannotBeFuture',
          errorMessage: 'Invoice date cannot be in the future'
        }
      ]
    },
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
    partyAPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
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
    partyBPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
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
    employerPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
    employerEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    employeeName: { validator: nameSchema },
    employeePosition: { validator: requiredTextSchema },
    emiratesIdOrPassport: { 
      validator: z.string().min(5, "Valid ID required"), 
      pattern: '[A-Z0-9-]*', 
      maxLength: 20 
    },
    employeeAddress: { validator: addressSchema },
    employeePhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
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
    terminationDate: { 
      validator: dateSchema, 
      type: 'date'
    },
    lastWorkingDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          relatedField: 'terminationDate',
          type: 'mustBeAfter',
          errorMessage: 'Last working date must be after termination date'
        }
      ]
    },
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
    employerPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
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
    employeePhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
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
    startDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          type: 'cannotBeTooOld',
          errorMessage: 'Contract start date cannot be more than 6 months in the past'
        }
      ]
    },
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
    landlordPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
    landlordEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    tenantName: { validator: nameSchema },
    tenantEmiratesId: { 
      validator: emiratesIdSchema, 
      pattern: '[0-9-]*', 
      inputMode: 'numeric', 
      maxLength: 18 
    },
    tenantAddress: { validator: addressSchema },
    tenantPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
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
    leaseStartDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          type: 'cannotBeTooOld',
          errorMessage: 'Lease start date cannot be more than 6 months in the past'
        }
      ]
    },
    leaseEndDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          relatedField: 'leaseStartDate',
          type: 'mustBeAfter',
          errorMessage: 'Lease end date must be after start date'
        }
      ]
    },
  },

  // ============= LEASE TERMINATION =============
  lease_termination: {
    landlordName: { validator: nameSchema },
    landlordAddress: { validator: addressSchema },
    landlordPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
    landlordEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    tenantName: { validator: nameSchema },
    tenantAddress: { validator: addressSchema },
    tenantPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
    tenantEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    propertyAddress: { validator: addressSchema },
    leaseStartDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          relatedField: 'originalLeaseDate',
          type: 'mustBeAfter',
          errorMessage: 'Lease start date must be after original lease date'
        }
      ]
    },
    leaseEndDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          relatedField: 'leaseStartDate',
          type: 'mustBeAfter',
          errorMessage: 'Lease end date must be after start date'
        }
      ]
    },
    noticeDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          type: 'cannotBeFuture',
          errorMessage: 'Notice date cannot be in the future'
        }
      ]
    },
    terminationDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          relatedField: 'noticeDate',
          type: 'mustBeAfter',
          errorMessage: 'Termination date must be after notice date',
          minDaysDiff: 30
        }
      ]
    },
  },

  // ============= NDA (Non-Disclosure Agreement) =============
  nda: {
    partyAName: { validator: nameSchema },
    partyAAddress: { validator: addressSchema },
    partyBName: { validator: nameSchema },
    partyBAddress: { validator: addressSchema },
    effectiveDate: { 
      validator: dateSchema, 
      type: 'date' 
    },
    expiryDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          relatedField: 'effectiveDate',
          type: 'mustBeAfter',
          errorMessage: 'Expiry date must be after effective date'
        }
      ]
    },
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
    complainantPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
    complainantEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    respondentName: { validator: nameSchema },
    respondentPosition: { validator: requiredTextSchema },
    incidentDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          type: 'cannotBeFuture',
          errorMessage: 'Incident date cannot be in the future'
        }
      ]
    },
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
    principalPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
    principalEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    agentName: { validator: nameSchema },
    agentEmiratesId: { 
      validator: emiratesIdSchema, 
      pattern: '[0-9-]*', 
      inputMode: 'numeric', 
      maxLength: 18 
    },
    agentAddress: { validator: addressSchema },
    agentPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
    agentEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    effectiveDate: { 
      validator: dateSchema, 
      type: 'date' 
    },
    expiryDate: { 
      validator: dateSchema, 
      type: 'date',
      dateRelationships: [
        {
          relatedField: 'effectiveDate',
          type: 'mustBeAfter',
          errorMessage: 'Expiry date must be after effective date'
        }
      ]
    },
  },

  // ============= GENERAL LEGAL LETTER =============
  general_legal: {
    senderName: { validator: nameSchema },
    senderAddress: { validator: addressSchema },
    senderPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
    senderEmail: { validator: emailSchema, type: 'email', inputMode: 'email' },
    recipientName: { validator: nameSchema },
    recipientAddress: { validator: addressSchema },
    recipientPhone: { validator: internationalPhoneSchema, type: 'tel', inputMode: 'tel' },
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

/**
 * Check if a field should be enabled based on its dependencies
 */
export function isFieldEnabled(
  fieldName: string,
  letterType: string,
  allDetails: Record<string, any>
): boolean {
  const dependencies = CONDITIONAL_FIELD_DEPENDENCIES[letterType];
  
  if (!dependencies) return true;
  
  for (const [parentField, config] of Object.entries(dependencies)) {
    if (config.fields.includes(fieldName)) {
      return allDetails[parentField] === "Yes";
    }
  }
  
  return true;
}

/**
 * Get the parent field that controls this field's enablement
 */
export function getParentFieldInfo(
  fieldName: string,
  letterType: string
): { parentField: string; naLabel: string } | null {
  const dependencies = CONDITIONAL_FIELD_DEPENDENCIES[letterType];
  
  if (!dependencies) return null;
  
  for (const [parentField, config] of Object.entries(dependencies)) {
    if (config.fields.includes(fieldName)) {
      return { parentField, naLabel: config.naLabel };
    }
  }
  
  return null;
}
