import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { ExclamationTriangleIcon, LightningBoltIcon, ArrowRightIcon } from "@radix-ui/react-icons"

interface UpsellModalProps {
  creditsUsed: number
  subscriptionTier: string
  maxQueries: number
}

export const UpsellModal = ({ creditsUsed, subscriptionTier, maxQueries }: UpsellModalProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  const usagePercentage = (creditsUsed / maxQueries) * 100
  const shouldShow = usagePercentage >= 80 && subscriptionTier === 'free'

  useEffect(() => {
    // Show modal if usage is high and not dismissed this session
    if (shouldShow && !dismissed) {
      setIsOpen(true)
    }
  }, [shouldShow, dismissed])

  const handleDismiss = () => {
    setIsOpen(false)
    setDismissed(true)
  }

  const handleUpgrade = () => {
    navigate('/pricing')
    setIsOpen(false)
  }

  const creditsRemaining = maxQueries - creditsUsed

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-warning" />
            </div>
            <DialogTitle className="text-xl">Running Low on Credits</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            You have only <span className="font-semibold text-foreground">{creditsRemaining} {creditsRemaining === 1 ? 'credit' : 'credits'}</span> remaining 
            in your free plan. Upgrade now to get unlimited access and premium features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-4">
          <Button 
            onClick={handleUpgrade} 
            className="w-full gap-2"
            size="lg"
          >
            <LightningBoltIcon className="h-4 w-4" />
            Upgrade to Premium
            <ArrowRightIcon className="h-4 w-4 ml-auto" />
          </Button>
          
          <Button 
            onClick={handleDismiss} 
            variant="outline"
            className="w-full"
            size="lg"
          >
            Continue with Free Plan
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Premium plans start at just AED 99/month
        </p>
      </DialogContent>
    </Dialog>
  )
}
