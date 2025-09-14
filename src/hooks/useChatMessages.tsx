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
    try {
      console.log('🚀 Creating new conversation - clearing messages first')
      console.log('- Before clear: messages.length =', messages.length)
      console.log('- Before clear: currentConversationId =', currentConversationId)
      
      // Clear everything immediately and synchronously
      setMessages([])
      setCurrentConversationId(null)
      
      console.log('✅ State cleared - creating new conversation in database')
      
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
      console.log('✅ New conversation created:', newConversationId)
      setCurrentConversationId(newConversationId)
      
      // Ensure messages stay cleared
      setMessages([])
      console.log('✅ Final state - messages cleared, new conversation set')
      
      return newConversationId
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }

  const switchConversation = async (conversationId: string) => {
    console.log('🔄 Switching conversation to:', conversationId)
    setMessages([]) // Clear messages immediately for better UX
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
      console.log('🔍 useEffect triggered - checking initialization conditions:')
      console.log('- user:', !!user)
      console.log('- isInitialized:', isInitialized)
      console.log('- currentConversationId:', currentConversationId)
      console.log('- messages.length:', messages.length)
      
      if (!user || isInitialized) {
        console.log('🚫 Skipping initialization - user missing or already initialized')
        return
      }
      
      // Only auto-load if:
      // - No current conversation is set
      // - No messages are loaded
      // - This is the first initialization
      if (currentConversationId || messages.length > 0) {
        console.log('🚫 Skipping auto-load - conversation already active or messages exist')
        setIsInitialized(true)
        return
      }

      console.log('🔄 Initializing chat - looking for latest conversation')

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
          console.log('✅ Found latest conversation:', latestConversation.id)
          setCurrentConversationId(latestConversation.id)
          await fetchMessages(latestConversation.id)
        } else {
          console.log('📝 No conversations found - user will start fresh')
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
      } finally {
        console.log('✅ Setting isInitialized to true')
        setIsInitialized(true)
      }
    }

    initializeChat()
  }, [user, currentConversationId, messages.length, isInitialized])

  return {
    messages,
    loading,
    currentConversationId,
    sendMessage,
    createNewConversation,
    switchConversation
  }
}