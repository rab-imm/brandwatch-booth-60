/**
 * Phase 1: Date Utility Functions
 * Timezone-aware date operations for UAE (UTC+4)
 */

// UAE timezone offset (UTC+4, no DST)
export const UAE_TIMEZONE = 'Asia/Dubai';
export const UAE_UTC_OFFSET = 4;

/**
 * Get current date/time in UAE timezone
 */
export function getUAEDate(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: UAE_TIMEZONE })
  );
}

/**
 * Convert any date to UAE timezone
 */
export function toUAETimezone(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return new Date(
    inputDate.toLocaleString('en-US', { timeZone: UAE_TIMEZONE })
  );
}

/**
 * Format date in UAE-friendly format (DD MMMM YYYY)
 */
export function formatUAEDate(date: Date | string): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate.toLocaleDateString('en-AE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: UAE_TIMEZONE,
  });
}

/**
 * Calculate business days between two dates (excluding weekends)
 * UAE weekend: Friday & Saturday
 */
export function calculateBusinessDays(
  startDate: Date,
  endDate: Date
): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const day = current.getDay();
    // Exclude Friday (5) and Saturday (6) - UAE weekend
    if (day !== 5 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Add business days to a date (excluding UAE weekends)
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    // Skip Friday (5) and Saturday (6)
    if (day !== 5 && day !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

/**
 * Calculate notice period end date accounting for UAE weekends
 * UAE Labor Law: Notice period is calculated in calendar days
 */
export function calculateNoticePeriodEndDate(
  noticeStartDate: Date,
  noticePeriodDays: number
): Date {
  const result = new Date(noticeStartDate);
  result.setDate(result.getDate() + noticePeriodDays);
  return result;
}

/**
 * Calculate gratuity based on years of service (UAE Labor Law)
 * - Less than 1 year: No gratuity
 * - 1-5 years: 21 days salary per year
 * - 5+ years: 21 days × 5 years + 30 days × remaining years
 */
export function calculateGratuity(
  yearsOfService: number,
  monthlySalary: number
): { amount: number; calculation: string } {
  if (yearsOfService < 1) {
    return {
      amount: 0,
      calculation: 'Not eligible (less than 1 year of service)',
    };
  }
  
  const dailySalary = monthlySalary / 30;
  let gratuity = 0;
  let calculation = '';
  
  if (yearsOfService <= 5) {
    gratuity = 21 * dailySalary * yearsOfService;
    calculation = `21 days × ${yearsOfService} years = ${21 * yearsOfService} days (AED ${gratuity.toFixed(2)})`;
  } else {
    const first5Years = 21 * dailySalary * 5;
    const remainingYears = yearsOfService - 5;
    const beyond5Years = 30 * dailySalary * remainingYears;
    gratuity = first5Years + beyond5Years;
    calculation = `(21 days × 5 years) + (30 days × ${remainingYears} years) = ${105 + 30 * remainingYears} days (AED ${gratuity.toFixed(2)})`;
  }
  
  return { amount: Math.round(gratuity * 100) / 100, calculation };
}

/**
 * Validate if notice period complies with UAE Labor Law
 * Minimum 30 days for unlimited contracts, 30 days for limited contracts
 */
export function validateNoticePeriod(
  noticeDate: Date,
  terminationDate: Date,
  contractType: 'limited' | 'unlimited'
): {
  isValid: boolean;
  actualDays: number;
  requiredDays: number;
  message: string;
} {
  const actualDays = Math.floor(
    (terminationDate.getTime() - noticeDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const requiredDays = 30; // UAE Labor Law minimum
  
  if (actualDays < requiredDays) {
    return {
      isValid: false,
      actualDays,
      requiredDays,
      message: `Notice period of ${actualDays} days is less than the required ${requiredDays} days. Payment in lieu required for ${requiredDays - actualDays} days.`,
    };
  }
  
  return {
    isValid: true,
    actualDays,
    requiredDays,
    message: `Notice period of ${actualDays} days complies with UAE Labor Law (minimum ${requiredDays} days).`,
  };
}

/**
 * Calculate annual leave accrual (UAE Labor Law)
 * - First year: 2 days per month (24 days total)
 * - After 1 year: 30 days per year
 */
export function calculateAnnualLeaveAccrual(
  employmentStartDate: Date,
  calculationDate: Date = new Date()
): { totalDays: number; calculation: string } {
  const monthsWorked = Math.floor(
    (calculationDate.getTime() - employmentStartDate.getTime()) /
      (1000 * 60 * 60 * 24 * 30)
  );
  
  if (monthsWorked < 12) {
    const days = monthsWorked * 2;
    return {
      totalDays: days,
      calculation: `${monthsWorked} months × 2 days/month = ${days} days`,
    };
  }
  
  const years = Math.floor(monthsWorked / 12);
  const remainingMonths = monthsWorked % 12;
  const fullYearDays = years * 30;
  const partialYearDays = Math.floor((remainingMonths / 12) * 30);
  const totalDays = fullYearDays + partialYearDays;
  
  return {
    totalDays,
    calculation: `${years} years × 30 days + ${remainingMonths} months pro-rata = ${totalDays} days`,
  };
}

/**
 * Check if a date falls on UAE weekend (Friday or Saturday)
 */
export function isUAEWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday or Saturday
}

/**
 * Get next working day (skip UAE weekend)
 */
export function getNextWorkingDay(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  
  while (isUAEWeekend(result)) {
    result.setDate(result.getDate() + 1);
  }
  
  return result;
}

/**
 * Normalize date to start of day in UAE timezone
 */
export function normalizeToUAEDate(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const uaeDate = toUAETimezone(inputDate);
  uaeDate.setHours(0, 0, 0, 0);
  return uaeDate;
}

/**
 * Compare two dates ignoring time (UAE timezone)
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = normalizeToUAEDate(date1);
  const d2 = normalizeToUAEDate(date2);
  return d1.getTime() === d2.getTime();
}

/**
 * Check if date is in the past (UAE timezone)
 */
export function isPastDate(date: Date | string): boolean {
  const checkDate = normalizeToUAEDate(date);
  const today = normalizeToUAEDate(getUAEDate());
  return checkDate < today;
}

/**
 * Check if date is in the future (UAE timezone)
 */
export function isFutureDate(date: Date | string): boolean {
  const checkDate = normalizeToUAEDate(date);
  const today = normalizeToUAEDate(getUAEDate());
  return checkDate > today;
}
