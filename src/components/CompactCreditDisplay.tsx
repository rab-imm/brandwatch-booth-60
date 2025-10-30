import { Icon } from "@/components/ui/Icon"

interface CompactCreditDisplayProps {
  creditsUsed: number
  creditsTotal: number
  type?: 'personal' | 'company'
}

export const CompactCreditDisplay = ({ 
  creditsUsed, 
  creditsTotal,
  type = 'personal'
}: CompactCreditDisplayProps) => {
  const remaining = Math.max(0, creditsTotal - creditsUsed)
  const percentage = Math.min((creditsUsed / creditsTotal) * 100, 100)
  const isLow = percentage >= 80
  const isMedium = percentage >= 60 && percentage < 80

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg">
      <Icon 
        name={type === 'company' ? 'building' : 'zap'} 
        className={`h-4 w-4 ${isLow ? 'text-destructive' : isMedium ? 'text-warning' : 'text-primary'}`} 
      />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">
            {remaining} / {creditsTotal === 999999 ? "∞" : creditsTotal}
          </span>
        </div>
        <div className="w-16 bg-secondary rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all ${
              isLow ? 'bg-destructive' : isMedium ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
