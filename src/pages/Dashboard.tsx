import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { ChatInterface } from "@/components/ChatInterface"
import { ConversationSidebar } from "@/components/ConversationSidebar"
import { PersonalCreditCounter } from "@/components/PersonalCreditCounter"
import { Header } from "@/components/Header"
import { ChatProvider } from "@/contexts/ChatContext"
import { UpsellModal } from "@/components/UpsellModal"

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
      
      <div className="flex h-[calc(100vh-64px)]">
        <ChatProvider>
          <ConversationSidebar />
          <div className="flex-1 flex flex-col">
            <div className="border-b p-4 flex items-center justify-between">
          <PersonalCreditCounter 
            creditsUsed={profile?.queries_used || 0}
            subscriptionTier={profile?.subscription_tier || 'free'}
            rolloverCredits={profile?.rollover_credits || 0}
          />
            </div>
            <div className="flex-1 overflow-hidden">
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