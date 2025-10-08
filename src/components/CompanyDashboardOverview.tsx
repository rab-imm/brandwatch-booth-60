import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { useNavigate } from "react-router-dom"

interface CompanyDashboardOverviewProps {
  company: {
    name: string
    subscription_tier: string
    subscription_status: string
    total_credits: number
    used_credits: number
    credits_reset_date: string
  }
  companyRole: {
    role: string
    used_credits: number
    max_credits_per_period: number
    credits_reset_date: string
  }
  teamMemberCount?: number
  onNavigateToSection: (section: string) => void
}

export function CompanyDashboardOverview({
  company,
  companyRole,
  teamMemberCount = 0,
  onNavigateToSection,
}: CompanyDashboardOverviewProps) {
  const navigate = useNavigate()
  
  const companyCreditPercentage = (company.used_credits / company.total_credits) * 100
  const personalCreditPercentage = (companyRole.used_credits / companyRole.max_credits_per_period) * 100

  const quickActions = [
    {
      title: "Start Legal Chat",
      description: "Ask AI legal assistant",
      icon: "message-circle",
      onClick: () => onNavigateToSection("chat"),
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Create Letter",
      description: "Generate legal document",
      icon: "file-plus",
      onClick: () => navigate("/letters/create"),
      color: "bg-green-500/10 text-green-600",
    },
    {
      title: "View Letters",
      description: "Browse your letters",
      icon: "file-text",
      onClick: () => navigate("/letters"),
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      title: "Browse Templates",
      description: "Find legal templates",
      icon: "layout",
      onClick: () => navigate("/templates"),
      color: "bg-orange-500/10 text-orange-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Welcome to {company.name}</h2>
        <p className="text-muted-foreground">
          Here's an overview of your company dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Credits</CardTitle>
            <Icon name="zap" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company.total_credits - company.used_credits}</div>
            <p className="text-xs text-muted-foreground">
              {company.used_credits} / {company.total_credits} used
            </p>
            <Progress value={companyCreditPercentage} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Credits</CardTitle>
            <Icon name="user" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companyRole.max_credits_per_period - companyRole.used_credits}
            </div>
            <p className="text-xs text-muted-foreground">
              {companyRole.used_credits} / {companyRole.max_credits_per_period} used
            </p>
            <Progress value={personalCreditPercentage} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Icon name="credit-card" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{company.subscription_tier}</div>
            <p className="text-xs text-muted-foreground capitalize">
              {company.subscription_status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Reset</CardTitle>
            <Icon name="calendar" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {new Date(companyRole.credits_reset_date).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">Next reset date</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.onClick}
                className="flex flex-col items-start p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
              >
                <div className={`p-2 rounded-lg ${action.color} mb-3`}>
                  <Icon name={action.icon} className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credit Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Monthly Allocation</CardTitle>
            <CardDescription>Personal credit usage for this period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Credits Used</span>
                <span className="font-medium">
                  {companyRole.used_credits} / {companyRole.max_credits_per_period}
                </span>
              </div>
              <Progress value={personalCreditPercentage} className="h-2" />
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Role</span>
                <span className="font-medium capitalize">
                  {companyRole.role?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Credits Remaining</span>
                <span className="font-medium">
                  {companyRole.max_credits_per_period - companyRole.used_credits}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resets On</span>
                <span className="font-medium">
                  {new Date(companyRole.credits_reset_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Overview</CardTitle>
            <CardDescription>Overall company statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Company Credits Used</span>
                <span className="font-medium">
                  {company.used_credits} / {company.total_credits}
                </span>
              </div>
              <Progress value={companyCreditPercentage} className="h-2" />
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subscription Plan</span>
                <span className="font-medium capitalize">{company.subscription_tier}</span>
              </div>
              {teamMemberCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Team Members</span>
                  <span className="font-medium">{teamMemberCount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{company.subscription_status}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
