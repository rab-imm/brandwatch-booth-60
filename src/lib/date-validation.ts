import { isAfter, isBefore, startOfDay, subMonths, differenceInDays } from 'date-fns';

/**
 * Date validation utilities for relationship-based date validation
 */

export interface DateValidationRule {
  relatedField?: string;
  type: 'mustBeAfter' | 'mustBeBefore' | 'cannotBeFuture' | 'cannotBeTooOld';
  errorMessage: string;
  minDaysDiff?: number;
}

export interface DateValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validate date against multiple rules
 */
export function validateDate(
  value: string,
  allDetails: Record<string, any>,
  rules: DateValidationRule[],
  required: boolean = false
): DateValidationResult {
  // Required validation
  if (required && !value) {
    return { isValid: false, error: 'This date is required' };
  }

  if (!value || !rules || rules.length === 0) {
    return { isValid: true, error: null };
  }

  const currentDate = startOfDay(new Date(value));
  const today = startOfDay(new Date());

  // Check each rule
  for (const rule of rules) {
    switch (rule.type) {
      case 'mustBeAfter':
        if (rule.relatedField) {
          const relatedDate = allDetails[rule.relatedField];
          if (relatedDate) {
            const relatedDateObj = startOfDay(new Date(relatedDate));
            if (!isAfter(currentDate, relatedDateObj)) {
              return { isValid: false, error: rule.errorMessage };
            }
            // Check minimum days difference if specified
            if (rule.minDaysDiff) {
              const daysDiff = differenceInDays(currentDate, relatedDateObj);
              const minDays = allDetails.minNoticePeriod || rule.minDaysDiff;
              if (daysDiff < minDays) {
                return {
                  isValid: false,
                  error: `Notice period (${daysDiff} days) is less than minimum (${minDays} days)`
                };
              }
            }
          }
        }
        break;

      case 'mustBeBefore':
        if (rule.relatedField) {
          const relatedDate = allDetails[rule.relatedField];
          if (relatedDate) {
            const relatedDateObj = startOfDay(new Date(relatedDate));
            if (!isBefore(currentDate, relatedDateObj)) {
              return { isValid: false, error: rule.errorMessage };
            }
          }
        }
        break;

      case 'cannotBeFuture':
        if (isAfter(currentDate, today)) {
          return { isValid: false, error: rule.errorMessage };
        }
        break;

      case 'cannotBeTooOld':
        if (isBefore(currentDate, subMonths(today, 6))) {
          return { isValid: false, error: rule.errorMessage };
        }
        break;
    }
  }

  return { isValid: true, error: null };
}

/**
 * Get all fields that a date field depends on
 */
export function getRelatedDateFields(rules?: DateValidationRule[]): string[] {
  if (!rules) return [];
  return rules
    .filter(rule => rule.relatedField)
    .map(rule => rule.relatedField!);
}
