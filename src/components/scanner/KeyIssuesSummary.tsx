import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

interface KeyIssue {
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  icon?: string
}

interface KeyIssuesSummaryProps {
  issues: KeyIssue[]
}

export const KeyIssuesSummary = ({ issues }: KeyIssuesSummaryProps) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { variant: 'destructive' as const, icon: 'alert-circle', bgClass: 'bg-destructive/10' }
      case 'high':
        return { variant: 'default' as const, icon: 'alert-triangle', bgClass: 'bg-orange-50 dark:bg-orange-950' }
      case 'medium':
        return { variant: 'secondary' as const, icon: 'info', bgClass: 'bg-yellow-50 dark:bg-yellow-950' }
      default:
        return { variant: 'outline' as const, icon: 'check', bgClass: 'bg-blue-50 dark:bg-blue-950' }
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="list" className="h-5 w-5" />
          Key Issues
          <Badge variant="secondary">{issues.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[350px]">
          <div className="space-y-3 pr-4">
            {issues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="check" className="h-12 w-12 mx-auto mb-3 text-chart-2" />
                <p>No critical issues detected</p>
              </div>
            ) : (
              issues.map((issue, idx) => {
                const config = getSeverityConfig(issue.severity)
                return (
                  <Alert key={idx} className={config.bgClass}>
                    <Icon name={config.icon as any} className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-sm mb-1">{issue.title}</p>
                          <p className="text-xs text-muted-foreground">{issue.description}</p>
                        </div>
                        <Badge variant={config.variant} className="shrink-0">
                          {issue.severity}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
