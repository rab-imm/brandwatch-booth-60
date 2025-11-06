import { useState } from "react"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface FolderItemProps {
  folder: {
    id: string
    name: string
    icon: string
    color?: string
  }
  conversations: Conversation[]
  currentConversationId?: string
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onEditFolder: () => void
  onFolderDeleted: () => void
}

export const FolderItem = ({
  folder,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onEditFolder,
  onFolderDeleted,
}: FolderItemProps) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(`folder-expanded-${folder.id}`)
    return saved !== null ? saved === "true" : true
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const toggleExpanded = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    localStorage.setItem(`folder-expanded-${folder.id}`, String(newState))
  }

  const handleDeleteFolder = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from("conversation_folders")
        .delete()
        .eq("id", folder.id)

      if (error) throw error
      toast.success("Folder deleted successfully")
      onFolderDeleted()
    } catch (error: any) {
      console.error("Error deleting folder:", error)
      toast.error(error.message || "Failed to delete folder")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-lg group">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={toggleExpanded}
        >
          <Icon
            name={isExpanded ? "chevron-down" : "chevron-right"}
            className="h-4 w-4"
          />
        </Button>

        <Icon
          name={folder.icon as any}
          className="h-4 w-4 flex-shrink-0"
          style={{ color: folder.color }}
        />

        <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>

        <span className="text-xs text-muted-foreground">{conversations.length}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            >
              <Icon name="more-vertical" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditFolder}>
              <Icon name="edit" className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive"
            >
              <Icon name="trash" className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && conversations.length > 0 && (
        <div className="ml-7 mt-1 space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group ${
                currentConversationId === conversation.id
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <Icon name="message-circle" className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm truncate">{conversation.title}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteConversation(conversation.id)
                }}
              >
                <Icon name="trash" className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isExpanded && conversations.length === 0 && (
        <div className="ml-7 mt-1 px-3 py-2 text-xs text-muted-foreground">
          No conversations yet
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this folder? Conversations in this folder will be moved to Uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
