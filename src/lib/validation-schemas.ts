import { z } from 'zod';

/**
 * Phase 1: Input Validation Overhaul
 * Centralized validation schemas using Zod for consistent validation across the app
 */

// ============= UAE-SPECIFIC VALIDATIONS =============

/**
 * UAE Phone Number Validation
 * Supports all valid UAE formats:
 * - Mobile: +971 50/52/54/55/56/58 XXX XXXX or 050/052/054/055/056/058 XXX XXXX
 * - Landline: +971 2/3/4/6/7/9 XXX XXXX or 02/03/04/06/07/09 XXX XXXX
 */
export const uaePhoneSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      // Remove all spaces, hyphens, and parentheses
      const cleaned = val.replace(/[\s\-()]/g, '');
      
      // UAE mobile patterns (with or without +971)
      const mobilePattern = /^(\+971|00971|971)?(50|52|54|55|56|58)\d{7}$/;
      const localMobilePattern = /^(050|052|054|055|056|058)\d{7}$/;
      
      // UAE landline patterns (with or without +971)
      const landlinePattern = /^(\+971|00971|971)?(2|3|4|6|7|9)\d{7}$/;
      const localLandlinePattern = /^(02|03|04|06|07|09)\d{7}$/;
      
      return (
        mobilePattern.test(cleaned) ||
        localMobilePattern.test(cleaned) ||
        landlinePattern.test(cleaned) ||
        localLandlinePattern.test(cleaned)
      );
    },
    {
      message: 'Invalid UAE phone number. Must be a valid mobile (05X XXX XXXX) or landline (0X XXX XXXX) number',
    }
  );

/**
 * Emirates ID Validation
 * Format: 784-YYYY-NNNNNNN-N (15 digits)
 */
export const emiratesIdSchema = z
  .string()
  .trim()
  .regex(/^784-?\d{4}-?\d{7}-?\d$/, 'Invalid Emirates ID format. Expected: 784-YYYY-NNNNNNN-N');

// ============= EMAIL VALIDATION =============

/**
 * RFC 5322 Compliant Email Validation
 * More strict than default Zod email validation
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters')
  .regex(
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    'Invalid email format'
  );

// ============= DATE VALIDATIONS =============

/**
 * Future Date Validation
 * Ensures date is in the future (timezone-aware)
 */
export const futureDateSchema = z.coerce
  .date()
  .refine((date) => date > new Date(), {
    message: 'Date must be in the future',
  });

/**
 * Past Date Validation
 * Ensures date is in the past (timezone-aware)
 */
export const pastDateSchema = z.coerce
  .date()
  .refine((date) => date < new Date(), {
    message: 'Date must be in the past',
  });

/**
 * Date Range Validation
 * Ensures start date is before end date
 */
export const dateRangeSchema = z
  .object({
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
  })
  .refine((data) => data.start_date < data.end_date, {
    message: 'Start date must be before end date',
    path: ['end_date'],
  });

// ============= CURRENCY & AMOUNT VALIDATIONS =============

/**
 * AED Amount Validation
 * Validates currency amounts in AED (positive, max 2 decimal places)
 */
export const aedAmountSchema = z
  .number()
  .positive('Amount must be positive')
  .max(999999999.99, 'Amount too large')
  .refine((val) => Number.isInteger(val * 100), {
    message: 'Amount can have maximum 2 decimal places',
  });

/**
 * Salary Validation (UAE Labor Law Compliant)
 * Minimum wage varies by education level
 */
export const salarySchema = z
  .number()
  .positive('Salary must be positive')
  .min(1000, 'Salary must be at least AED 1,000 per month')
  .max(1000000, 'Salary exceeds maximum validation threshold');

// ============= TEXT VALIDATIONS =============

/**
 * Name Validation
 * Allows letters, spaces, hyphens, and apostrophes
 */
export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\u0600-\u06FF\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

/**
 * Company Name Validation
 */
export const companyNameSchema = z
  .string()
  .trim()
  .min(2, 'Company name must be at least 2 characters')
  .max(200, 'Company name must be less than 200 characters');

/**
 * Address Validation
 */
export const addressSchema = z
  .string()
  .trim()
  .min(10, 'Address must be at least 10 characters')
  .max(500, 'Address must be less than 500 characters');

// ============= LETTER-SPECIFIC VALIDATIONS =============

/**
 * Notice Period Validation (UAE Labor Law)
 * Minimum 30 days, maximum 90 days (typical)
 */
export const noticePeriodSchema = z
  .number()
  .int('Notice period must be a whole number')
  .min(30, 'Notice period must be at least 30 days (UAE Labor Law)')
  .max(90, 'Notice period cannot exceed 90 days');

/**
 * Years of Service Validation
 */
export const yearsOfServiceSchema = z
  .number()
  .nonnegative('Years of service cannot be negative')
  .max(50, 'Years of service exceeds reasonable threshold');

// ============= LEASE TERMINATION VALIDATIONS =============

export const leaseTerminationSchema = z.object({
  landlord_name: nameSchema,
  landlord_address: addressSchema,
  landlord_phone: uaePhoneSchema,
  landlord_email: emailSchema,
  
  tenant_name: nameSchema,
  tenant_address: addressSchema,
  tenant_phone: uaePhoneSchema,
  tenant_email: emailSchema,
  
  property_address: addressSchema,
  lease_start_date: pastDateSchema,
  lease_end_date: futureDateSchema,
  
  notice_date: z.coerce.date(),
  termination_date: futureDateSchema,
  
  monthly_rent: aedAmountSchema,
  security_deposit: aedAmountSchema.optional(),
  
  reason_for_termination: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

// ============= EMPLOYMENT CONTRACT VALIDATIONS =============

export const employmentContractSchema = z.object({
  company_name: companyNameSchema,
  company_address: addressSchema,
  company_license_number: z.string().trim().optional(),
  
  employee_name: nameSchema,
  employee_nationality: z.string().min(2).max(100),
  passport_or_emirates_id: z.string().trim().min(5, 'ID must be at least 5 characters'),
  employee_address: addressSchema,
  employee_email: emailSchema,
  employee_phone: uaePhoneSchema,
  
  job_title: z.string().min(2).max(200),
  department: z.string().min(2).max(100).optional(),
  
  start_date: z.coerce.date(),
  contract_type: z.enum(['limited', 'unlimited']),
  contract_duration: z.string().optional(),
  
  basic_salary: salarySchema,
  housing_allowance: z.union([z.literal('provided'), aedAmountSchema, z.literal('none')]),
  transport_allowance: z.union([z.literal('provided'), aedAmountSchema, z.literal('none')]),
  
  working_hours_per_week: z.number().min(1).max(48, 'Working hours cannot exceed 48 hours per week (UAE Labor Law)'),
  annual_leave_days: z.number().min(30, 'Annual leave must be at least 30 days (UAE Labor Law)'),
  
  probation_period: z.enum(['none', '3_months', '6_months']).optional(),
});

// ============= EMPLOYMENT TERMINATION VALIDATIONS =============

export const employmentTerminationSchema = z.object({
  company_name: companyNameSchema,
  company_address: addressSchema,
  
  employee_name: nameSchema,
  employee_id: z.string().trim().min(1),
  position: z.string().min(2).max(200),
  employee_email: emailSchema,
  employee_address: addressSchema,
  
  notice_date: z.coerce.date(),
  termination_date: futureDateSchema,
  final_working_day: futureDateSchema,
  
  termination_reason: z.string().min(10, 'Reason must be at least 10 characters').max(1000),
  
  basic_salary: salarySchema,
  notice_period_required: noticePeriodSchema,
  notice_period_provided: z.number().int().nonnegative(),
  
  accrued_leave_days: z.number().int().nonnegative().max(90),
  gratuity_years: yearsOfServiceSchema,
  gratuity_amount: aedAmountSchema.optional(),
  
  property_to_return: z.enum(['yes', 'no']),
  settlement_timeline: z.string().min(5, 'Settlement timeline required'),
});

// ============= HELPER FUNCTIONS =============

/**
 * Safe parse with detailed error messages
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
  
  return { success: false, errors };
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizeUAEPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Already in international format
  if (cleaned.startsWith('+971')) {
    return cleaned;
  }
  
  // Add +971 prefix
  if (cleaned.startsWith('00971')) {
    return '+' + cleaned.substring(2);
  }
  
  if (cleaned.startsWith('971')) {
    return '+' + cleaned;
  }
  
  // Local format (0XX XXX XXXX)
  if (cleaned.startsWith('0')) {
    return '+971' + cleaned.substring(1);
  }
  
  return '+971' + cleaned;
}

/**
 * Validate and normalize email
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
