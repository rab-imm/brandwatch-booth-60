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
  suggestedLetter?: {
    letterType: string
    confidence: number
    reasoning: string
    suggestedTitle: string
  }
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  user_id: string
}

interface LetterSuggestion {
  shouldSuggest: boolean
  letterType: string
  confidence: number
  reasoning: string
  suggestedTitle?: string
  topicKeywords?: string[]
}

interface ChatContextValue {
  messages: Message[]
  loading: boolean
  currentConversationId: string | null
  sendMessage: (content: string) => Promise<void>
  createNewConversation: () => Promise<string | null>
  switchConversation: (conversationId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  lastLetterSuggestion: LetterSuggestion | null
  dismissedSuggestions: Set<string>
  dismissLetterSuggestion: (messageId: string) => void
  letterTopicActive: boolean
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

// Helper to parse SSE stream
async function* parseSSEStream(response: Response) {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  if (!reader) throw new Error('No response body')

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') return
          
          try {
            yield JSON.parse(data)
          } catch (e) {
            console.error('Error parsing SSE data:', e)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { user, refetchProfile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastLetterSuggestion, setLastLetterSuggestion] = useState<LetterSuggestion | null>(null)
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set())
  const [letterTopicActive, setLetterTopicActive] = useState(false)
  
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
    setLastLetterSuggestion(null)
    setDismissedSuggestions(new Set())
    setLetterTopicActive(false)
    
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
    setLastLetterSuggestion(null)
    setDismissedSuggestions(new Set())
    setLetterTopicActive(false)
    
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

      // Create placeholder assistant message that will be updated
      const assistantMessageId = crypto.randomUUID()
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id,
        conversation_id: conversationId
      }

      setMessages(prev => [...prev, assistantMessage])

      // Stream the response
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `https://icsttnftxcfgnwhifsdm.supabase.co/functions/v1/legal-chat-enhanced`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            message: content,
            conversationId: conversationId
          })
        }
      )

      if (!response.ok) {
        if (response.status === 429) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Insufficient credits')
        }
        throw new Error('Failed to get AI response')
      }

      // Process streaming response
      let fullContent = ''
      let metadata: any = null

      for await (const event of parseSSEStream(response)) {
        if (event.type === 'token') {
          fullContent += event.content
          
          // Update assistant message progressively
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullContent, updated_at: new Date().toISOString() }
                : msg
            )
          )
        } else if (event.type === 'metadata') {
          metadata = event.data
          
          // Set sources if available
          if (metadata?.sources) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, sources: metadata.sources }
                  : msg
              )
            )
          }
          
          // Set letter suggestion if available
          if (metadata?.suggestedLetter?.shouldSuggest && metadata.suggestedLetter.confidence >= 70) {
            console.log('✅ High-confidence letter suggestion detected:', metadata.suggestedLetter)
            setLastLetterSuggestion({
              ...metadata.suggestedLetter,
              shouldSuggest: true
            })
            setLetterTopicActive(true)
          }
        }
      }

      console.log('✅ Streaming complete, final content length:', fullContent.length)

      // Refetch profile to update query count in UI
      await refetchProfile()

    } catch (error: any) {
      console.error('❌ Error in sendMessage:', error)
      
      // Show appropriate error message
      if (error.message?.includes('Insufficient credits') || error.message?.includes('credit')) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content: "⚠️ " + error.message,
          role: 'assistant',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user.id,
          conversation_id: conversationId || ''
        }])
      } else {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content: "I apologize, but I encountered an error processing your message. Please try again.",
          role: 'assistant',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user.id,
          conversation_id: conversationId || ''
        }])
      }
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

  const dismissLetterSuggestion = (messageId: string) => {
    setDismissedSuggestions((prev) => new Set(prev).add(messageId))
  }

  const value: ChatContextValue = {
    messages,
    loading,
    currentConversationId,
    sendMessage,
    createNewConversation,
    switchConversation,
    deleteConversation,
    lastLetterSuggestion,
    dismissedSuggestions,
    dismissLetterSuggestion,
    letterTopicActive
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}