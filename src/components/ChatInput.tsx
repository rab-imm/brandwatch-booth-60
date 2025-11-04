import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icon } from "@/components/ui/Icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export const ChatInput = ({ 
  value, 
  onChange, 
  onSend, 
  disabled = false, 
  placeholder = "Type your message..." 
}: ChatInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !disabled) {
      onSend(value.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-2 bg-background border rounded-full px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full shrink-0"
              disabled={disabled}
            >
              <Icon name="plus" className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <Icon name="upload" className="mr-2 h-4 w-4" />
              Upload Document
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="image" className="mr-2 h-4 w-4" />
              Attach Image
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="camera" className="mr-2 h-4 w-4" />
              Take Screenshot
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
        />
        
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim() || disabled}
          className="h-8 w-8 rounded-full shrink-0"
        >
          <Icon name="arrow-up" className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}