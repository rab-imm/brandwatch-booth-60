interface CompanyCreditCounterProps {
  personalUsed: number
  personalLimit: number
  companyUsed: number
  companyTotal: number
  rolloverCredits?: number
}

export const CompanyCreditCounter = ({ 
  personalUsed, 
  personalLimit,
  companyUsed,
  companyTotal,
  rolloverCredits = 0
}: CompanyCreditCounterProps) => {
  const totalPersonalCredits = personalLimit + rolloverCredits
  const personalRemaining = Math.max(0, totalPersonalCredits - personalUsed)
  const personalPercentage = Math.min((personalUsed / totalPersonalCredits) * 100, 100)
  const isPersonalNearLimit = personalPercentage >= 80

  const companyRemaining = Math.max(0, companyTotal - companyUsed)
  const companyPercentage = Math.min((companyUsed / companyTotal) * 100, 100)
  const isCompanyNearLimit = companyPercentage >= 80

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Personal Allocation */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">
            Personal Allocation
          </span>
          <span className="text-sm text-muted-foreground">
            {personalUsed} / {totalPersonalCredits}
          </span>
        </div>
        
        {rolloverCredits > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Base: {personalLimit}</span>
            <span className="font-medium text-primary">+{rolloverCredits} rollover</span>
          </div>
        )}
        
        <div className="w-full bg-secondary rounded-full h-2.5 mb-2">
          <div 
            className={`h-2.5 rounded-full transition-all duration-300 ${
              isPersonalNearLimit 
                ? 'bg-destructive' 
                : personalPercentage > 60 
                  ? 'bg-warning' 
                  : 'bg-accent'
            }`}
            style={{ width: `${Math.min(personalPercentage, 100)}%` }}
          />
        </div>

        <div className="text-xs text-muted-foreground">
          {personalRemaining} personal credits remaining
        </div>
      </div>

      {/* Company Pool */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">
            Company Pool
          </span>
          <span className="text-sm text-muted-foreground">
            {companyUsed} / {companyTotal}
          </span>
        </div>
        
        <div className="w-full bg-secondary rounded-full h-2.5 mb-2">
          <div 
            className={`h-2.5 rounded-full transition-all duration-300 ${
              isCompanyNearLimit
                ? 'bg-destructive' 
                : companyPercentage > 60 
                  ? 'bg-warning' 
                  : 'bg-primary'
            }`}
            style={{ width: `${Math.min(companyPercentage, 100)}%` }}
          />
        </div>

        <div className="text-xs text-muted-foreground">
          {companyRemaining} company credits remaining
        </div>
      </div>
      
      {(isPersonalNearLimit || isCompanyNearLimit) && (
        <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-xs text-warning-foreground">
            {isPersonalNearLimit && isCompanyNearLimit
              ? "Both your personal and company credits are running low."
              : isPersonalNearLimit
                ? "Your personal credit allocation is running low. Contact your admin."
                : "Company credit pool is running low. Consider upgrading your plan."
            }
          </p>
        </div>
      )}
    </div>
  )
}
