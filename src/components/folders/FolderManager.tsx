import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@/components/ui/Icon"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FolderManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder?: {
    id: string
    name: string
    icon: string
    color?: string
  }
  onSuccess: () => void
}

const FOLDER_ICONS = [
  { value: "folder", label: "Folder" },
  { value: "briefcase", label: "Briefcase" },
  { value: "scale", label: "Scale" },
  { value: "file-text", label: "Document" },
  { value: "users", label: "Users" },
  { value: "building", label: "Building" },
  { value: "shield", label: "Shield" },
  { value: "bookmark", label: "Bookmark" },
]

const FOLDER_COLORS = [
  { value: "hsl(var(--primary))", label: "Primary" },
  { value: "hsl(var(--accent))", label: "Accent" },
  { value: "hsl(221, 83%, 53%)", label: "Blue" },
  { value: "hsl(142, 71%, 45%)", label: "Green" },
  { value: "hsl(25, 95%, 53%)", label: "Orange" },
  { value: "hsl(346, 77%, 50%)", label: "Red" },
  { value: "hsl(262, 83%, 58%)", label: "Purple" },
]

export const FolderManager = ({ open, onOpenChange, folder, onSuccess }: FolderManagerProps) => {
  const [name, setName] = useState(folder?.name || "")
  const [icon, setIcon] = useState(folder?.icon || "folder")
  const [color, setColor] = useState(folder?.color || "hsl(var(--primary))")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a folder name")
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      if (folder?.id) {
        // Update existing folder
        const { error } = await supabase
          .from("conversation_folders")
          .update({ name: name.trim(), icon, color })
          .eq("id", folder.id)

        if (error) throw error
        toast.success("Folder updated successfully")
      } else {
        // Create new folder
        const { error } = await supabase
          .from("conversation_folders")
          .insert({
            user_id: user.id,
            name: name.trim(),
            icon,
            color,
          })

        if (error) throw error
        toast.success("Folder created successfully")
      }

      onSuccess()
      onOpenChange(false)
      setName("")
      setIcon("folder")
      setColor("hsl(var(--primary))")
    } catch (error: any) {
      console.error("Error saving folder:", error)
      toast.error(error.message || "Failed to save folder")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{folder ? "Edit Folder" : "Create Folder"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Contract Reviews"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Icon name={icon as any} className="h-4 w-4" />
                      <span>{FOLDER_ICONS.find(i => i.value === icon)?.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FOLDER_ICONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center gap-2">
                        <Icon name={item.value as any} className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                      <span>{FOLDER_COLORS.find(c => c.value === color)?.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FOLDER_COLORS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: item.value }} />
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : folder ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
