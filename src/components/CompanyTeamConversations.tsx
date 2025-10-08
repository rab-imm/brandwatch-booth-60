import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  user_id: string
  profile?: {
    full_name: string
    email: string
  }
}

interface Message {
  id: string
  content: string
  role: string
  created_at: string
}

export const CompanyTeamConversations = () => {
  const { user, profile } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [user, profile])

  const fetchConversations = async () => {
    if (!user || !profile?.current_company_id) return

    try {
      setLoading(true)
      
      // Get all users in the company
      const { data: companyUsers } = await supabase
        .from('user_company_roles')
        .select('user_id')
        .eq('company_id', profile.current_company_id)

      const userIds = companyUsers?.map(u => u.user_id) || []

      if (userIds.length === 0) {
        setLoading(false)
        return
      }

      // Get conversations from all company users
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          user_id,
          profiles (
            full_name,
            email
          )
        `)
        .in('user_id', userIds)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true)
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, role, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleViewConversation = (conversationId: string) => {
    setSelectedConversation(conversationId)
    fetchMessages(conversationId)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Icon name="loader" className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team Conversations</CardTitle>
          <CardDescription>
            View conversations from all team members (read-only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleViewConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm">{conversation.title}</p>
                    <Badge variant="outline" className="text-xs">
                      {conversation.profile?.full_name || 'Unknown'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(conversation.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="text-center py-8">
                  <Icon name="message-circle" className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No conversations found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Conversation Details</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="loader" className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-primary/10 ml-8' 
                        : 'bg-secondary/50 mr-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                        {message.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
