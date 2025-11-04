import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useChatContext } from "@/contexts/ChatContext"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { ConversationHeader } from "@/components/ConversationHeader"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/integrations/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export const ConversationSidebar = () => {
  const { user, refetchProfile } = useAuth()
  const { currentConversationId, switchConversation, createNewConversation } = useChatContext()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  const fetchConversations = async () => {
    if (!user) return

    try {
      console.log('🔄 Fetching conversations for user:', user.id)
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      console.log('📋 Conversations fetched:', data?.length || 0)
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

  // Listen for realtime changes to conversations
  useEffect(() => {
    if (!user) return

    console.log('Setting up realtime subscription for conversations')
    
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('Realtime conversation change:', payload)
          // Only refresh if the change is for the current user (RLS handles access)
          fetchConversations()
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    return () => {
      console.log('Cleaning up realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [user])

  // Refresh conversations when a new conversation is created - FIXED: removed conversations dependency
  useEffect(() => {
    if (currentConversationId && user) {
      // Check if this conversation ID is not in our current list
      const existsInList = conversations.some(conv => conv.id === currentConversationId)
      if (!existsInList) {
        console.log('🔄 New conversation detected, refreshing list')
        // Use timeout to debounce rapid calls
        const timeoutId = setTimeout(() => {
          fetchConversations()
        }, 100)
        
        return () => clearTimeout(timeoutId)
      }
    }
  }, [currentConversationId, user]) // CRITICAL: removed conversations to prevent infinite refresh loop

  const handleNewConversation = async () => {
    try {
      // Just trigger the UI clearing - no need to add to local state
      // The conversation will be created when the first message is sent
      await createNewConversation()
      console.log('✅ New conversation UI cleared')
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

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
      
      if (error) throw error
      
      // If deleting current conversation, create new one
      if (currentConversationId === conversationId) {
        await createNewConversation()
      }
      
      toast.success('Conversation deleted')
      fetchConversations()
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast.error('Failed to delete conversation')
    }
  }

  const handleResetQueries = async () => {
    setResetting(true)
    try {
      const { error } = await supabase.rpc('reset_user_queries')
      if (error) throw error
      
      await refetchProfile()
      toast.success('Queries reset successfully!')
    } catch (error) {
      console.error('Error resetting queries:', error)
      toast.error('Failed to reset queries')
    } finally {
      setResetting(false)
    }
  }


  if (loading) {
    return (
      <div className="w-64 border-r bg-muted/10 p-4 shrink-0">
        <div className="text-sm text-muted-foreground">Loading conversations...</div>
      </div>
    )
  }

  return (
    <div className="w-64 border-r bg-muted/10 flex flex-col h-full shrink-0">
      <ConversationHeader
        currentConversationId={currentConversationId}
        onNewChat={handleNewConversation}
        loading={loading}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              conversations.map((conversation) => (
              <div key={conversation.id} className="group relative">
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-auto p-3 pr-10 text-left rounded-md transition-colors relative z-0 ${
                    currentConversationId === conversation.id 
                      ? "bg-secondary" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="font-medium line-clamp-1" title={conversation.title}>
                      {conversation.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.updated_at), {
                        addSuffix: true
                      })}
                    </div>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteConversation(conversation.id)
                  }}
                >
                  <Icon name="trash-2" className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
      <div className="border-t p-3 shrink-0">
        <Button
          onClick={handleResetQueries}
          disabled={resetting}
          variant="outline"
          size="sm"
          className="w-full gap-2"
        >
          <Icon name="refresh-cw" className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
          {resetting ? 'Resetting...' : 'Reset Queries'}
        </Button>
      </div>
    </div>
  )
}