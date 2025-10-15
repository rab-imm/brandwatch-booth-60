import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { ChatInterface } from "@/components/ChatInterface"
import { ConversationSidebar } from "@/components/ConversationSidebar"
import { CreditCounter } from "@/components/CreditCounter"
import { Header } from "@/components/Header"
import { ChatProvider } from "@/contexts/ChatContext"
import { UpsellModal } from "@/components/UpsellModal"
import { NotificationCenter } from "@/components/NotificationCenter"

const Dashboard = () => {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getQueryLimit = (tier: string) => {
    switch (tier) {
      case 'essential': return 100
      case 'premium': return 500
      case 'sme': return 1000
      default: return 10
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Personal Workspace Indicator */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b-2 border-blue-200 dark:border-blue-800">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Personal Workspace</span>
          </div>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-120px)]">
        <ChatProvider>
          <ConversationSidebar />
          <div className="flex-1 flex flex-col">
            <div className="border-b p-4 flex items-center justify-between">
              <CreditCounter 
                creditsUsed={profile?.queries_used || 0}
                subscriptionTier={profile?.subscription_tier || 'free'}
                rolloverCredits={profile?.rollover_credits || 0}
              />
              <NotificationCenter />
            </div>
            <div className="flex-1">
              <ChatInterface />
            </div>
          </div>
        </ChatProvider>
      </div>
      
      <UpsellModal 
        creditsUsed={profile?.queries_used || 0}
        subscriptionTier={profile?.subscription_tier || 'free'}
        maxQueries={getQueryLimit(profile?.subscription_tier || 'free')}
      />
    </div>
  )
}

export default Dashboard