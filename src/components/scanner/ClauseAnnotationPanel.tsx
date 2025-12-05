import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface SubstantiveRiskFinding {
  clause_reference: string
  risk_type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  legal_basis: string
  substantive_issue: string
  litigation_risk: string
  affected_clause_text: string
  remediation: string
}

interface Comment {
  id: string
  text: string
  timestamp: string
}

interface ClauseAnnotationPanelProps {
  finding: SubstantiveRiskFinding
  onClose: () => void
  comments: Comment[]
  onSaveComment: (comment: string) => void
  onScrollToClause: () => void
  isReviewed?: boolean
  onToggleReviewed?: (reviewed: boolean) => void
}

const severityConfig = {
  critical: {
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive',
    icon: '🚨',
    label: 'CRITICAL'
  },
  high: {
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500',
    icon: '⚠️',
    label: 'HIGH'
  },
  medium: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500',
    icon: '⚡',
    label: 'MEDIUM'
  },
  low: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
    icon: 'ℹ️',
    label: 'LOW'
  }
}

export const ClauseAnnotationPanel = ({
  finding,
  onClose,
  comments,
  onSaveComment,
  onScrollToClause,
  isReviewed = false,
  onToggleReviewed
}: ClauseAnnotationPanelProps) => {
  const [newComment, setNewComment] = useState('')
  const severity = severityConfig[finding.severity]

  const handleSaveComment = () => {
    if (newComment.trim()) {
      onSaveComment(newComment.trim())
      setNewComment('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSaveComment()
    }
  }

  return (
    <Card className="h-full flex flex-col border-l-4 border-l-primary">
      {/* Header */}
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon name="message-square-text" className="h-5 w-5 text-primary" />
              Clause Annotation
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {finding.clause_reference}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="x" className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <Separator />
      
      {/* Content - Side by Side */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="grid grid-cols-2 h-full divide-x">
          {/* Left Side - AI Analysis */}
          <div className="flex flex-col h-full">
            <div className="p-4 bg-muted/30 border-b">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Icon name="bot" className="h-4 w-4 text-primary" />
                AI Analysis
              </h3>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Severity Badge */}
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border",
                  severity.bgColor,
                  severity.borderColor
                )}>
                  <span className="text-lg">{severity.icon}</span>
                  <div>
                    <Badge variant={finding.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {severity.label} RISK
                    </Badge>
                    <p className={cn("text-xs mt-1", severity.color)}>
                      {finding.risk_type.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Issue */}
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Icon name="alert-circle" className="h-4 w-4 text-destructive" />
                    Issue Identified
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {finding.substantive_issue}
                  </p>
                </div>

                {/* Affected Clause */}
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Icon name="quote" className="h-4 w-4" />
                    Affected Clause
                  </h4>
                  <div className="text-xs font-mono bg-muted p-3 rounded-lg border-l-4 border-primary max-h-32 overflow-auto">
                    "{finding.affected_clause_text}"
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={onScrollToClause}
                    className="mt-1 h-auto p-0 text-xs"
                  >
                    <Icon name="arrow-up-right" className="h-3 w-3 mr-1" />
                    Go to clause in document
                  </Button>
                </div>

                {/* Legal Basis */}
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Icon name="scale" className="h-4 w-4" />
                    Legal Basis
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {finding.legal_basis}
                  </p>
                </div>

                {/* Litigation Risk */}
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Icon name="gavel" className="h-4 w-4" />
                    Litigation Risk
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {finding.litigation_risk}
                  </p>
                </div>

                {/* Recommended Fix */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-green-700 dark:text-green-300">
                    <Icon name="check-circle" className="h-4 w-4" />
                    Recommended Changes
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {finding.remediation}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Side - User Comments */}
          <div className="flex flex-col h-full">
            <div className="p-4 bg-muted/30 border-b">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Icon name="message-circle" className="h-4 w-4 text-primary" />
                Your Comments
              </h3>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Comment Input */}
              <div className="p-4 border-b space-y-3">
                <Textarea
                  placeholder="Add your notes, questions, or discussion points..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Press Ctrl+Enter to save
                  </p>
                  <Button 
                    size="sm" 
                    onClick={handleSaveComment}
                    disabled={!newComment.trim()}
                  >
                    <Icon name="plus" className="h-4 w-4 mr-1" />
                    Add Comment
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="message-square-dashed" className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No comments yet</p>
                      <p className="text-xs">Add notes for your team or future reference</p>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Previous Comments ({comments.length})
                      </h4>
                      {comments.map((comment) => (
                        <div 
                          key={comment.id} 
                          className="bg-muted/50 p-3 rounded-lg border"
                        >
                          <p className="text-sm">{comment.text}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(comment.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Review Status */}
              {onToggleReviewed && (
                <div className="p-4 border-t bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="reviewed" 
                      checked={isReviewed}
                      onCheckedChange={(checked) => onToggleReviewed(checked as boolean)}
                    />
                    <label
                      htmlFor="reviewed"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Mark as reviewed
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
