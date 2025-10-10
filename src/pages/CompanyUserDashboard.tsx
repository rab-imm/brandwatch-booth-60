import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Header } from "@/components/Header"
import { ChatInterface } from "@/components/ChatInterface"
import { ConversationSidebar } from "@/components/ConversationSidebar"
import { CreditCounter } from "@/components/CreditCounter"
import { NotificationCenter } from "@/components/NotificationCenter"
import { ChatProvider } from "@/contexts/ChatContext"
import { ManagerTeamOverview } from "@/components/ManagerTeamOverview"
import { ManagerRequestsPanel } from "@/components/ManagerRequestsPanel"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { CompanySidebar } from "@/components/CompanySidebar"
import { CompanyDashboardOverview } from "@/components/CompanyDashboardOverview"
import { LettersList } from "@/components/LettersList"
import { LetterDetail } from "@/components/LetterDetail"

export default function CompanyUserDashboard() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [companyRole, setCompanyRole] = useState<any>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [companyData, setCompanyData] = useState<any>(null)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null)

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

        const { data: companyInfo } = await supabase
          .from("companies")
          .select("*")
          .eq("id", profile.current_company_id)
          .single()

        setCompanyRole(roleData)
        setCompanyName(companyInfo?.name || "")
        setCompanyData(companyInfo)
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

  const isManager = companyRole?.role === 'company_manager'
  const isAdmin = profile?.user_role === 'company_admin'

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return companyData && companyRole ? (
          <CompanyDashboardOverview
            company={companyData}
            companyRole={companyRole}
            onNavigateToSection={setActiveSection}
          />
        ) : null
      
      case "chat":
        return (
          <div className="flex h-[calc(100vh-12rem)] border rounded-lg overflow-hidden">
            <ConversationSidebar />
            <div className="flex-1">
              <ChatInterface />
            </div>
          </div>
        )
      
      case "letters":
        return selectedLetterId ? (
          <LetterDetail
            letterId={selectedLetterId}
            onBack={() => setSelectedLetterId(null)}
          />
        ) : (
          <LettersList
            onLetterClick={(id) => setSelectedLetterId(id)}
            onCreateClick={() => navigate('/letters/create')}
          />
        )
      
      case "team":
        return <ManagerTeamOverview />
      
      case "requests":
        return <ManagerRequestsPanel />
      
      case "members":
        if (!isAdmin) return null
        navigate('/company-admin')
        return null
      
      case "conversations":
        if (!isAdmin) return null
        navigate('/company-admin')
        return null
      
      case "analytics":
        if (!isAdmin) return null
        navigate('/company-admin')
        return null
      
      case "settings":
        if (!isAdmin) return null
        navigate('/company-admin')
        return null
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ChatProvider>
        <SidebarProvider>
          <div className="flex min-h-[calc(100vh-4rem)] w-full">
            <CompanySidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              companyName={companyName}
              isManager={isManager}
              isAdmin={isAdmin}
            />
            
            <main className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b p-4 flex items-center justify-between bg-card">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-2xl font-bold">Company Dashboard</h1>
                    <p className="text-sm text-muted-foreground">{companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <CreditCounter 
                    creditsUsed={companyRole?.used_credits || 0}
                    subscriptionTier={profile?.subscription_tier}
                    maxCredits={companyRole?.max_credits_per_period || 50}
                    rolloverCredits={profile?.rollover_credits || 0}
                  />
                  <NotificationCenter />
                </div>
              </div>

              <div className="p-6 overflow-auto flex-1">
                {renderSection()}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </ChatProvider>
    </div>
  )
}
