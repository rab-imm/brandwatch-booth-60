import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  user_id: string
  conversation_id: string
  updated_at: string
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

  const createNewConversation = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: 'New Conversation'
        })
        .select()
        .single()

      if (error) throw error
      
      setCurrentConversationId(data.id)
      setMessages([])
      return data.id
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  const switchConversation = async (conversationId: string) => {
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
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: 'user',
          content: content.trim()
        })
        .select()
        .single()

      if (userError) throw userError

      // Update messages state with user message
      setMessages(prev => [...prev, userMessage as Message])

      // Update conversation title based on first message
      if (messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
        await updateConversationTitle(conversationId, title)
      }

      // Simulate AI response (placeholder for now)
      const aiResponse = `Thank you for your legal question: "${content}". 

This is a placeholder response. In a full implementation, this would:

1. Analyze your query using advanced legal AI
2. Search through UAE legal databases and statutes
3. Provide accurate legal information with citations
4. Reference relevant case law and precedents

Key areas this system would cover:
- Employment Law in the UAE
- Commercial and Corporate Law
- Real Estate and Property Law
- Civil and Criminal Procedures
- Free Zone Regulations
- Family Law and Personal Status

Please note: This is not legal advice. Consult with a qualified UAE legal professional for specific legal matters.`

      // Add AI response
      const { data: aiMessage, error: aiError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse
        })
        .select()
        .single()

      if (aiError) throw aiError

      // Update messages with AI response
      setMessages(prev => [...prev, aiMessage as Message])

      // Increment query count
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          queries_used: ((user as any)?.queries_used || 0) + 1 
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating query count:', updateError)
      } else {
        // Refetch profile to update query count in UI
        await refetchProfile()
      }

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