import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface QuestionnaireData {
  contractType: string | null
  userRole: string | null
  analysisGoal: string | null
}

interface PreAnalysisQuestionnaireProps {
  onComplete: (data: QuestionnaireData) => void
  onSkip: () => void
}

interface QuestionOption {
  value: string
  label: string
  icon: string
  description?: string
}

const contractTypes: QuestionOption[] = [
  { value: 'employment', label: 'Employment Contract', icon: 'briefcase', description: 'Work agreements' },
  { value: 'real_estate', label: 'Real Estate', icon: 'home', description: 'Property & lease' },
  { value: 'nda', label: 'NDA / Confidentiality', icon: 'lock', description: 'Privacy agreements' },
  { value: 'service', label: 'Service Agreement', icon: 'settings', description: 'Professional services' },
  { value: 'sales', label: 'Sales Contract', icon: 'shopping-cart', description: 'Purchase agreements' },
  { value: 'partnership', label: 'Partnership', icon: 'users', description: 'Business partnerships' },
]

const userRoles: QuestionOption[] = [
  { value: 'signing', label: "I'm signing this contract", icon: 'pen-tool', description: 'Entering the agreement' },
  { value: 'reviewing', label: "I'm reviewing it for someone", icon: 'search', description: 'Legal/advisory review' },
  { value: 'received', label: 'I received it and need to understand', icon: 'file-text', description: 'Understanding terms' },
  { value: 'witness', label: "I'm a witness/third party", icon: 'eye', description: 'Observer role' },
]

const analysisGoals: QuestionOption[] = [
  { value: 'risk', label: 'Risk Assessment', icon: 'alert-triangle', description: 'Find red flags' },
  { value: 'compliance', label: 'Compliance Check', icon: 'shield', description: 'UAE law compliance' },
  { value: 'summary', label: 'Quick Summary', icon: 'list', description: 'Key terms overview' },
  { value: 'comprehensive', label: 'Full Analysis', icon: 'scan', description: 'Complete review' },
]

export const PreAnalysisQuestionnaire = ({ onComplete, onSkip }: PreAnalysisQuestionnaireProps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<QuestionnaireData>({
    contractType: null,
    userRole: null,
    analysisGoal: null,
  })
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const questions = [
    {
      key: 'contractType' as const,
      question: "How would you describe this contract?",
      options: contractTypes,
      allowCustom: true,
    },
    {
      key: 'userRole' as const,
      question: "What is your role in this contract?",
      options: userRoles,
      allowCustom: false,
    },
    {
      key: 'analysisGoal' as const,
      question: "What are you looking for?",
      options: analysisGoals,
      allowCustom: false,
    },
  ]

  const currentQuestion = questions[currentStep]
  const totalSteps = questions.length

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.key]: value }
    setAnswers(newAnswers)
    setShowCustomInput(false)
    setCustomInput('')
    
    if (currentStep < totalSteps - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300)
    } else {
      onComplete(newAnswers)
    }
  }

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      handleSelect(customInput.trim())
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setShowCustomInput(false)
      setCustomInput('')
    }
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Icon name="message-circle" className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Let's understand your document</h3>
              <p className="text-sm text-muted-foreground">This helps us give you more relevant insights</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip
          </Button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 rounded-full flex-1 transition-colors",
                idx < currentStep ? "bg-primary" : idx === currentStep ? "bg-primary/60" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Chat-style question */}
        <div className="space-y-4">
          {/* AI Message */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10 shrink-0">
              <Icon name="bot" className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%]">
              <p className="text-sm font-medium">{currentQuestion.question}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 pl-11">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left",
                  "hover:border-primary hover:bg-primary/5",
                  answers[currentQuestion.key] === option.value
                    ? "border-primary bg-primary/10"
                    : "border-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon name={option.icon} className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{option.label}</span>
                </div>
                {option.description && (
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                )}
              </button>
            ))}
            
            {/* Custom/Other option */}
            {currentQuestion.allowCustom && (
              <button
                onClick={() => setShowCustomInput(true)}
                className={cn(
                  "flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left",
                  "hover:border-primary hover:bg-primary/5 border-dashed",
                  showCustomInput ? "border-primary bg-primary/5" : "border-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon name="edit" className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm text-muted-foreground">Other</span>
                </div>
                <span className="text-xs text-muted-foreground">Specify type</span>
              </button>
            )}
          </div>

          {/* Custom input field */}
          {showCustomInput && (
            <div className="pl-11 flex gap-2">
              <Input
                placeholder="Describe your contract type..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                className="flex-1"
                autoFocus
              />
              <Button onClick={handleCustomSubmit} disabled={!customInput.trim()}>
                <Icon name="send" className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Previous answers as user messages */}
          {currentStep > 0 && (
            <div className="space-y-3 border-t pt-4 mt-4">
              <p className="text-xs text-muted-foreground text-center">Previous answers</p>
              {questions.slice(0, currentStep).map((q, idx) => {
                const answer = answers[q.key]
                const option = q.options.find(o => o.value === answer) || { label: answer, icon: 'check' }
                return (
                  <div key={idx} className="flex items-center justify-end gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Icon name={option.icon} className="h-3 w-3" />
                      {option.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <Icon name="arrow-left" className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Press a button to continue
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
