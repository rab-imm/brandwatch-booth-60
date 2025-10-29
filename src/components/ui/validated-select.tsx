import * as React from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export interface ValidatedSelectProps {
  label?: string
  error?: string
  isValid?: boolean
  isDirty?: boolean
  showValidIcon?: boolean
  required?: boolean
  value?: string
  onValueChange?: (value: string) => void
  options: Array<{ value: string; label: string }> | string[]
  placeholder?: string
  id?: string
  disabled?: boolean
  naLabel?: string
}

export const ValidatedSelect = React.forwardRef<HTMLButtonElement, ValidatedSelectProps>(
  ({ 
    label, 
    error, 
    isValid, 
    isDirty, 
    required, 
    showValidIcon = false,
    value,
    onValueChange,
    options,
    placeholder,
    id,
    disabled,
    naLabel,
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${selectId}-error`
    const hasError = isDirty && error && !disabled

    // Normalize options to always be objects
    const normalizedOptions = options.map(opt => 
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    )

    return (
      <div className={cn("space-y-1.5", disabled && "opacity-60")}>
        {label && (
          <Label 
            htmlFor={selectId}
            className={cn(
              "flex items-center gap-1.5",
              hasError && "text-destructive",
              disabled && "text-muted-foreground"
            )}
          >
            <span>{label}</span>
            {required && !disabled && <span className="text-destructive ml-0.5">*</span>}
            {disabled && <span className="text-xs text-muted-foreground ml-2 font-normal">(N/A)</span>}
            {hasError && <AlertCircle className="h-3.5 w-3.5" />}
            {showValidIcon && isValid && isDirty && !error && !disabled && (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            )}
          </Label>
        )}
        <Select 
          value={disabled ? "" : value} 
          onValueChange={onValueChange}
          disabled={disabled}
        >
          <SelectTrigger 
            id={selectId}
            ref={ref}
            className={cn(
              hasError && "border-destructive focus:ring-destructive animate-shake",
              disabled && "bg-muted/50 text-muted-foreground cursor-not-allowed border-muted"
            )}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? errorId : undefined}
          >
            <SelectValue placeholder={disabled ? "Not Applicable" : (placeholder || `Select ${label || 'option'}`)} />
          </SelectTrigger>
          <SelectContent>
            {normalizedOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {disabled && naLabel && (
          <p className="text-xs text-muted-foreground italic">
            {naLabel}
          </p>
        )}
        {hasError && (
          <p 
            id={errorId}
            className="text-xs text-destructive flex items-center gap-1.5 animate-in fade-in-50 duration-200"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    )
  }
)

ValidatedSelect.displayName = "ValidatedSelect"
