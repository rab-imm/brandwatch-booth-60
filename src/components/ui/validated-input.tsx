import * as React from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  isValid?: boolean
  isDirty?: boolean
  showValidIcon?: boolean
}

const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, label, error, isValid, isDirty, required, showValidIcon = false, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${inputId}-error`
    const hasError = isDirty && error

    return (
      <div className="space-y-1.5">
        {label && (
          <Label 
            htmlFor={inputId}
            className={cn(
              "flex items-center gap-1.5",
              hasError && "text-destructive"
            )}
          >
            <span>{label}</span>
            {required && <span className="text-destructive">*</span>}
            {hasError && <AlertCircle className="h-3.5 w-3.5" />}
            {showValidIcon && isValid && isDirty && !error && (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            )}
          </Label>
        )}
        <Input
          id={inputId}
          ref={ref}
          className={cn(
            hasError && "border-destructive focus-visible:ring-destructive animate-shake",
            className
          )}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={hasError ? errorId : undefined}
          {...props}
        />
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

ValidatedInput.displayName = "ValidatedInput"

export { ValidatedInput }
