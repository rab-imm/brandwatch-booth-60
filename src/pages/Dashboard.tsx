import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { ChatInterface } from "@/components/ChatInterface"
import { ConversationSidebar } from "@/components/ConversationSidebar"
import { QueryCounter } from "@/components/QueryCounter"
import { Header } from "@/components/Header"

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-73px)]">
        <ConversationSidebar />
        <div className="flex-1 flex flex-col">
          <div className="border-b p-4">
            <QueryCounter 
              queriesUsed={profile?.queries_used || 0}
              subscriptionTier={profile?.subscription_tier || 'free'}
            />
          </div>
          <div className="flex-1">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard