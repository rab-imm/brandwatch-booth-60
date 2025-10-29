/**
 * Phase 1: Server-Side Validation Library
 * For use in Supabase Edge Functions
 */

/**
 * Validate email format (RFC 5322 simplified)
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length < 5 || trimmed.length > 255) {
    return { valid: false, error: 'Email must be between 5 and 255 characters' };
  }
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

/**
 * Validate UAE phone number
 */
export function validateUAEPhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }
  
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // UAE mobile patterns
  const mobilePattern = /^(\+971|00971|971)?(50|52|54|55|56|58)\d{7}$/;
  const localMobilePattern = /^(050|052|054|055|056|058)\d{7}$/;
  
  // UAE landline patterns
  const landlinePattern = /^(\+971|00971|971)?(2|3|4|6|7|9)\d{7}$/;
  const localLandlinePattern = /^(02|03|04|06|07|09)\d{7}$/;
  
  const isValid = mobilePattern.test(cleaned) ||
    localMobilePattern.test(cleaned) ||
    landlinePattern.test(cleaned) ||
    localLandlinePattern.test(cleaned);
  
  if (!isValid) {
    return { valid: false, error: 'Invalid UAE phone number' };
  }
  
  return { valid: true };
}

/**
 * Validate amount (positive number with max 2 decimals)
 */
export function validateAmount(amount: number): { valid: boolean; error?: string } {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a number' };
  }
  
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be positive' };
  }
  
  if (amount > 999999999.99) {
    return { valid: false, error: 'Amount too large' };
  }
  
  // Check decimal places
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { valid: false, error: 'Amount can have maximum 2 decimal places' };
  }
  
  return { valid: true };
}

/**
 * Validate date is in the future
 */
export function validateFutureDate(date: string | Date): { valid: boolean; error?: string } {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(inputDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (inputDate <= new Date()) {
    return { valid: false, error: 'Date must be in the future' };
  }
  
  return { valid: true };
}

/**
 * Validate date is in the past
 */
export function validatePastDate(date: string | Date): { valid: boolean; error?: string } {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(inputDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (inputDate >= new Date()) {
    return { valid: false, error: 'Date must be in the past' };
  }
  
  return { valid: true };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string = 'Field'
): { valid: boolean; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  
  const trimmed = value.trim();
  
  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }
  
  return { valid: true };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): { valid: boolean; error?: string } {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: 'UUID is required' };
  }
  
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }
  
  return { valid: true };
}

/**
 * Sanitize string to prevent injection attacks
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .trim();
}

/**
 * Validate notice period (UAE Labor Law)
 */
export function validateNoticePeriod(days: number): { valid: boolean; error?: string } {
  if (typeof days !== 'number' || isNaN(days)) {
    return { valid: false, error: 'Notice period must be a number' };
  }
  
  if (days < 30) {
    return { valid: false, error: 'Notice period must be at least 30 days (UAE Labor Law)' };
  }
  
  if (days > 90) {
    return { valid: false, error: 'Notice period cannot exceed 90 days' };
  }
  
  return { valid: true };
}

/**
 * Validate salary (UAE minimum wage)
 */
export function validateSalary(salary: number): { valid: boolean; error?: string } {
  if (typeof salary !== 'number' || isNaN(salary)) {
    return { valid: false, error: 'Salary must be a number' };
  }
  
  if (salary < 1000) {
    return { valid: false, error: 'Salary must be at least AED 1,000 per month' };
  }
  
  if (salary > 1000000) {
    return { valid: false, error: 'Salary exceeds maximum validation threshold' };
  }
  
  return { valid: true };
}

/**
 * Validate Emirates ID format (784-XXXX-XXXXXXX-X)
 */
export function validateEmiratesId(emiratesId: string): { valid: boolean; error?: string } {
  if (!emiratesId || typeof emiratesId !== 'string') {
    return { valid: false, error: 'Emirates ID is required' };
  }
  
  const cleaned = emiratesId.replace(/-/g, '');
  const emiratesIdRegex = /^784\d{12}$/;
  
  if (!emiratesIdRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid Emirates ID format. Expected: 784-XXXX-XXXXXXX-X' };
  }
  
  return { valid: true };
}

/**
 * Validate reference number (numbers only)
 */
export function validateReferenceNumber(refNumber: string): { valid: boolean; error?: string } {
  if (!refNumber || typeof refNumber !== 'string') {
    return { valid: false, error: 'Reference number is required' };
  }
  
  const numbersOnlyRegex = /^[0-9]+$/;
  
  if (!numbersOnlyRegex.test(refNumber.trim())) {
    return { valid: false, error: 'Reference number must contain numbers only' };
  }
  
  return { valid: true };
}

/**
 * Validate all letter type fields
 */
export function validateLetterFields(
  letterType: string,
  details: Record<string, any>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Handle null/undefined details
  if (!details || typeof details !== 'object') {
    return { valid: false, errors: { _general: 'Invalid details provided' } };
  }
  
  // Common validations for all letters
  Object.entries(details).forEach(([key, value]) => {
    if (!value) return; // Skip empty fields
    
    // Email fields
    if (key.toLowerCase().includes('email')) {
      const result = validateEmail(value);
      if (!result.valid) errors[key] = result.error!;
    }
    
    // Phone fields
    if (key.toLowerCase().includes('phone')) {
      const result = validateUAEPhone(value);
      if (!result.valid) errors[key] = result.error!;
    }
    
    // Emirates ID fields
    if (key.toLowerCase().includes('emiratesid')) {
      const result = validateEmiratesId(value);
      if (!result.valid) errors[key] = result.error!;
    }
    
    // Amount fields
    if (key === 'amount' || key.includes('salary') || key.includes('rent') || key.includes('Salary') || key.includes('Rent')) {
      const result = validateAmount(parseFloat(value));
      if (!result.valid) errors[key] = result.error!;
    }
    
    // Reference/Invoice number fields
    if (key.toLowerCase().includes('referencenumber') || key.toLowerCase().includes('invoicenumber')) {
      const result = validateReferenceNumber(value);
      if (!result.valid) errors[key] = result.error!;
    }
  });
  
  // Letter-type-specific validations
  if (letterType === 'employment_termination') {
    if (details.noticePeriodProvided) {
      const result = validateNoticePeriod(parseInt(details.noticePeriodProvided));
      if (!result.valid) errors.noticePeriodProvided = result.error!;
    }
    
    if (details.basicSalary) {
      const result = validateSalary(parseFloat(details.basicSalary));
      if (!result.valid) errors.basicSalary = result.error!;
    }
  }
  
  if (letterType === 'employment_contract') {
    if (details.basicSalary) {
      const result = validateSalary(parseFloat(details.basicSalary));
      if (!result.valid) errors.basicSalary = result.error!;
    }
    
    if (details.probationPeriod) {
      const months = parseInt(details.probationPeriod);
      if (months > 6) {
        errors.probationPeriod = 'Probation period cannot exceed 6 months per UAE law';
      }
    }
    
    if (details.workingHoursPerWeek) {
      const hours = parseInt(details.workingHoursPerWeek);
      if (hours > 48) {
        errors.workingHoursPerWeek = 'Working hours cannot exceed 48 hours per week per UAE law';
      }
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Batch validation helper
 */
export function batchValidate(
  validations: Array<{ valid: boolean; error?: string }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const validation of validations) {
    if (!validation.valid && validation.error) {
      errors.push(validation.error);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
