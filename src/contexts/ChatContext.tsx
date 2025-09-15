import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react"
import { flushSync } from "react-dom"
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

interface ChatContextValue {
  messages: Message[]
  loading: boolean
  currentConversationId: string | null
  sendMessage: (content: string) => Promise<void>
  createNewConversation: () => Promise<string | null>
  switchConversation: (conversationId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: ReactNode
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { user, refetchProfile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // StrictMode execution guard
  const executionCountRef = useRef(0)
  const isNewConversationRef = useRef(false)

  const fetchMessages = async (conversationId: string, retryCount = 0) => {
    console.log('🔍 fetchMessages called:', { conversationId, user: !!user, retryCount })
    
    if (!conversationId) {
      console.error('❌ fetchMessages: No conversationId provided')
      return
    }

    if (!user) {
      console.warn('⚠️ fetchMessages: User not available, retrying...', { retryCount })
      
      if (retryCount < 3) {
        setTimeout(() => {
          fetchMessages(conversationId, retryCount + 1)
        }, 100 * (retryCount + 1))
        return
      } else {
        console.error('❌ fetchMessages: User not available after retries')
        setMessages([])
        return
      }
    }

    try {
      console.log('📡 Fetching messages from database...', { conversationId, userId: user.id })
      
      // First verify the conversation exists and belongs to user
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, title')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (convError || !conversation) {
        console.error('❌ Conversation not found or access denied:', { convError, conversationId })
        setMessages([])
        return
      }

      console.log('✅ Conversation verified:', conversation.title)

      // Now get messages for this specific conversation
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      console.log('🔍 DEBUG: Raw query result:', { data, error, conversationId })

      if (error) {
        console.error('❌ Database error fetching messages:', error)
        throw error
      }
      
      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
        sources: msg.metadata?.sources || undefined
      }))
      
      console.log('🔍 DEBUG: Formatted messages:', formattedMessages)
      console.log('🔄 Setting messages in context state')
      setMessages(formattedMessages)
      
      if (formattedMessages.length === 0) {
        console.log('ℹ️ Conversation is empty - this is normal for new conversations:', conversation.title)
      } else {
        console.log('✅ Messages loaded successfully:', { count: formattedMessages.length, conversation: conversation.title })
      }
      
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
      setMessages([])
    }
  }

  const createNewConversation = useCallback(async (): Promise<string | null> => {
    console.log('🆕 createNewConversation called - UI clear mode')
    
    // Clear state immediately
    setMessages([])
    setCurrentConversationId(null)
    
    // Set new conversation flag
    isNewConversationRef.current = true
    
    console.log('✅ UI state cleared - ready for new conversation')
    return null
  }, [])

  const switchConversation = useCallback(async (conversationId: string) => {
    console.log('🔄 switchConversation called:', { conversationId, currentUser: !!user })
    
    // Clear state and set new conversation ID
    setMessages([])
    setCurrentConversationId(conversationId)
    
    console.log('✅ State cleared, fetching messages...')
    isNewConversationRef.current = false
    await fetchMessages(conversationId)
  }, [user])

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

    // Create database conversation if needed
    if (!conversationId || isNewConversationRef.current) {
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
        isNewConversationRef.current = false
        
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
      setMessages(prev => {
        if (isNewConversationRef.current && prev.length > 0) {
          console.log('🔧 Clearing stale messages due to new conversation state')
          return [userMessage]
        }
        return [...prev, userMessage]
      })

      // Update conversation title based on first message
      if (isNewConversationRef.current || messages.length === 0) {
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
      executionCountRef.current += 1
      const currentExecution = executionCountRef.current
      
      console.log('🔍 ChatContext useEffect triggered (execution #' + currentExecution + '):', {
        userPresent: !!user,
        isInitialized,
        currentConversationId,
        messagesLength: messages.length,
        isNewConversation: isNewConversationRef.current
      })
      
      if (!user || isInitialized) {
        console.log('🚫 Skipping initialization - user missing or already initialized')
        return
      }
      
      if (currentConversationId !== null || messages.length > 0 || isNewConversationRef.current) {
        console.log('🚫 Skipping auto-load - conversation already active, messages exist, or in new conversation mode')
        setIsInitialized(true)
        return
      }

      console.log('📋 Looking for latest conversation to auto-load')

      try {
        if (executionCountRef.current !== currentExecution) {
          console.log('🚫 Aborting stale execution #' + currentExecution)
          return
        }

        // First, get all conversation IDs that have messages
        const { data: conversationIds } = await supabase
          .from('messages')
          .select('conversation_id')
          .eq('user_id', user.id)
          
        console.log('🔍 DEBUG: Conversation IDs with messages:', conversationIds)

        // Get unique conversation IDs
        const uniqueConversationIds = [...new Set(conversationIds?.map(m => m.conversation_id) || [])]
        
        if (uniqueConversationIds.length > 0) {
          // Find the most recent conversation that has messages
          const { data: conversationsWithMessages, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .in('id', uniqueConversationIds)
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            
          if (!convError && conversationsWithMessages && conversationsWithMessages.length > 0) {
            const latestWithMessages = conversationsWithMessages[0]
            console.log('✅ Loading conversation with messages:', latestWithMessages.id)
            setCurrentConversationId(latestWithMessages.id)
            await fetchMessages(latestWithMessages.id)
            return
          }
        }

        // Fallback to latest conversation (might be empty)
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)

        if (error) throw error

        if (executionCountRef.current !== currentExecution) {
          console.log('🚫 Aborting stale execution #' + currentExecution + ' after fetch')
          return
        }

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
        console.log('✅ Setting isInitialized to true (execution #' + currentExecution + ')')
        setIsInitialized(true)
      }
    }

    initializeChat()
  }, [user, isInitialized])

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return

    try {
      // Delete all messages first, then the conversation
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      if (messagesError) throw messagesError

      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (conversationError) throw conversationError

      // If we deleted the current conversation, create a new one
      if (currentConversationId === conversationId) {
        await createNewConversation()
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw error
    }
  }, [user, currentConversationId, createNewConversation])

  const value: ChatContextValue = {
    messages,
    loading,
    currentConversationId,
    sendMessage,
    createNewConversation,
    switchConversation,
    deleteConversation
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}