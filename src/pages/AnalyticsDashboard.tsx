import { CreditUsageChart } from "@/components/analytics/CreditUsageChart"
import { ActivityTimeline } from "@/components/analytics/ActivityTimeline"
import { UsageInsights } from "@/components/analytics/UsageInsights"
import { Header } from "@/components/Header"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function AnalyticsDashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your usage, track credits, and analyze your activity
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <Icon name="arrow-left" className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main chart takes 2 columns */}
          <div className="lg:col-span-2">
            <CreditUsageChart />
          </div>

          {/* Usage insights sidebar */}
          <div>
            <UsageInsights />
          </div>

          {/* Activity timeline full width */}
          <div className="lg:col-span-3">
            <ActivityTimeline />
          </div>
        </div>
      </div>
    </div>
  )
}
