import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

interface PersonalCreditCounterProps {
  creditsUsed: number
  subscriptionTier: string
  maxCredits?: number
  rolloverCredits?: number
}

export const PersonalCreditCounter = ({ 
  creditsUsed, 
  subscriptionTier, 
  maxCredits,
  rolloverCredits = 0
}: PersonalCreditCounterProps) => {
  const navigate = useNavigate()

  const getCreditLimit = (tier: string) => {
    if (maxCredits) return maxCredits
    switch (tier) {
      case 'free':
        return 10
      case 'essential':
        return 50
      case 'premium':
        return 200
      case 'sme':
        return 999999
      case 'enterprise':
        return 999999
      default:
        return 10
    }
  }

  const creditLimit = getCreditLimit(subscriptionTier)
  const totalAvailableCredits = creditLimit + rolloverCredits
  const creditsRemaining = Math.max(0, totalAvailableCredits - creditsUsed)
  const usagePercentage = Math.min((creditsUsed / totalAvailableCredits) * 100, 100)
  const isNearLimit = usagePercentage >= 80

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">
            Credit Usage
          </span>
          <span className="text-sm text-muted-foreground">
            {creditsUsed} / {creditLimit === 999999 ? "∞" : totalAvailableCredits}
          </span>
        </div>
        
        {rolloverCredits > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Base Credits: {creditLimit}</span>
            <span className="font-medium text-primary">+{rolloverCredits} rollover</span>
          </div>
        )}
        
        <div className="w-full bg-secondary rounded-full h-2.5 mb-2">
          <div 
            className={`h-2.5 rounded-full transition-all duration-300 ${
              isNearLimit 
                ? 'bg-destructive' 
                : usagePercentage > 60 
                  ? 'bg-warning' 
                  : 'bg-primary'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {creditLimit === 999999 ? "Unlimited" : `${creditsRemaining} credits remaining`}
          </span>
          {subscriptionTier === 'free' && isNearLimit && (
            <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/pricing')}>
              Upgrade
            </Button>
          )}
        </div>
      </div>
      
      {isNearLimit && (
        <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-xs text-warning-foreground">
            {subscriptionTier === 'free' 
              ? "You're running low on credits. Consider upgrading for more capacity."
              : "You're approaching your credit limit for this period."
            }
          </p>
        </div>
      )}
    </div>
  )
}
