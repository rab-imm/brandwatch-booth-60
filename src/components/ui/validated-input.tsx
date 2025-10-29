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
  naLabel?: string
}

const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, label, error, isValid, isDirty, required, showValidIcon = false, id, naLabel, disabled, value, placeholder, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${inputId}-error`
    const hasError = isDirty && error && !disabled

    return (
      <div className={cn("space-y-1.5", disabled && "opacity-60")}>
        {label && (
          <Label 
            htmlFor={inputId}
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
        <Input
          id={inputId}
          ref={ref}
          value={disabled ? "" : value}
          placeholder={disabled ? "Not Applicable" : placeholder}
          disabled={disabled}
          className={cn(
            hasError && "border-destructive focus-visible:ring-destructive animate-shake",
            disabled && "bg-muted/50 text-muted-foreground cursor-not-allowed border-muted",
            className
          )}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={hasError ? errorId : undefined}
          {...props}
        />
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

ValidatedInput.displayName = "ValidatedInput"

export { ValidatedInput }
