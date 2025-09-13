import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"

interface NewChatButtonProps {
  onNewChat: () => void
  loading?: boolean
}

export const NewChatButton = ({ onNewChat, loading }: NewChatButtonProps) => {
  return (
    <Button
      onClick={onNewChat}
      disabled={loading}
      variant="outline"
      className="w-full justify-start gap-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
    >
      <Icon name="plus" className="h-4 w-4" />
      Start New Conversation
    </Button>
  )
}