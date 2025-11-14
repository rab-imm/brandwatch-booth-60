import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useChatContext, Message } from "@/contexts/ChatContext"
import { MessageBubble } from "@/components/MessageBubble"
import { ChatInput } from "@/components/ChatInput"
import { LawyerRequestButton } from "@/components/LawyerRequestButton"
import { SuggestLetterButton } from "@/components/SuggestLetterButton"
import { AutoLetterSuggestionPopup } from "@/components/AutoLetterSuggestionPopup"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/components/ui/use-toast"

export const ChatInterface = () => {
  const { user, profile } = useAuth()
  const { 
    messages, 
    sendMessage, 
    loading, 
    currentConversationId, 
    createNewConversation,
    lastLetterSuggestion,
    dismissedSuggestions,
    dismissLetterSuggestion
  } = useChatContext()
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [showAutoPopup, setShowAutoPopup] = useState(false)
  const [lastShownMessageId, setLastShownMessageId] = useState<string | null>(null)
  const [showLawyerDialog, setShowLawyerDialog] = useState(false)
  const [showLetterDialog, setShowLetterDialog] = useState(false)
  const [showScrollButtons, setShowScrollButtons] = useState(false)

  // Debug logging
  console.log('💬 ChatInterface render:', {
    messagesCount: messages.length,
    currentConversationId,
    loading,
    messagesPreview: messages.map(m => ({ id: m.id, role: m.role, content: m.content.slice(0, 30) + '...' }))
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const scrollUp = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollBy({ top: -400, behavior: "smooth" })
    }
  }

  const scrollDown = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollBy({ top: 400, behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check if content is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (messagesContainerRef.current) {
        const { scrollHeight, clientHeight } = messagesContainerRef.current
        setShowScrollButtons(scrollHeight > clientHeight)
      }
    }
    
    checkScrollable()
    window.addEventListener('resize', checkScrollable)
    
    return () => window.removeEventListener('resize', checkScrollable)
  }, [messages])

  // Auto-popup logic: Show popup when lastLetterSuggestion updates with high confidence
  useEffect(() => {
    if (!lastLetterSuggestion || lastLetterSuggestion.confidence < 70) {
      console.log('❌ No letter suggestion or below threshold');
      return;
    }
    
    // Generate a unique key for this suggestion
    const suggestionKey = `${currentConversationId}-${Date.now()}`;
    
    // Check if we've already shown a recent suggestion
    if (lastShownMessageId && Date.now() - parseInt(lastShownMessageId.split('-')[1] || '0') < 5000) {
      console.log('❌ Suggestion shown recently, skipping');
      return;
    }
    
    // Show the popup
    console.log('✅ Showing auto-popup for letter suggestion:', lastLetterSuggestion);
    setShowAutoPopup(true);
    setLastShownMessageId(suggestionKey);
  }, [lastLetterSuggestion, currentConversationId])

  const handleDismissPopup = () => {
    setShowAutoPopup(false)
    if (lastShownMessageId) {
      dismissLetterSuggestion(lastShownMessageId)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    // Check credit limits
    if (profile?.subscription_tier === 'free' && (profile?.queries_used || 0) >= 10) {
      toast({
        title: "Credit limit reached",
        description: "You've reached your free tier limit. Upgrade to continue.",
        variant: "destructive"
      })
      return
    }

    if (profile?.subscription_tier === 'essential' && (profile?.queries_used || 0) >= 50) {
      toast({
        title: "Credit limit reached", 
        description: "You've reached your essential tier limit for this month.",
        variant: "destructive"
      })
      return
    }

    try {
      await sendMessage(content)
      setInputValue("")
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      let title = "Error"
      let description = "Failed to send message. Please try again."
      
      if (errorMessage.includes('API key')) {
        title = "Service Unavailable"
        description = "Legal research service is temporarily unavailable. Please try again later."
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        title = "Connection Error"
        description = "Please check your internet connection and try again."
      } else if (errorMessage.includes('authentication')) {
        title = "Authentication Error"
        description = "Please refresh the page and sign in again."
      }
      
      toast({
        title,
        description,
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
    <div className="flex flex-col h-full w-full bg-background relative">
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 min-h-0">
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
        {(() => {
          const shouldShowEmpty = messages.length === 0 && !loading;
          console.log('🎨 UI Decision:', { 
            messagesLength: messages.length, 
            loading, 
            shouldShowEmpty,
            currentConversationId 
          });
          return shouldShowEmpty;
        })() ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <Icon name="scale" className="w-16 h-16 text-primary" />
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {currentConversationId ? "No messages yet" : "Welcome to graysen"}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {currentConversationId 
                  ? "Start asking your legal questions in this conversation" 
                  : "Get instant answers backed by real-time legal research, verified citations, and comprehensive legal analysis from the latest sources."
                }
              </p>
            </div>
            {!currentConversationId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
              <Button
                variant="outline"
                className="h-auto p-4 text-left"
                onClick={() => handleSendMessage("What are the latest UAE employment law changes in 2024?")}
              >
                <div className="space-y-1">
                  <div className="font-medium">Latest Employment Updates</div>
                  <div className="text-sm text-muted-foreground">
                    Real-time UAE labor law changes
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 text-left"
                onClick={() => handleSendMessage("What are the new Dubai business licensing requirements for 2025?")}
              >
                <div className="space-y-1">
                  <div className="font-medium">Business Licensing</div>
                  <div className="text-sm text-muted-foreground">
                    Current registration procedures
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 text-left"
                onClick={() => handleSendMessage("What are my rights as an employee in the UAE according to current law?")}
              >
                <div className="space-y-1">
                  <div className="font-medium">Employee Rights</div>
                  <div className="text-sm text-muted-foreground">
                    Current workplace protections
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 text-left"
                onClick={() => handleSendMessage("How do UAE contract laws apply to international businesses in 2024?")}
              >
                <div className="space-y-1">
                  <div className="font-medium">Contract Law</div>
                  <div className="text-sm text-muted-foreground">
                    International business applications
                  </div>
                </div>
              </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
          <MessageBubble 
            key={message.id} 
            message={message}
            isStreaming={index === messages.length - 1 && loading}
          />
            ))}
            {loading && (
              <div className="flex items-start space-x-4 animate-pulse">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-primary/40 rounded-full animate-bounce"></div>
                  </div>
                </div>
                <div className="flex-1 bg-secondary/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">AI Assistant</div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Searching internal documents...</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Fetching real-time research...</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>Generating response...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="flex-shrink-0 bg-background px-4 py-6">
        <div className="max-w-4xl mx-auto">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendMessage}
                disabled={loading}
                placeholder="Ask a question about UAE law..."
              />
              
              {/* Action buttons below chat input */}
              <div className="flex items-center gap-4 mt-2 px-1">
                <button
                  onClick={() => setShowLawyerDialog(true)}
                  disabled={loading}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Icon name="user" className="h-4 w-4" />
                  <span>Speak to a Lawyer</span>
                </button>
                
                <button
                  onClick={() => setShowLetterDialog(true)}
                  disabled={loading}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Icon name="file-text" className="h-4 w-4" />
                  <span>Suggest Document</span>
                </button>
              </div>
          
          {showLawyerDialog && (
            <div className="mt-4">
              <LawyerRequestButton conversationId={currentConversationId} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLawyerDialog(false)}
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          )}
          
          {showLetterDialog && (
            <div className="mt-4">
              <SuggestLetterButton conversationId={currentConversationId} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLetterDialog(false)}
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Auto Letter Suggestion Popup */}
      {showAutoPopup && lastLetterSuggestion && (
        <AutoLetterSuggestionPopup
          suggestion={lastLetterSuggestion}
          conversationId={currentConversationId}
          onDismiss={handleDismissPopup}
        />
      )}

      {/* Scroll Navigation Buttons */}
      {showScrollButtons && (
        <div className="fixed right-8 bottom-32 flex flex-col gap-2 z-10">
          <Button
            size="icon"
            variant="secondary"
            onClick={scrollUp}
            className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all"
            title="Scroll up"
          >
            <Icon name="chevron-up" className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={scrollDown}
            className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all"
            title="Scroll down"
          >
            <Icon name="chevron-down" className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}