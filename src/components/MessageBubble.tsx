import { formatDistanceToNow } from "date-fns"
import { Icon } from "@/components/ui/Icon"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Message } from "@/hooks/useChatMessages"
import { useNavigate } from "react-router-dom"
import DOMPurify from "dompurify"

interface MessageBubbleProps {
  message: Message
  isLoading?: boolean
}

export const MessageBubble = ({ message, isLoading = false }: MessageBubbleProps) => {
  const isUser = message.role === 'user'
  const navigate = useNavigate()

  const handleCreateLetter = () => {
    if (message.suggestedLetter) {
      navigate('/letters/create', {
        state: {
          letterType: message.suggestedLetter.letterType,
          suggestedTitle: message.suggestedLetter.suggestedTitle,
          conversationContext: message.content
        }
      })
    }
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-3 max-w-3xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          <Icon 
            name={isUser ? "user" : "scale"} 
            className="w-4 h-4" 
          />
        </div>
        
        <Card className={`p-4 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${
                isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
              }`}>
                {isUser ? 'You' : 'AI Legal Assistant'}
              </span>
              <span className={`text-xs ${
                isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
              }`}>
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <div className="prose prose-sm max-w-none">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  </div>
                  <span className="text-sm">Analyzing your query...</span>
                </div>
              ) : (
                <div className={`text-sm leading-relaxed ${
                  isUser ? 'text-primary-foreground' : 'text-foreground'
                }`} dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    isUser 
                      ? message.content.replace(/\n/g, '<br/>') 
                      : message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/(^|\n)### (.*$)/gim, '$1<h3 class="font-semibold text-base mb-2 mt-4">$2</h3>')
                          .replace(/(^|\n)## (.*$)/gim, '$1<h2 class="font-semibold text-lg mb-2 mt-4">$2</h2>')
                          .replace(/(^|\n)# (.*$)/gim, '$1<h1 class="font-bold text-xl mb-2 mt-4">$2</h1>')
                          .replace(/\n/g, '<br/>'),
                    {
                      ALLOWED_TAGS: ['br', 'strong', 'em', 'h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li'],
                      ALLOWED_ATTR: ['class']
                    }
                  )
                }} />
              )}
            </div>

            {!isUser && !isLoading && message.sources && (
              <div className="space-y-3 pt-3 border-t border-border/20 overflow-visible">
                <div className="flex items-center flex-wrap gap-2">
                  {message.sources.research && message.sources.research.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Icon name="globe" className="w-3 h-3 mr-1" />
                      Real-time Research
                    </Badge>
                  )}
                  {message.sources.documents && message.sources.documents.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Icon name="file-text" className="w-3 h-3 mr-1" />
                      Internal Docs
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    <Icon name="book" className="w-3 h-3 mr-1" />
                    UAE Law
                  </Badge>
                  <Badge variant="default" className="text-xs">
                    <Icon name="link" className="w-3 h-3 mr-1" />
                    {(message.sources.research?.length || 0) + (message.sources.documents?.length || 0)} Sources
                  </Badge>
                </div>
                
                {message.sources.research && message.sources.research.length > 0 && (
                  <div className="space-y-2 overflow-visible">
                    <p className="text-xs font-medium text-muted-foreground">Research Sources:</p>
                    <div className="space-y-2 overflow-visible">
                      {message.sources.research.slice(0, 3).map((source, index) => (
                        <div key={index} className="text-xs bg-muted/50 rounded-md p-3 overflow-visible relative">
                          <div className="flex items-start justify-between gap-3 min-h-[20px]">
                            <span className="font-medium text-foreground leading-tight flex-1 pr-2">{source.title}</span>
                            {source.url && (
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded hover:bg-primary/10 relative z-10"
                                title="Open source link"
                              >
                                <Icon name="external-link" className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {source.snippet && (
                            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                              {source.snippet}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {message.sources.documents && message.sources.documents.length > 0 && (
                  <div className="space-y-2 overflow-visible">
                    <p className="text-xs font-medium text-muted-foreground">Document Sources:</p>
                    <div className="space-y-2 overflow-visible">
                      {message.sources.documents.slice(0, 2).map((source, index) => (
                        <div key={index} className="text-xs bg-secondary/20 rounded-md p-3 overflow-visible">
                          <div className="font-medium text-foreground">{source.title}</div>
                          <div className="text-muted-foreground mt-1">Category: {source.category}</div>
                          <div className="text-muted-foreground">Relevance: {Math.round(source.similarity * 100)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isUser && !isLoading && message.suggestedLetter && message.suggestedLetter.confidence > 60 && (
              <div className="mt-4 pt-4 border-t border-border/20">
                <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon name="file-text" className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">Generate Legal Letter</h4>
                        <Badge variant="secondary" className="text-xs">
                          {message.suggestedLetter.confidence}% match
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {message.suggestedLetter.reasoning}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={handleCreateLetter}
                          className="gap-2"
                        >
                          <Icon name="file-plus" className="w-4 h-4" />
                          Create {message.suggestedLetter.letterType.replace(/_/g, ' ')}
                        </Button>
                        <span className="text-xs text-muted-foreground">5 credits</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}