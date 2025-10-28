import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Header } from "@/components/Header"
import { ChatInterface } from "@/components/ChatInterface"
import { ConversationSidebar } from "@/components/ConversationSidebar"
import { CompanyCreditCounter } from "@/components/CompanyCreditCounter"
import { PersonalCreditCounter } from "@/components/PersonalCreditCounter"
import { NotificationCenter } from "@/components/NotificationCenter"
import { ChatProvider } from "@/contexts/ChatContext"
import { ManagerTeamOverview } from "@/components/ManagerTeamOverview"
import { ManagerRequestsPanel } from "@/components/ManagerRequestsPanel"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { CompanySidebar } from "@/components/CompanySidebar"
import { CompanyDashboardOverview } from "@/components/CompanyDashboardOverview"
import { LettersList } from "@/components/LettersList"
import { LetterDetail } from "@/components/LetterDetail"
import { TeamActivityFeed } from "@/components/company/TeamActivityFeed"
import { EnhancedTemplateStore } from "@/components/EnhancedTemplateStore"
import { StaffDashboardOverview } from "@/components/StaffDashboardOverview"
import { OCRUpload } from "@/components/OCRUpload"
import { OCRHistory } from "@/components/OCRHistory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

  // Redirect non-company users to personal dashboard
  useEffect(() => {
    if (!loading && user && profile && !profile.current_company_id) {
      navigate('/personal-dashboard')
    }
  }, [user, profile, loading, navigate])

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
  const isAdmin = profile?.roles?.includes('company_admin') || false

  const getSectionTitle = () => {
    switch (activeSection) {
      case "dashboard":
        return isManager || isAdmin ? 'Company Dashboard' : 'My Dashboard'
      case "chat":
        return 'Legal Assistant'
      case "letters":
        return 'Legal Letters'
      case "templates":
        return 'Template Store'
      case "ocr":
        return 'Document Scanner'
      case "team":
        return 'Team Activity'
      case "requests":
        return 'Team Requests'
      default:
        return isManager || isAdmin ? 'Company Workspace' : 'Team Workspace'
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        // Show different dashboard based on role
        if (isManager || isAdmin) {
          return companyData && companyRole ? (
            <CompanyDashboardOverview
              company={companyData}
              companyRole={companyRole}
              onNavigateToSection={setActiveSection}
            />
          ) : null
        } else {
          // Regular staff see their activity overview
          return user && companyData ? (
            <StaffDashboardOverview
              userId={user.id}
              companyId={companyData.id}
              onNavigateToSection={setActiveSection}
            />
          ) : null
        }
      
      case "chat":
        return (
          <div className="flex h-full border rounded-lg overflow-hidden bg-background shadow-sm">
            <ConversationSidebar />
            <div className="flex-1 flex flex-col min-w-0">
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
      
      case "templates":
        return <EnhancedTemplateStore />
      
      case "ocr":
        return (
          <Tabs defaultValue="scan" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
              <TabsTrigger value="scan">Scan Document</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="scan">
              <OCRUpload />
            </TabsContent>
            <TabsContent value="history">
              <OCRHistory />
            </TabsContent>
          </Tabs>
        )
      
      case "team":
        return companyData ? (
          <div className="space-y-6">
            <TeamActivityFeed companyId={companyData.id} limit={15} />
            {isManager && <ManagerTeamOverview />}
          </div>
        ) : null
      
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
              creditsUsed={isManager || isAdmin ? companyRole?.used_credits || 0 : companyRole?.used_credits || 0}
              creditsTotal={isManager || isAdmin ? companyRole?.max_credits_per_period || 0 : companyRole?.max_credits_per_period || 0}
            />
            
            <main className="flex-1 flex flex-col overflow-hidden">
              {companyData && (
                <div className="border-b p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <div className="flex items-center gap-3">
                      <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <div>
                        <h1 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {getSectionTitle()}
                        </h1>
                        <p className="text-sm text-purple-700 dark:text-purple-300">{companyName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {isManager || isAdmin ? (
                      <CompanyCreditCounter
                        personalUsed={companyRole?.used_credits || 0}
                        personalLimit={companyRole?.max_credits_per_period || 50}
                        companyUsed={companyData?.used_credits || 0}
                        companyTotal={companyData?.total_credits || 0}
                        rolloverCredits={profile?.rollover_credits || 0}
                      />
                    ) : (
                      <PersonalCreditCounter
                        creditsUsed={companyRole?.used_credits || 0}
                        subscriptionTier={companyData?.subscription_tier || 'free'}
                        maxCredits={companyRole?.max_credits_per_period || 50}
                        rolloverCredits={0}
                      />
                    )}
                    <NotificationCenter />
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className={activeSection === 'chat' ? 'flex-1 flex p-6' : 'flex-1 p-6 overflow-auto'}>
                  {renderSection()}
                </div>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </ChatProvider>
    </div>
  )
}
