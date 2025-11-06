import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
  onLawyerRequest?: () => void
  onSuggestLetter?: () => void
}

export const ChatInput = ({ 
  value, 
  onChange, 
  onSend, 
  disabled = false, 
  placeholder = "Type your message...",
  onLawyerRequest,
  onSuggestLetter
}: ChatInputProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !disabled) {
      onSend(value.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
          <DropdownMenuContent align="start" className="w-56 bg-background border shadow-md z-50">
            {onLawyerRequest && (
              <DropdownMenuItem onClick={onLawyerRequest}>
                <Icon name="user" className="mr-2 h-4 w-4" />
                Speak to a Lawyer
              </DropdownMenuItem>
            )}
            {onSuggestLetter && (
              <DropdownMenuItem onClick={onSuggestLetter}>
                <Icon name="file-text" className="mr-2 h-4 w-4" />
                Suggest Letter
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 min-h-[24px] max-h-[120px] resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap"
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