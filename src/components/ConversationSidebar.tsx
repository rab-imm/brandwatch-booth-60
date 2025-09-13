import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useChatMessages } from "@/hooks/useChatMessages"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { NewChatButton } from "@/components/NewChatButton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/integrations/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export const ConversationSidebar = () => {
  const { user } = useAuth()
  const { currentConversationId, switchConversation, createNewConversation } = useChatMessages()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [user])

  const handleNewConversation = async () => {
    try {
      await createNewConversation()
      fetchConversations()
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const handleSelectConversation = async (conversationId: string) => {
    try {
      await switchConversation(conversationId)
    } catch (error) {
      console.error('Error switching conversation:', error)
    }
  }

  if (loading) {
    return (
      <div className="w-80 border-r bg-muted/10 p-4">
        <div className="text-sm text-muted-foreground">Loading conversations...</div>
      </div>
    )
  }

  return (
    <div className="w-80 border-r bg-muted/10 flex flex-col">
      <div className="p-4 border-b">
        <NewChatButton onNewChat={handleNewConversation} loading={loading} />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={currentConversationId === conversation.id ? "secondary" : "ghost"}
                className="w-full justify-start h-auto p-3 text-left"
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="font-medium truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.updated_at), {
                      addSuffix: true
                    })}
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}