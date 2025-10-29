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
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${textareaId}-error`
    const hasError = isDirty && error
    const charCount = typeof value === 'string' ? value.length : 0

    return (
      <div className="space-y-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <Label 
              htmlFor={textareaId}
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
            {showCharCount && maxLength && (
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
          value={value}
          maxLength={maxLength}
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

ValidatedTextarea.displayName = "ValidatedTextarea"

export { ValidatedTextarea }
