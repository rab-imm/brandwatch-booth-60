import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Icon } from "@/components/ui/Icon"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface Folder {
  id: string
  name: string
  icon: string
  color?: string
}

interface ConversationContextMenuProps {
  conversationId: string
  currentFolderId?: string
  folders: Folder[]
  onDelete: () => void
  onMoveComplete: () => void
  children: React.ReactNode
}

export const ConversationContextMenu = ({
  conversationId,
  currentFolderId,
  folders,
  onDelete,
  onMoveComplete,
  children,
}: ConversationContextMenuProps) => {
  const handleMoveToFolder = async (folderId: string | null) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ folder_id: folderId })
        .eq("id", conversationId)

      if (error) throw error
      toast.success(folderId ? "Moved to folder" : "Removed from folder")
      onMoveComplete()
    } catch (error: any) {
      console.error("Error moving conversation:", error)
      toast.error(error.message || "Failed to move conversation")
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Icon name="folder" className="h-4 w-4 mr-2" />
            Move to Folder
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {currentFolderId && (
              <>
                <ContextMenuItem onClick={() => handleMoveToFolder(null)}>
                  <Icon name="x" className="h-4 w-4 mr-2" />
                  Remove from Folder
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            {folders.map((folder) => (
              <ContextMenuItem
                key={folder.id}
                onClick={() => handleMoveToFolder(folder.id)}
                disabled={folder.id === currentFolderId}
              >
                <Icon
                  name={folder.icon as any}
                  className="h-4 w-4 mr-2"
                  style={{ color: folder.color }}
                />
                {folder.name}
              </ContextMenuItem>
            ))}
            {folders.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No folders available
              </div>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Icon name="trash" className="h-4 w-4 mr-2" />
          Delete Conversation
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
