import { useState, useEffect, useCallback, useRef } from 'react'
import { z } from 'zod'

interface ValidationResult {
  isValid: boolean
  error: string | null
  isDirty: boolean
}

interface UseFieldValidationProps {
  value: any
  validator?: z.ZodSchema
  required?: boolean
  debounceMs?: number
}

export function useFieldValidation({
  value,
  validator,
  required = false,
  debounceMs = 300,
}: UseFieldValidationProps): ValidationResult {
  const [isDirty, setIsDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const initialValueRef = useRef(value)

  const validate = useCallback((valueToValidate: any) => {
    // Check if required field is empty
    if (required && (!valueToValidate || (typeof valueToValidate === 'string' && valueToValidate.trim() === ''))) {
      setError('This field is required')
      setIsValid(false)
      return
    }

    // If no validator provided and not required (or has value), it's valid
    if (!validator) {
      setError(null)
      setIsValid(true)
      return
    }

    // Skip validation if field is empty and not required
    if (!required && (!valueToValidate || (typeof valueToValidate === 'string' && valueToValidate.trim() === ''))) {
      setError(null)
      setIsValid(true)
      return
    }

    // Run Zod validation
    const result = validator.safeParse(valueToValidate)
    
    if (result.success) {
      setError(null)
      setIsValid(true)
    } else {
      const firstError = result.error.issues[0]
      setError(firstError.message)
      setIsValid(false)
    }
  }, [validator, required])

  useEffect(() => {
    // Mark as dirty if value changed from initial
    if (value !== initialValueRef.current) {
      setIsDirty(true)
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce validation
    timeoutRef.current = setTimeout(() => {
      validate(value)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, validate, debounceMs])

  return {
    isValid,
    error,
    isDirty,
  }
}
