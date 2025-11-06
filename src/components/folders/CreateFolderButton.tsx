import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"

interface CreateFolderButtonProps {
  onClick: () => void
}

export const CreateFolderButton = ({ onClick }: CreateFolderButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 h-9"
      onClick={onClick}
    >
      <Icon name="folder-plus" className="h-4 w-4" />
      <span>New Folder</span>
    </Button>
  )
}
