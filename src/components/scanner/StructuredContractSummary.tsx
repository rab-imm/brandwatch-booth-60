import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"

export interface StructuredSummary {
  contractOverview: {
    description: string
    userRole: string
    counterparty: string
  }
  financials: {
    payments: string[]
    receipts: string[]
  }
  keyDates: {
    startDate: string | null
    endDate: string | null
    noticePeriod: string | null
    renewalTerms: string | null
  }
  termination: {
    userRights: string[]
    counterpartyRights: string[]
    penalties: string[]
    refundRules: string[]
  }
  autoRenewal: {
    hasAutoRenewal: boolean
    details: string | null
  }
  obligations: {
    userObligations: string[]
    counterpartyObligations: string[]
  }
}

interface Props {
  summary: StructuredSummary | null
  selectedParty?: { role: string; name?: string } | null
  counterpartyLabel?: string
}

const SectionHeader = ({ 
  icon, 
  title, 
  isOpen, 
  onToggle 
}: { 
  icon: string
  title: string
  isOpen: boolean
  onToggle: () => void 
}) => (
  <CollapsibleTrigger 
    onClick={onToggle}
    className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg transition-colors"
  >
    <div className="flex items-center gap-2">
      <Icon name={icon} className="h-4 w-4 text-primary" />
      <span className="font-semibold text-sm">{title}</span>
    </div>
    <Icon name={isOpen ? "chevron-up" : "chevron-down"} className="h-4 w-4 text-muted-foreground" />
  </CollapsibleTrigger>
)

const ListSection = ({ items, emptyText = "Not specified in document" }: { items: string[], emptyText?: string }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground italic">{emptyText}</p>
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-sm flex items-start gap-2">
          <span className="text-muted-foreground mt-0.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export const StructuredContractSummary = ({ summary, selectedParty, counterpartyLabel }: Props) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    financials: true,
    dates: false,
    termination: false,
    obligations: false
  })

  if (!summary) {
    return null
  }

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const yourLabel = selectedParty?.role || "You"
  const theirLabel = counterpartyLabel || summary.contractOverview?.counterparty || "Other Party"

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Icon name="file-text" className="h-5 w-5" />
          Contract Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contract Overview */}
        <Collapsible open={openSections.overview}>
          <SectionHeader 
            icon="info" 
            title="Contract Overview" 
            isOpen={openSections.overview}
            onToggle={() => toggleSection('overview')}
          />
          <CollapsibleContent>
            <div className="pl-6 pr-3 pb-3 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">What is this contract?</p>
                <p className="text-sm">{summary.contractOverview?.description || "Unable to determine"}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Your Role</p>
                  <Badge variant="outline">{summary.contractOverview?.userRole || yourLabel}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Other Party</p>
                  <Badge variant="secondary">{theirLabel}</Badge>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Auto-Renewal Alert */}
        {summary.autoRenewal?.hasAutoRenewal && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <Icon name="alert-triangle" className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              <span className="font-semibold">Auto-Renewal Alert:</span>{" "}
              {summary.autoRenewal.details || "This contract automatically renews. Review termination provisions carefully."}
            </AlertDescription>
          </Alert>
        )}

        {/* Financial Terms */}
        <Collapsible open={openSections.financials}>
          <SectionHeader 
            icon="dollar-sign" 
            title="Financial Terms" 
            isOpen={openSections.financials}
            onToggle={() => toggleSection('financials')}
          />
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 pr-3 pb-3">
              {/* What You Pay */}
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="arrow-up-right" className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">What You Pay</span>
                </div>
                <ListSection items={summary.financials?.payments || []} emptyText="No payment terms found" />
              </div>
              
              {/* What You Receive */}
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="arrow-down-left" className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">What You Receive</span>
                </div>
                <ListSection items={summary.financials?.receipts || []} emptyText="No deliverables found" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Key Dates */}
        <Collapsible open={openSections.dates}>
          <SectionHeader 
            icon="calendar" 
            title="Key Dates & Deadlines" 
            isOpen={openSections.dates}
            onToggle={() => toggleSection('dates')}
          />
          <CollapsibleContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-6 pr-3 pb-3">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium">{summary.keyDates?.startDate || "Not specified"}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="text-sm font-medium">{summary.keyDates?.endDate || "Not specified"}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Notice Period</p>
                <p className="text-sm font-medium">{summary.keyDates?.noticePeriod || "Not specified"}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Renewal</p>
                <p className="text-sm font-medium">{summary.keyDates?.renewalTerms || "Not specified"}</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Termination Rights */}
        <Collapsible open={openSections.termination}>
          <SectionHeader 
            icon="log-out" 
            title="Termination Rights" 
            isOpen={openSections.termination}
            onToggle={() => toggleSection('termination')}
          />
          <CollapsibleContent>
            <div className="space-y-3 pl-6 pr-3 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Your Exit Options */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="door-open" className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Your Exit Options</span>
                  </div>
                  <ListSection items={summary.termination?.userRights || []} emptyText="No termination rights found" />
                </div>
                
                {/* Their Exit Options */}
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="alert-circle" className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Their Exit Options</span>
                  </div>
                  <ListSection items={summary.termination?.counterpartyRights || []} emptyText="No termination rights found" />
                </div>
              </div>
              
              {/* Penalties & Refunds */}
              {((summary.termination?.penalties?.length || 0) > 0 || (summary.termination?.refundRules?.length || 0) > 0) && (
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="alert-triangle" className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">Penalties & Refund Rules</span>
                  </div>
                  <ListSection items={[...(summary.termination?.penalties || []), ...(summary.termination?.refundRules || [])]} />
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Obligations */}
        <Collapsible open={openSections.obligations}>
          <SectionHeader 
            icon="list-checks" 
            title="Obligations & Responsibilities" 
            isOpen={openSections.obligations}
            onToggle={() => toggleSection('obligations')}
          />
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 pr-3 pb-3">
              {/* Your Obligations */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="check-circle" className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Your Obligations</span>
                </div>
                <ListSection items={summary.obligations?.userObligations || []} emptyText="No obligations found" />
              </div>
              
              {/* Their Obligations */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="clipboard-list" className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Their Obligations</span>
                </div>
                <ListSection items={summary.obligations?.counterpartyObligations || []} emptyText="No obligations found" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
