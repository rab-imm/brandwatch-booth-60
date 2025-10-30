import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  notes?: string
  tags?: string[]
  created_at: string
}

interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete: (contactId: string) => void
}

export const ContactCard = ({ contact, onEdit, onDelete }: ContactCardProps) => {
  const initial = contact.name.charAt(0).toUpperCase()

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-semibold text-primary">{initial}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{contact.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
          {contact.phone && (
            <p className="text-sm text-muted-foreground mt-1">{contact.phone}</p>
          )}
          {contact.notes && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{contact.notes}</p>
          )}
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {contact.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(contact)}
          >
            <Icon name="edit" className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(contact.id)}
          >
            <Icon name="trash" className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  )
}