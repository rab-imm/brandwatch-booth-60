import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
}

interface ContactSelectorProps {
  onSelect: (contact: Contact) => void
  placeholder?: string
  buttonText?: string
}

export const ContactSelector = ({ 
  onSelect, 
  placeholder = "Search contacts...",
  buttonText = "Select from Contacts"
}: ContactSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadContacts()
    }
  }, [open])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("You must be logged in")
        return
      }

      const { data, error } = await supabase.functions.invoke('manage-contacts', {
        body: { action: 'list' },
      })

      if (error) throw error

      if (data.success) {
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (contact: Contact) => {
    onSelect(contact)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Icon name="users" className="h-4 w-4" />
          {buttonText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandEmpty>
            {loading ? "Loading..." : "No contacts found."}
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {contacts.map((contact) => (
              <CommandItem
                key={contact.id}
                onSelect={() => handleSelect(contact)}
                className="cursor-pointer"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{contact.name}</span>
                  <span className="text-xs text-muted-foreground">{contact.email}</span>
                  {contact.phone && (
                    <span className="text-xs text-muted-foreground">{contact.phone}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}