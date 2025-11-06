import { useMemo } from 'react'
import { Progress } from '@/components/ui/progress'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

interface StrengthCheck {
  label: string
  met: boolean
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '', checks: [] }

    const checks: StrengthCheck[] = [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
      { label: 'Contains number', met: /[0-9]/.test(password) },
      { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) },
    ]

    const metCount = checks.filter(check => check.met).length
    const score = (metCount / checks.length) * 100

    let label = ''
    let color = ''

    if (score < 40) {
      label = 'Weak'
      color = 'text-destructive'
    } else if (score < 80) {
      label = 'Medium'
      color = 'text-yellow-600 dark:text-yellow-500'
    } else {
      label = 'Strong'
      color = 'text-green-600 dark:text-green-500'
    }

    return { score, label, color, checks }
  }, [password])

  if (!password) return null

  return (
    <div className={cn('space-y-2 mt-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Progress 
          value={strength.score} 
          className="h-2 flex-1"
          indicatorClassName={cn(
            'transition-all duration-300',
            strength.score < 40 && 'bg-destructive',
            strength.score >= 40 && strength.score < 80 && 'bg-yellow-600 dark:bg-yellow-500',
            strength.score >= 80 && 'bg-green-600 dark:bg-green-500'
          )}
        />
        <span className={cn('text-xs font-medium', strength.color)}>
          {strength.label}
        </span>
      </div>
      
      <div className="space-y-1">
        {strength.checks.map((check, index) => (
          <div key={index} className="flex items-center gap-1.5 text-xs">
            <Icon 
              name={check.met ? 'check' : 'x'} 
              size={12} 
              className={cn(
                check.met ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'
              )}
            />
            <span className={cn(
              check.met ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
