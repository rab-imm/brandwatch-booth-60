import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { Input } from "@/components/ui/input"
import { ContactCard } from "@/components/contacts/ContactCard"
import { ContactForm } from "@/components/contacts/ContactForm"
import { supabase } from "@/integrations/supabase/client"
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
} from "@/components/ui/alert-dialog"

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  notes?: string
  tags?: string[]
  created_at: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadContacts()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      setFilteredContacts(
        contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(query) ||
            contact.email.toLowerCase().includes(query) ||
            contact.phone?.toLowerCase().includes(query)
        )
      )
    } else {
      setFilteredContacts(contacts)
    }
  }, [searchQuery, contacts])

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

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormOpen(true)
  }

  const handleDelete = async (contactId: string) => {
    setContactToDelete(contactId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!contactToDelete) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("You must be logged in")
        return
      }

      const { data, error } = await supabase.functions.invoke('manage-contacts', {
        body: {
          action: 'delete',
          contactId: contactToDelete,
        },
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete contact')
      }

      toast.success('Contact deleted')
      loadContacts()
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    } finally {
      setDeleteDialogOpen(false)
      setContactToDelete(null)
    }
  }

  const handleAddNew = () => {
    setEditingContact(null)
    setFormOpen(true)
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Contacts</h1>
            <p className="text-muted-foreground">
              Manage your contact book for quick document sharing and signatures
            </p>
          </div>
          <Button onClick={handleAddNew} className="gap-2">
            <Icon name="plus" className="h-4 w-4" />
            Add Contact
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Contacts List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Icon name="users" className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try a different search term'
                : 'Add your first contact to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={handleAddNew} className="gap-2">
                <Icon name="plus" className="h-4 w-4" />
                Add Your First Contact
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Contact Form Dialog */}
        <ContactForm
          open={formOpen}
          onOpenChange={setFormOpen}
          contact={editingContact}
          onSuccess={loadContacts}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this contact? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}