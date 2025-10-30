import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

interface Contact {
  id?: string
  name: string
  email: string
  phone?: string
  notes?: string
  tags?: string[]
}

interface ContactFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact | null
  onSuccess: () => void
}

export const ContactForm = ({ open, onOpenChange, contact, onSuccess }: ContactFormProps) => {
  const [formData, setFormData] = useState<Contact>({
    name: "",
    email: "",
    phone: "",
    notes: "",
    tags: [],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || "",
        notes: contact.notes || "",
        tags: contact.tags || [],
      })
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        notes: "",
        tags: [],
      })
    }
  }, [contact, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("You must be logged in")
        return
      }

      const { data, error } = await supabase.functions.invoke('manage-contacts', {
        body: {
          action: contact?.id ? 'update' : 'create',
          contactId: contact?.id,
          contact: formData,
        },
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Failed to save contact')
      }

      toast.success(contact?.id ? 'Contact updated' : 'Contact added')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving contact:', error)
      toast.error(error.message || 'Failed to save contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{contact?.id ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            <DialogDescription>
              {contact?.id 
                ? 'Update the contact information below.'
                : 'Add a new contact to your address book.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+971 50 123 4567"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : contact?.id ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}