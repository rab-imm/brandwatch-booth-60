import { useState, useEffect, useCallback } from 'react';
import { validateDate, DateValidationRule } from '@/lib/date-validation';

interface UseDateValidationProps {
  fieldName: string;
  value: string;
  allDetails: Record<string, any>;
  rules?: DateValidationRule[];
  required?: boolean;
}

export function useDateValidation({
  fieldName,
  value,
  allDetails,
  rules,
  required = false
}: UseDateValidationProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const validate = useCallback(() => {
    const result = validateDate(value, allDetails, rules || [], required);
    setError(result.error);
  }, [value, allDetails, rules, required]);

  useEffect(() => {
    if (value) setIsDirty(true);
    validate();
  }, [value, allDetails, validate]);

  return { error, isDirty, isValid: !error };
}
