import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useChatContext } from "@/contexts/ChatContext"
import { useToast } from "@/components/ui/use-toast"

interface DeleteConversationButtonProps {
  conversationId: string | null
}

export const DeleteConversationButton = ({ conversationId }: DeleteConversationButtonProps) => {
  const { deleteConversation } = useChatContext()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  if (!conversationId) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteConversation(conversationId)
      toast({
        title: "Conversation deleted",
        description: "The conversation has been successfully deleted.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={isDeleting}
        >
          <Icon name="trash" className="w-4 h-4 mr-2" />
          Delete Chat
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}