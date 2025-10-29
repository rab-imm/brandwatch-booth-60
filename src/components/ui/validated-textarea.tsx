import * as React from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  isValid?: boolean
  isDirty?: boolean
  showValidIcon?: boolean
  showCharCount?: boolean
  naLabel?: string
}

const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    isValid, 
    isDirty, 
    required, 
    showValidIcon = false,
    showCharCount = false,
    maxLength,
    value,
    id,
    naLabel,
    disabled,
    placeholder,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${textareaId}-error`
    const hasError = isDirty && error && !disabled
    const charCount = typeof value === 'string' ? value.length : 0

    return (
      <div className={cn("space-y-1.5", disabled && "opacity-60")}>
        {label && (
          <div className="flex items-center justify-between">
            <Label 
              htmlFor={textareaId}
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
            {showCharCount && maxLength && !disabled && (
              <span className={cn(
                "text-xs text-muted-foreground",
                charCount > maxLength && "text-destructive"
              )}>
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}
        <Textarea
          id={textareaId}
          ref={ref}
          value={disabled ? "" : value}
          placeholder={disabled ? "Not Applicable" : placeholder}
          maxLength={maxLength}
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

ValidatedTextarea.displayName = "ValidatedTextarea"

export { ValidatedTextarea }
