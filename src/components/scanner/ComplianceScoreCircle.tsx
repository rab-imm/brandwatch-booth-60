import { Badge } from "@/components/ui/badge"

interface ComplianceScoreCircleProps {
  score: number
  label: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
}

export const ComplianceScoreCircle = ({ score, label, subtitle, size = 'lg' }: ComplianceScoreCircleProps) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--chart-2))'
    if (score >= 60) return 'hsl(var(--chart-3))'
    return 'hsl(var(--chart-1))'
  }
  
  const getTextColor = (score: number) => {
    if (score >= 80) return 'text-chart-2'
    if (score >= 60) return 'text-chart-3'
    return 'text-chart-1'
  }
  
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference
  
  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Circular progress SVG */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            opacity="0.2"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${getTextColor(score)}`}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="font-semibold text-sm">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}
