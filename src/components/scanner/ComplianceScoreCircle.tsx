import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TooltipData {
  title: string
  description: string
  factors: string[]
}

interface ComplianceScoreCircleProps {
  score: number
  label: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
  tooltipContent?: TooltipData
}

export const ComplianceScoreCircle = ({ score, label, subtitle, size = 'lg', tooltipContent }: ComplianceScoreCircleProps) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 66) return 'hsl(142, 76%, 36%)'   // Green
    if (score >= 33) return 'hsl(45, 93%, 47%)'    // Yellow
    return 'hsl(0, 84%, 60%)'                       // Red
  }
  
  const getTextColor = (score: number) => {
    if (score >= 66) return 'text-green-600'
    if (score >= 33) return 'text-yellow-500'
    return 'text-red-500'
  }
  
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  const scoreCircle = (
    <div className={`${sizeClasses[size]} relative cursor-help`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          opacity="0.2"
        />
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
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getTextColor(score)}`}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
  
  return (
    <div className="flex flex-col items-center">
      {tooltipContent ? (
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              {scoreCircle}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs p-4">
              <div className="space-y-2">
                <p className="font-semibold">{tooltipContent.title}</p>
                <p className="text-sm text-muted-foreground">{tooltipContent.description}</p>
                <div className="text-xs">
                  <p className="font-medium mb-1">Based on:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {tooltipContent.factors.map((factor, i) => (
                      <li key={i}>{factor}</li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-600"></span>
                    <span>66-100: Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span>33-65: Needs Attention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span>0-32: Critical</span>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        scoreCircle
      )}
      
      <div className="mt-4 text-center">
        <p className="font-semibold text-sm">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}
