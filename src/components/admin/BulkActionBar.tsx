import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BulkActionBarProps {
  selectedItems: string[]
  onClearSelection: () => void
  onBulkApprove?: () => Promise<void>
  onBulkReject?: () => Promise<void>
  onBulkDelete?: () => Promise<void>
  itemType?: string
}

export const BulkActionBar = ({
  selectedItems,
  onClearSelection,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
  itemType = "items"
}: BulkActionBarProps) => {
  const [loading, setLoading] = useState<string | null>(null)

  const handleBulkAction = async (action: () => Promise<void>, actionType: string) => {
    try {
      setLoading(actionType)
      await action()
      onClearSelection()
      toast.success(`Successfully ${actionType} ${selectedItems.length} ${itemType}`)
    } catch (error) {
      console.error(`Error with bulk ${actionType}:`, error)
      toast.error(`Failed to ${actionType} ${itemType}`)
    } finally {
      setLoading(null)
    }
  }

  if (selectedItems.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4">
        <Badge variant="secondary" className="px-3 py-1">
          {selectedItems.length} {itemType} selected
        </Badge>
        
        <div className="flex items-center gap-2">
          {onBulkApprove && (
            <Button
              size="sm"
              variant="default"
              disabled={loading !== null}
              onClick={() => handleBulkAction(onBulkApprove, "approved")}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading === "approved" ? (
                <Icon name="loader" className="h-4 w-4 animate-spin" />
              ) : (
                <Icon name="check-circle" className="h-4 w-4" />
              )}
              <span className="ml-2">Approve</span>
            </Button>
          )}
          
          {onBulkReject && (
            <Button
              size="sm"
              variant="destructive"
              disabled={loading !== null}
              onClick={() => handleBulkAction(onBulkReject, "rejected")}
            >
              {loading === "rejected" ? (
                <Icon name="loader" className="h-4 w-4 animate-spin" />
              ) : (
                <Icon name="x-circle" className="h-4 w-4" />
              )}
              <span className="ml-2">Reject</span>
            </Button>
          )}
          
          {onBulkDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading !== null}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Icon name="trash-2" className="h-4 w-4" />
                  <span className="ml-2">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedItems.length} {itemType}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleBulkAction(onBulkDelete, "deleted")}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            disabled={loading !== null}
          >
            <Icon name="x" className="h-4 w-4" />
            <span className="ml-2">Clear</span>
          </Button>
        </div>
      </div>
    </div>
  )
}