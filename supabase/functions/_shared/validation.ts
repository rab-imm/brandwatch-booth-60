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
