import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useChatContext } from "@/contexts/ChatContext"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { ConversationHeader } from "@/components/ConversationHeader"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/integrations/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { FolderItem } from "./folders/FolderItem"
import { CreateFolderButton } from "./folders/CreateFolderButton"
import { FolderManager } from "./folders/FolderManager"
import { ConversationContextMenu } from "./folders/ConversationContextMenu"

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  folder_id?: string
}

interface Folder {
  id: string
  name: string
  icon: string
  color?: string
  position: number
}

const truncateToWords = (text: string, maxWords: number = 4): string => {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }
  return words.slice(0, maxWords).join(' ') + '...';
};

export const ConversationSidebar = () => {
  const { user, refetchProfile } = useAuth()
  const { currentConversationId, switchConversation, createNewConversation } = useChatContext()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [showFolderManager, setShowFolderManager] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | undefined>()
  const [draggedConversationId, setDraggedConversationId] = useState<string | null>(null)
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null)

  const fetchConversations = async () => {
    if (!user) return

    try {
      console.log('🔄 Fetching conversations for user:', user.id)
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      console.log('📋 Conversations fetched:', data?.length || 0)
      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFolders = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('conversation_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true })

      if (error) throw error
      setFolders(data || [])
    } catch (error) {
      console.error('Error fetching folders:', error)
    }
  }

  useEffect(() => {
    fetchConversations()
    fetchFolders()
  }, [user])

  // Listen for realtime changes
  useEffect(() => {
    if (!user) return

    console.log('Setting up realtime subscriptions')
    
    const conversationChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('Realtime conversation change:', payload)
          fetchConversations()
        }
      )
      .subscribe()

    const folderChannel = supabase
      .channel('folders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_folders'
        },
        (payload) => {
          console.log('Realtime folder change:', payload)
          fetchFolders()
        }
      )
      .subscribe()

    return () => {
      console.log('Cleaning up realtime subscriptions')
      supabase.removeChannel(conversationChannel)
      supabase.removeChannel(folderChannel)
    }
  }, [user])

  // Refresh conversations when a new conversation is created
  useEffect(() => {
    if (currentConversationId && user) {
      const existsInList = conversations.some(conv => conv.id === currentConversationId)
      if (!existsInList) {
        console.log('🔄 New conversation detected, refreshing list')
        const timeoutId = setTimeout(() => {
          fetchConversations()
        }, 100)
        
        return () => clearTimeout(timeoutId)
      }
    }
  }, [currentConversationId, user])

  const handleNewConversation = async () => {
    try {
      await createNewConversation()
      console.log('✅ New conversation UI cleared')
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const handleSelectConversation = async (conversationId: string) => {
    try {
      await switchConversation(conversationId)
    } catch (error) {
      console.error('Error switching conversation:', error)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId)

      if (messagesError) {
        console.error("Error deleting messages:", messagesError)
        toast.error("Failed to delete conversation messages")
        return
      }

      const { error: conversationError } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId)

      if (conversationError) {
        console.error("Error deleting conversation:", conversationError)
        toast.error("Failed to delete conversation")
        return
      }

      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      
      // If this was the current conversation, create a new one
      if (currentConversationId === conversationId) {
        await createNewConversation()
      }
      
      toast.success("Conversation deleted")
    } catch (error) {
      console.error("Error in handleDeleteConversation:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleResetQueries = async () => {
    setResetting(true)
    try {
      const { error } = await supabase.rpc('reset_user_queries')
      if (error) throw error
      
      await refetchProfile()
      toast.success('Queries reset successfully!')
    } catch (error) {
      console.error('Error resetting queries:', error)
      toast.error('Failed to reset queries')
    } finally {
      setResetting(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, conversationId: string, currentFolderId?: string) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("conversationId", conversationId)
    e.dataTransfer.setData("currentFolderId", currentFolderId || "")
    setDraggedConversationId(conversationId)
  }

  const handleDragEnd = () => {
    setDraggedConversationId(null)
    setDropTargetFolderId(null)
  }

  const moveConversationToFolder = async (conversationId: string, targetFolderId: string | null) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ folder_id: targetFolderId })
        .eq('id', conversationId)

      if (error) throw error
      
      toast.success(targetFolderId ? 'Moved to folder' : 'Removed from folder')
      fetchConversations()
    } catch (error) {
      console.error('Error moving conversation:', error)
      toast.error('Failed to move conversation')
    }
  }

  const handleDropOnUncategorized = async (e: React.DragEvent) => {
    e.preventDefault()
    const conversationId = e.dataTransfer.getData("conversationId")
    const currentFolderId = e.dataTransfer.getData("currentFolderId") || null
    
    if (conversationId && currentFolderId) {
      await moveConversationToFolder(conversationId, null)
    }
    
    setDraggedConversationId(null)
    setDropTargetFolderId(null)
  }

  const handleDragOverUncategorized = (e: React.DragEvent) => {
    e.preventDefault()
    setDropTargetFolderId("uncategorized")
  }

  const handleDragLeaveUncategorized = () => {
    setDropTargetFolderId(null)
  }

  // Group conversations by folder
  const conversationsByFolder = conversations.reduce((acc, conv) => {
    const folderId = conv.folder_id || "uncategorized"
    if (!acc[folderId]) acc[folderId] = []
    acc[folderId].push(conv)
    return acc
  }, {} as Record<string, Conversation[]>)

  const uncategorizedConversations = conversationsByFolder["uncategorized"] || []

  if (loading) {
    return (
      <div className="w-64 border-r bg-muted/10 p-4 shrink-0">
        <div className="text-sm text-muted-foreground">Loading conversations...</div>
      </div>
    )
  }

  return (
    <div className="w-64 border-r bg-muted/10 flex flex-col h-full shrink-0">
      <ConversationHeader
        currentConversationId={currentConversationId}
        onNewChat={handleNewConversation}
        loading={loading}
      />

      <div className="p-2 border-b">
        <CreateFolderButton onClick={() => {
          setEditingFolder(undefined)
          setShowFolderManager(true)
        }} />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-2">
            {/* Folders */}
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                conversations={conversationsByFolder[folder.id] || []}
                currentConversationId={currentConversationId}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={handleDeleteConversation}
                onEditFolder={() => {
                  setEditingFolder(folder)
                  setShowFolderManager(true)
                }}
                onFolderDeleted={fetchFolders}
                onNewChatInFolder={async (folderId) => {
                  await createNewConversation()
                  // Wait a bit for the conversation to be created
                  setTimeout(async () => {
                    const newConvId = currentConversationId
                    if (newConvId) {
                      await supabase
                        .from('conversations')
                        .update({ folder_id: folderId })
                        .eq('id', newConvId)
                      fetchConversations()
                    }
                  }, 100)
                }}
                draggedConversationId={draggedConversationId}
                dropTargetFolderId={dropTargetFolderId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onMoveToFolder={moveConversationToFolder}
                onDropTargetChange={setDropTargetFolderId}
              />
            ))}

            {/* Uncategorized conversations */}
            {uncategorizedConversations.length > 0 && (
              <div 
                className={`space-y-1 rounded-lg transition-colors ${
                  dropTargetFolderId === "uncategorized" ? "bg-accent/50 border-2 border-primary" : ""
                }`}
                onDrop={handleDropOnUncategorized}
                onDragOver={handleDragOverUncategorized}
                onDragLeave={handleDragLeaveUncategorized}
              >
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Uncategorized ({uncategorizedConversations.length})
                </div>
                {uncategorizedConversations.map((conversation) => (
                  <ConversationContextMenu
                    key={conversation.id}
                    conversationId={conversation.id}
                    currentFolderId={conversation.folder_id}
                    folders={folders}
                    onDelete={() => handleDeleteConversation(conversation.id)}
                    onMoveComplete={fetchConversations}
                  >
                    <div 
                      className={`relative cursor-grab active:cursor-grabbing ${draggedConversationId === conversation.id ? "opacity-50" : ""}`}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, conversation.id, conversation.folder_id)}
                      onDragEnd={handleDragEnd}
                      onMouseEnter={(e) => {
                        const trashBtn = e.currentTarget.querySelector('.trash-icon-btn');
                        if (trashBtn) {
                          trashBtn.classList.remove('opacity-0');
                          trashBtn.classList.add('opacity-100');
                        }
                      }}
                      onMouseLeave={(e) => {
                        const trashBtn = e.currentTarget.querySelector('.trash-icon-btn');
                        if (trashBtn) {
                          trashBtn.classList.remove('opacity-100');
                          trashBtn.classList.add('opacity-0');
                        }
                      }}
                    >
                      <Button
                        variant="ghost"
                        className={`w-full justify-start h-auto p-3 pr-10 text-left rounded-md transition-colors relative ${
                          currentConversationId === conversation.id 
                            ? "bg-secondary" 
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => handleSelectConversation(conversation.id)}
                      >
                        <div className="space-y-1 w-full overflow-hidden pointer-events-none min-w-0">
                          <div className="font-medium truncate" title={conversation.title}>
                            {truncateToWords(conversation.title)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {formatDistanceToNow(new Date(conversation.updated_at), {
                              addSuffix: true
                            })}
                          </div>
                        </div>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="trash-icon-btn absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 z-10 opacity-0 transition-opacity hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConversation(conversation.id)
                        }}
                      >
                        <Icon name="trash" className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </ConversationContextMenu>
                ))}
              </div>
            )}

            {conversations.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No conversations yet
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      <div className="border-t p-3 shrink-0">
        <Button
          onClick={handleResetQueries}
          disabled={resetting}
          variant="outline"
          size="sm"
          className="w-full gap-2"
        >
          <Icon name="refresh-cw" className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
          {resetting ? 'Resetting...' : 'Reset Queries'}
        </Button>
      </div>

      <FolderManager
        open={showFolderManager}
        onOpenChange={setShowFolderManager}
        folder={editingFolder}
        onSuccess={fetchFolders}
      />
    </div>
  )
}
