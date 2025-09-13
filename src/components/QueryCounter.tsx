import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { useNavigate } from "react-router-dom"

interface QueryCounterProps {
  queriesUsed: number
  subscriptionTier: string
}

export const QueryCounter = ({ queriesUsed, subscriptionTier }: QueryCounterProps) => {
  const navigate = useNavigate()
  
  const getQueryLimit = () => {
    switch (subscriptionTier) {
      case 'free':
        return 5
      case 'pro':
        return 100
      case 'enterprise':
        return 1000
      default:
        return 5
    }
  }

  const queryLimit = getQueryLimit()
  const usagePercentage = Math.min((queriesUsed / queryLimit) * 100, 100)

  const getStatusColor = () => {
    if (usagePercentage >= 100) return 'text-destructive'
    if (usagePercentage >= 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Icon name="zap" className={`w-4 h-4 ${getStatusColor()}`} />
          <span className="text-sm font-medium">
            Query Usage: {queriesUsed} / {queryLimit}
          </span>
        </div>
        
        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              usagePercentage >= 100
                ? 'bg-destructive'
                : usagePercentage >= 80
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>

        <span className="text-xs text-muted-foreground capitalize">
          {subscriptionTier} Plan
        </span>
      </div>

      {subscriptionTier === 'free' && usagePercentage >= 80 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/pricing')}
          className="ml-4"
        >
          <Icon name="arrow-up" className="w-4 h-4 mr-1" />
          Upgrade
        </Button>
      )}
    </div>
  )
}