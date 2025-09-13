import { formatDistanceToNow } from "date-fns"
import { Icon } from "@/components/ui/Icon"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Message } from "@/hooks/useChatMessages"

interface MessageBubbleProps {
  message: Message
  isLoading?: boolean
}

export const MessageBubble = ({ message, isLoading = false }: MessageBubbleProps) => {
  const isUser = message.role === 'user'

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
                <p className={`text-sm leading-relaxed ${
                  isUser ? 'text-primary-foreground' : 'text-foreground'
                } whitespace-pre-wrap`}>
                  {message.content}
                </p>
              )}
            </div>

            {!isUser && !isLoading && message.sources && (
              <div className="space-y-3 pt-2 border-t border-border/20">
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
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Research Sources:</p>
                    <div className="space-y-1">
                      {message.sources.research.slice(0, 3).map((source, index) => (
                        <div key={index} className="text-xs bg-muted/50 rounded p-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{source.title}</span>
                            {source.url && (
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline ml-2"
                              >
                                <Icon name="external-link" className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {source.snippet && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {source.snippet}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {message.sources.documents && message.sources.documents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Document Sources:</p>
                    <div className="space-y-1">
                      {message.sources.documents.slice(0, 2).map((source, index) => (
                        <div key={index} className="text-xs bg-secondary/20 rounded p-2">
                          <div className="font-medium">{source.title}</div>
                          <div className="text-muted-foreground">Category: {source.category}</div>
                          <div className="text-muted-foreground">Relevance: {Math.round(source.similarity * 100)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}