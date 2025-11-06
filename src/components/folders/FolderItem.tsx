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
  onNewChatInFolder: (folderId: string) => void
  draggedConversationId: string | null
  dropTargetFolderId: string | null
  onDragStart: (e: React.DragEvent, conversationId: string, currentFolderId?: string) => void
  onDragEnd: () => void
  onMoveToFolder: (conversationId: string, targetFolderId: string | null) => Promise<void>
  onDropTargetChange: (folderId: string | null) => void
}

export const FolderItem = ({
  folder,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onEditFolder,
  onFolderDeleted,
  onNewChatInFolder,
  draggedConversationId,
  dropTargetFolderId,
  onDragStart,
  onDragEnd,
  onMoveToFolder,
  onDropTargetChange,
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
      // First, move all conversations out of the folder to "Uncategorized"
      const { error: updateError } = await supabase
        .from("conversations")
        .update({ folder_id: null })
        .eq("folder_id", folder.id)
      
      if (updateError) throw updateError

      // Then delete the folder
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const conversationId = e.dataTransfer.getData("conversationId")
    const currentFolderId = e.dataTransfer.getData("currentFolderId") || null
    
    if (conversationId && currentFolderId !== folder.id) {
      await onMoveToFolder(conversationId, folder.id)
      setIsExpanded(true) // Auto-expand to show the new conversation
    }
    
    onDropTargetChange(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDropTargetChange(folder.id)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    // Only clear if we're actually leaving the folder (not entering a child)
    if (e.currentTarget === e.target) {
      onDropTargetChange(null)
    }
  }

  return (
    <div className="mb-2">
      <div 
        className={`flex items-center gap-1 px-3 py-2 hover:bg-accent rounded-lg group transition-colors ${
          dropTargetFolderId === folder.id ? "bg-accent/50 border-2 border-primary" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
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

        <span className="text-xs text-muted-foreground flex-shrink-0">{conversations.length}</span>

        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
          onClick={() => onNewChatInFolder(folder.id)}
          title="New chat in folder"
        >
          <Icon name="plus" className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            setShowDeleteDialog(true)
          }}
          title="Delete folder"
        >
          <Icon name="trash" className="h-3.5 w-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
            >
              <Icon name="more-vertical" className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditFolder}>
              <Icon name="edit" className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && conversations.length > 0 && (
        <div className="ml-7 mt-1 space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg group transition-all cursor-grab active:cursor-grabbing ${
                currentConversationId === conversation.id
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              } ${draggedConversationId === conversation.id ? "opacity-50 scale-95" : ""}`}
              draggable="true"
              onDragStart={(e) => {
                e.stopPropagation()
                onDragStart(e, conversation.id, folder.id)
              }}
              onDragEnd={onDragEnd}
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
