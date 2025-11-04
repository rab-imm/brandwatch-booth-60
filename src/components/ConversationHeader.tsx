import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ConversationHeaderProps {
  currentConversationId: string | null
  onNewChat: () => void
  loading?: boolean
}

export const ConversationHeader = ({ currentConversationId, onNewChat, loading }: ConversationHeaderProps) => {
  return (
    <div className="border-b p-4 bg-secondary/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon name="message-square" className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Conversations</h2>
        </div>
        <Badge variant="outline" className="text-xs">
          {currentConversationId ? 'Active' : 'None'}
        </Badge>
      </div>
      
      <Button
        onClick={onNewChat}
        disabled={loading}
        variant="default"
        size="sm"
        className="w-full gap-2"
      >
        <Icon name="plus" className="h-4 w-4" />
        New Chat
      </Button>
    </div>
  )
}