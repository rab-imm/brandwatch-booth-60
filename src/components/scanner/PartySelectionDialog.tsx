import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export interface IdentifiedParty {
  role: string
  name?: string
  type?: 'company' | 'individual' | 'organization' | 'unknown'
}

interface PartySelectionDialogProps {
  open: boolean
  parties: IdentifiedParty[]
  documentType?: string
  onSelect: (party: IdentifiedParty | null) => void
  onSkip: () => void
}

const getPartyIcon = (type?: string): string => {
  switch (type) {
    case 'company':
      return 'building'
    case 'individual':
      return 'user'
    case 'organization':
      return 'users'
    default:
      return 'user'
  }
}

const formatPartyType = (type?: string): string => {
  switch (type) {
    case 'company':
      return 'Company'
    case 'individual':
      return 'Individual'
    case 'organization':
      return 'Organization'
    default:
      return 'Party'
  }
}

export const PartySelectionDialog = ({ 
  open, 
  parties, 
  documentType,
  onSelect, 
  onSkip 
}: PartySelectionDialogProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleContinue = () => {
    if (selectedIndex !== null && parties[selectedIndex]) {
      onSelect(parties[selectedIndex])
    } else {
      onSkip()
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Icon name="users" className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>We identified these parties</DialogTitle>
              {documentType && (
                <DialogDescription className="text-xs mt-0.5">
                  in your {documentType}
                </DialogDescription>
              )}
            </div>
          </div>
          <DialogDescription className="mt-2">
            Which party are you in this contract? This helps us highlight what matters most to you.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup 
            value={selectedIndex?.toString()} 
            onValueChange={(val) => setSelectedIndex(parseInt(val))}
            className="space-y-3"
          >
            {parties.map((party, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center space-x-4 rounded-xl border-2 p-4 transition-all cursor-pointer",
                  selectedIndex === index 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-primary/50"
                )}
                onClick={() => setSelectedIndex(index)}
              >
                <RadioGroupItem value={index.toString()} id={`party-${index}`} />
                <Label 
                  htmlFor={`party-${index}`} 
                  className="flex-1 cursor-pointer flex items-center gap-3"
                >
                  <div className={cn(
                    "p-2 rounded-full",
                    party.type === 'company' ? "bg-blue-500/10" :
                    party.type === 'individual' ? "bg-green-500/10" :
                    "bg-muted"
                  )}>
                    <Icon 
                      name={getPartyIcon(party.type)} 
                      className={cn(
                        "h-4 w-4",
                        party.type === 'company' ? "text-blue-500" :
                        party.type === 'individual' ? "text-green-500" :
                        "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{party.role}</p>
                    {party.name && (
                      <p className="text-xs text-muted-foreground">{party.name}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatPartyType(party.type)}
                  </span>
                </Label>
              </div>
            ))}

            {/* Not sure option */}
            <div
              className={cn(
                "flex items-center space-x-4 rounded-xl border-2 border-dashed p-4 transition-all cursor-pointer",
                selectedIndex === -1 
                  ? "border-primary bg-primary/5" 
                  : "border-muted hover:border-primary/50"
              )}
              onClick={() => setSelectedIndex(-1)}
            >
              <RadioGroupItem value="-1" id="party-unknown" />
              <Label 
                htmlFor="party-unknown" 
                className="flex-1 cursor-pointer flex items-center gap-3"
              >
                <div className="p-2 rounded-full bg-muted">
                  <Icon name="help-circle" className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">I'm not sure</p>
                  <p className="text-xs text-muted-foreground">Skip party selection</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
          <Icon name="info" className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Knowing your role helps us highlight risks, obligations, and rights that are specifically relevant to your position in this contract.
          </p>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button onClick={handleContinue} disabled={selectedIndex === null}>
            Continue to Analysis
            <Icon name="arrow-right" className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
