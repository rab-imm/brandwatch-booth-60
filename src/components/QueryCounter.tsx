import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { useNavigate } from "react-router-dom"

interface QueryCounterProps {
  queriesUsed: number
  subscriptionTier: string
  maxCredits?: number
  isCompanyUser?: boolean
  companyCredits?: { used: number; total: number }
}

export const QueryCounter = ({ 
  queriesUsed, 
  subscriptionTier, 
  maxCredits,
  isCompanyUser = false,
  companyCredits 
}: QueryCounterProps) => {
  const navigate = useNavigate()

  const getQueryLimit = (tier: string) => {
    if (maxCredits) return maxCredits
    switch (tier) {
      case 'free':
        return 10
      case 'essential':
        return 50
      case 'premium':
        return 200
      case 'sme':
        return 999999 // Unlimited
      case 'enterprise':
        return 999999 // Unlimited
      default:
        return 10
    }
  }

  const queryLimit = getQueryLimit(subscriptionTier)
  const usagePercentage = Math.min((queriesUsed / queryLimit) * 100, 100)
  const isNearLimit = usagePercentage >= 80

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Individual Usage */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {isCompanyUser ? "Personal Usage" : "Query Usage"}
          </span>
          <span className="text-sm text-muted-foreground">
            {queriesUsed} / {queryLimit === 999999 ? "∞" : queryLimit}
          </span>
        </div>
        
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
            {queryLimit === 999999 ? "Unlimited" : `${queryLimit - queriesUsed} queries remaining`}
          </span>
          {subscriptionTier === 'free' && isNearLimit && (
            <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/pricing')}>
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {/* Company Pool Usage (if applicable) */}
      {isCompanyUser && companyCredits && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Company Pool
            </span>
            <span className="text-sm text-muted-foreground">
              {companyCredits.used} / {companyCredits.total}
            </span>
          </div>
          
          <div className="w-full bg-secondary rounded-full h-2.5 mb-2">
            <div 
              className={`h-2.5 rounded-full transition-all duration-300 ${
                (companyCredits.used / companyCredits.total) * 100 >= 80
                  ? 'bg-destructive' 
                  : (companyCredits.used / companyCredits.total) * 100 > 60 
                    ? 'bg-warning' 
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((companyCredits.used / companyCredits.total) * 100, 100)}%` }}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            {companyCredits.total - companyCredits.used} company credits remaining
          </div>
        </div>
      )}
      
      {isNearLimit && (
        <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-xs text-warning-foreground">
            {subscriptionTier === 'free' 
              ? "You're running low on queries. Consider upgrading for more capacity."
              : "You're approaching your query limit for this period."
            }
          </p>
        </div>
      )}
    </div>
  )
}