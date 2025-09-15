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
  const [isInitialized, setIsInitialized] = useState(false)
  const [isNewConversation, setIsNewConversation] = useState(false)

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
      
      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
        sources: msg.metadata?.sources || undefined
      }))
      
      setMessages(formattedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }

  const createNewConversation = async (): Promise<string | null> => {
    console.log('🆕 createNewConversation called - UI clear mode')
    
    // Phase 1: Immediately clear UI state - no database operations
    setMessages([])
    setCurrentConversationId(null)
    setIsNewConversation(true)
    
    console.log('✅ UI state cleared - ready for new conversation')
    return null // Don't create DB record yet
  }

  const switchConversation = async (conversationId: string) => {
    setMessages([])
    setCurrentConversationId(conversationId)
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

    // Phase 2: Create database conversation if needed (new conversation or no current conversation)
    if (!conversationId || isNewConversation) {
      console.log('🔨 Creating database conversation record')
      
      try {
        const { data, error } = await supabase
          .from('conversations')
          .insert([
            { 
              user_id: user.id,
              title: 'New Conversation'
            }
          ])
          .select()
          .single()

        if (error) throw error

        conversationId = data.id
        setCurrentConversationId(conversationId)
        setIsNewConversation(false)
        
        console.log('✅ Database conversation created:', conversationId)
      } catch (error) {
        console.error('❌ Error creating conversation in database:', error)
        return
      }
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

      console.log('AI service response:', result)
      console.log('🔍 Sources in response:', result.sources)
      
      if (!result) {
        console.error('No result from AI service')
        throw new Error('No response from AI service')
      }
      
      if (result.error) {
        console.error('AI service returned error:', result.error)
        throw new Error(result.error)
      }
      
      if (!result.response || result.response.trim() === '') {
        console.error('Empty AI response:', result)
        throw new Error('Empty response from AI service')
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
          updated_at: aiMessage.updated_at,
          metadata: aiMessage.sources ? { sources: aiMessage.sources } : null
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

  // Initialize with first conversation only when needed
  useEffect(() => {
    const initializeChat = async () => {
      console.log('🔍 useEffect triggered:', {
        userPresent: !!user,
        isInitialized,
        currentConversationId,
        messagesLength: messages.length
      })
      
      if (!user || isInitialized) {
        console.log('🚫 Skipping initialization - user missing or already initialized')
        return
      }
      
      // ONLY load a conversation if no conversation is currently set, no messages exist, and not in new conversation mode
      if (currentConversationId !== null || messages.length > 0 || isNewConversation) {
        console.log('🚫 Skipping auto-load - conversation already active, messages exist, or in new conversation mode')
        setIsInitialized(true)
        return
      }

      console.log('📋 Looking for latest conversation to auto-load')

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
          console.log('✅ Auto-loading latest conversation:', latestConversation.id)
          setCurrentConversationId(latestConversation.id)
          await fetchMessages(latestConversation.id)
        } else {
          console.log('📝 No conversations found - starting fresh')
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
      } finally {
        console.log('✅ Setting isInitialized to true')
        setIsInitialized(true)
      }
    }

    initializeChat()
  }, [user, isInitialized, isNewConversation])

  return {
    messages,
    loading,
    currentConversationId,
    sendMessage,
    createNewConversation,
    switchConversation
  }
}