import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useChatMessages } from "@/hooks/useChatMessages"
import { MessageBubble } from "@/components/MessageBubble"
import { ChatInput } from "@/components/ChatInput"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/components/ui/use-toast"

export const ChatInterface = () => {
  const { user, profile } = useAuth()
  const { messages, sendMessage, loading, currentConversationId, createNewConversation } = useChatMessages()
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    // Check query limits
    if (profile?.subscription_tier === 'free' && (profile?.queries_used || 0) >= 5) {
      toast({
        title: "Query limit reached",
        description: "You've reached your free tier limit. Upgrade to continue.",
        variant: "destructive"
      })
      return
    }

    if (profile?.subscription_tier === 'pro' && (profile?.queries_used || 0) >= 100) {
      toast({
        title: "Query limit reached", 
        description: "You've reached your pro tier limit for this month.",
        variant: "destructive"
      })
      return
    }

    try {
      await sendMessage(content)
      setInputValue("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleNewConversation = async () => {
    try {
      await createNewConversation()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new conversation.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <Icon name="scale" className="w-16 h-16 text-primary" />
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Welcome to UAE Legal Research
              </h2>
              <p className="text-muted-foreground max-w-md">
                Ask questions about UAE law, get instant answers with verified citations, 
                and research legal precedents efficiently.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <Button
                variant="outline"
                className="h-auto p-4 text-left"
                onClick={() => handleSendMessage("What are the key employment laws in the UAE?")}
              >
                <div className="space-y-1">
                  <div className="font-medium">Employment Law</div>
                  <div className="text-sm text-muted-foreground">
                    Learn about UAE labor regulations
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 text-left"
                onClick={() => handleSendMessage("How do I register a company in Dubai?")}
              >
                <div className="space-y-1">
                  <div className="font-medium">Business Setup</div>
                  <div className="text-sm text-muted-foreground">
                    Company registration procedures
                  </div>
                </div>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
              />
            ))}
            {loading && (
              <MessageBubble
                message={{
                  id: 'loading',
                  role: 'assistant',
                  content: 'Analyzing your legal query...',
                  created_at: new Date().toISOString(),
                  user_id: '',
                  conversation_id: currentConversationId || '',
                  updated_at: new Date().toISOString()
                }}
                isLoading={true}
              />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          disabled={loading}
          placeholder="Ask a question about UAE law..."
        />
      </div>
    </div>
  )
}