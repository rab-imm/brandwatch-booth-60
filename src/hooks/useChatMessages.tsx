import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
  updated_at: string
  user_id: string
  conversation_id: string
  sources?: {
    research?: Array<{
      title: string
      snippet: string
      url: string
      domain: string
    }>
    documents?: Array<{
      title: string
      content: string
      category: string
      similarity: number
    }>
  }
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  user_id: string
}

export const useChatMessages = () => {
  const { user, refetchProfile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)

  const fetchMessages = async (conversationId: string) => {
    if (!user || !conversationId) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages((data || []) as Message[])
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }

  const createNewConversation = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          { 
            user_id: user.id,
            title: 'New Conversation',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error

      const newConversationId = data.id
      setCurrentConversationId(newConversationId)
      setMessages([]) // Clear messages immediately when creating new conversation
      return newConversationId
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }

  const switchConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId)
    setMessages([]) // Clear messages immediately for better UX
    await fetchMessages(conversationId)
  }

  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId)
        .eq('user_id', user?.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating conversation title:', error)
    }
  }

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return

    let conversationId = currentConversationId

    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = await createNewConversation()
    }

    if (!conversationId) return

    setLoading(true)

    try {
      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: content.trim(),
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id,
        conversation_id: conversationId
      }

      const { error: userError } = await supabase
        .from('messages')
        .insert([{
          content: userMessage.content,
          role: userMessage.role,
          user_id: userMessage.user_id,
          conversation_id: userMessage.conversation_id,
          created_at: userMessage.created_at,
          updated_at: userMessage.updated_at
        }])

      if (userError) throw userError

      // Update messages state with user message
      setMessages(prev => [...prev, userMessage])

      // Update conversation title based on first message
      if (messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
        await updateConversationTitle(conversationId, title)
      }

      // Call the enhanced legal chat function
      const { data: result, error: aiCallError } = await supabase.functions.invoke('legal-chat-enhanced', {
        body: {
          message: content,
          conversationId: conversationId
        }
      })

      if (aiCallError) {
        console.error('AI function error:', aiCallError)
        throw new Error('Failed to get AI response')
      }

      // Create AI message with sources
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: result.response,
        role: 'assistant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id,
        conversation_id: conversationId,
        sources: result.sources ? {
          research: result.sources.research || [],
          documents: result.sources.documents || []
        } : undefined
      }

      const { error: aiMessageError } = await supabase
        .from('messages')
        .insert([{
          content: aiMessage.content,
          role: aiMessage.role,
          user_id: aiMessage.user_id,
          conversation_id: aiMessage.conversation_id,
          created_at: aiMessage.created_at,
          updated_at: aiMessage.updated_at
        }])

      if (aiMessageError) throw aiMessageError

      // Update messages state with AI response
      setMessages(prev => [...prev, aiMessage])

      // Refetch profile to update query count in UI
      await refetchProfile()

    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Initialize with first conversation or create one
  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return

      try {
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)

        if (error) throw error

        if (conversations && conversations.length > 0) {
          const latestConversation = conversations[0]
          setCurrentConversationId(latestConversation.id)
          await fetchMessages(latestConversation.id)
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
      }
    }

    initializeChat()
  }, [user])

  return {
    messages,
    loading,
    currentConversationId,
    sendMessage,
    createNewConversation,
    switchConversation
  }
}