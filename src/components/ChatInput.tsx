import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Icon } from "@/components/ui/Icon"

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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = inputRef.current
    if (textarea) {
      textarea.style.height = '24px' // Reset to min height
      const newHeight = Math.min(textarea.scrollHeight, 120) // Max 120px
      textarea.style.height = `${newHeight}px`
    }
  }, [value])

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
        <Textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 min-h-[24px] resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap overflow-hidden"
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