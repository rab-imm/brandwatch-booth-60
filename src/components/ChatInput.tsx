import { useState, useRef, useEffect } from "react"
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[60px] max-h-32 resize-none pr-12"
          rows={2}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!value.trim() || disabled}
          className="absolute bottom-2 right-2 h-8 w-8 p-0"
        >
          <Icon name="send" className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span>{value.length}/1000</span>
      </div>
    </form>
  )
}