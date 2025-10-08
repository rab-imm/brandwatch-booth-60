import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Header } from "@/components/Header"
import { ChatInterface } from "@/components/ChatInterface"
import { ConversationSidebar } from "@/components/ConversationSidebar"
import { QueryCounter } from "@/components/QueryCounter"
import { NotificationCenter } from "@/components/NotificationCenter"
import { ChatProvider } from "@/contexts/ChatContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function CompanyUserDashboard() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [companyRole, setCompanyRole] = useState<any>(null)
  const [companyName, setCompanyName] = useState<string>("")

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth")
    }
  }, [user, loading, navigate])

  useEffect(() => {
    const fetchCompanyRole = async () => {
      if (!user || !profile?.current_company_id) return

      try {
        const { data: roleData } = await supabase
          .from("user_company_roles")
          .select("*")
          .eq("user_id", user.id)
          .eq("company_id", profile.current_company_id)
          .single()

        const { data: companyData } = await supabase
          .from("companies")
          .select("name")
          .eq("id", profile.current_company_id)
          .single()

        setCompanyRole(roleData)
        setCompanyName(companyData?.name || "")
      } catch (error) {
        console.error("Error fetching company role:", error)
      }
    }

    fetchCompanyRole()
  }, [user, profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const creditsUsed = companyRole?.used_credits || 0
  const creditsTotal = companyRole?.max_credits_per_period || 50
  const creditsPercentage = (creditsUsed / creditsTotal) * 100

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ChatProvider>
        <div className="flex h-[calc(100vh-4rem)]">
          <ConversationSidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b p-4 flex items-center justify-between bg-card">
              <div>
                <h1 className="text-2xl font-bold">Company Dashboard</h1>
                <p className="text-sm text-muted-foreground">{companyName}</p>
              </div>
              <div className="flex items-center gap-4">
                <QueryCounter 
                  queriesUsed={creditsUsed}
                  subscriptionTier={profile.subscription_tier}
                  maxCredits={creditsTotal}
                />
                <NotificationCenter />
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Your Credit Allocation</CardTitle>
                  <CardDescription>
                    Monthly credits for legal AI queries
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Credits Used</span>
                      <span className="font-medium">
                        {creditsUsed} / {creditsTotal}
                      </span>
                    </div>
                    <Progress value={creditsPercentage} className="h-2" />
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Role</span>
                      <span className="font-medium capitalize">
                        {profile.user_role?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credits Remaining</span>
                      <span className="font-medium">
                        {creditsTotal - creditsUsed}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Resets On</span>
                      <span className="font-medium">
                        {new Date(companyRole?.credits_reset_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex-1">
                <ChatInterface />
              </div>
            </div>
          </main>
        </div>
      </ChatProvider>
    </div>
  )
}
