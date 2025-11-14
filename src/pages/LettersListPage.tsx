import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContactCard } from "@/components/contacts/ContactCard"
import { ContactForm } from "@/components/contacts/ContactForm"
import { formatDistanceToNow } from "date-fns"

interface Letter {
  id: string
  title: string
  letter_type: string
  status: string
  created_at: string
  updated_at: string
  credits_used: number
  signed_at?: string | null
  signature_request?: {
    id: string
    status: string
    certificate_url?: string
    completed_at?: string
    recipients_count: number
    signed_count: number
  }
}

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  notes?: string
  tags?: string[]
  created_at: string
}

const LETTER_TYPE_LABELS: { [key: string]: string } = {
  employment_termination: "Employment Termination",
  employment_contract: "Employment Contract",
  lease_agreement: "Lease Agreement",
  lease_termination: "Lease Termination",
  demand_letter: "Demand Letter",
  nda: "Non-Disclosure Agreement",
  settlement_agreement: "Settlement Agreement",
  power_of_attorney: "Power of Attorney",
  general_legal: "General Legal",
  workplace_complaint: "Workplace Complaint",
}

const STATUS_COLORS: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
  draft: "secondary",
  finalized: "default",
  sent: "outline",
  signed: "default",
}

export default function LettersListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [letters, setLetters] = useState<Letter[]>([])
  const [filteredLetters, setFilteredLetters] = useState<Letter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [letterToDelete, setLetterToDelete] = useState<string | null>(null)
  
  // Contact management state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [contactSearchQuery, setContactSearchQuery] = useState("")
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [contactDeleteDialogOpen, setContactDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchLetters()
    }
  }, [user])

  // Contact filtering
  useEffect(() => {
    if (contactSearchQuery) {
      const query = contactSearchQuery.toLowerCase()
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
  }, [contactSearchQuery, contacts])

  useEffect(() => {
    filterLetters()
  }, [letters, searchQuery, statusFilter, typeFilter])

  // Helper function to fetch enriched letter data
  const fetchEnrichedLetter = async (letterId: string): Promise<Letter | null> => {
    const { data: letter } = await supabase
      .from('legal_letters')
      .select('*')
      .eq('id', letterId)
      .single()
    
    if (!letter) return null
    
    // If signed, enrich with signature data
    if (letter.status === 'signed') {
      const { data: signatureData } = await supabase
        .from('signature_requests')
        .select(`
          id,
          status,
          certificate_url,
          completed_at,
          signature_recipients (
            id,
            status
          )
        `)
        .eq('letter_id', letter.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (signatureData) {
        const recipients = signatureData.signature_recipients || []
        return {
          ...letter,
          signature_request: {
            id: signatureData.id,
            status: signatureData.status,
            certificate_url: signatureData.certificate_url,
            completed_at: signatureData.completed_at,
            recipients_count: recipients.length,
            signed_count: recipients.filter((r: any) => r.status === 'signed').length
          }
        }
      }
    }
    
    return letter
  }

  useEffect(() => {
    if (!user) return

    // Subscribe to real-time updates for letters
    const channel = supabase
      .channel('legal_letters_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'legal_letters',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('Letter updated:', payload)
          
          // Fetch the enriched letter data
          const enrichedLetter = await fetchEnrichedLetter(payload.new.id)
          
          if (enrichedLetter) {
            // Update the letter in state with enriched data
            setLetters(prev => 
              prev.map(letter => 
                letter.id === enrichedLetter.id 
                  ? enrichedLetter 
                  : letter
              )
            )
            
            // Show toast notification for newly signed letters
            if (enrichedLetter.status === 'signed' && payload.old.status !== 'signed') {
              toast({
                title: "Document Signed! 🎉",
                description: `"${enrichedLetter.title}" has been fully executed`,
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, toast])

  // Auto-refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchLetters()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  const fetchLetters = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data: lettersData, error: lettersError } = await supabase
        .from('legal_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (lettersError) throw lettersError
      
      // For signed letters, fetch signature details
      const enrichedLetters = await Promise.all(
        (lettersData || []).map(async (letter) => {
          if (letter.status === 'signed') {
            const { data: signatureData } = await supabase
              .from('signature_requests')
              .select(`
                id,
                status,
                certificate_url,
                completed_at,
                signature_recipients (
                  id,
                  status
                )
              `)
              .eq('letter_id', letter.id)
              .eq('status', 'completed')
              .order('completed_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            
            if (signatureData) {
              const recipients = signatureData.signature_recipients || []
              return {
                ...letter,
                signature_request: {
                  id: signatureData.id,
                  status: signatureData.status,
                  certificate_url: signatureData.certificate_url,
                  completed_at: signatureData.completed_at,
                  recipients_count: recipients.length,
                  signed_count: recipients.filter((r: any) => r.status === 'signed').length
                }
              }
            }
          }
          return letter
        })
      )
      
      setLetters(enrichedLetters)
    } catch (error: any) {
      console.error("Error fetching letters:", error)
      toast({
        title: "Failed to load letters",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterLetters = () => {
    let filtered = [...letters]

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(letter =>
        letter.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(letter => letter.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(letter => letter.letter_type === typeFilter)
    }

    setFilteredLetters(filtered)
  }

  const handleDeleteClick = (letterId: string) => {
    setLetterToDelete(letterId)
    setDeleteDialogOpen(true)
  }

  // Contact management functions
  const loadContacts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase.functions.invoke('manage-contacts', {
        body: { action: 'list' },
      })

      if (error) throw error
      if (data.success) {
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive"
      })
    }
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setContactFormOpen(true)
  }

  const handleDeleteContact = async (contactId: string) => {
    setContactToDelete(contactId)
    setContactDeleteDialogOpen(true)
  }

  const confirmDeleteContact = async () => {
    if (!contactToDelete) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase.functions.invoke('manage-contacts', {
        body: {
          action: 'delete',
          contactId: contactToDelete,
        },
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error || 'Failed to delete contact')

      toast({
        title: "Success",
        description: "Contact deleted successfully"
      })
      loadContacts()
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive"
      })
    } finally {
      setContactDeleteDialogOpen(false)
      setContactToDelete(null)
    }
  }

  const handleAddNewContact = () => {
    setEditingContact(null)
    setContactFormOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!letterToDelete) return

    try {
      const { error } = await supabase
        .from('legal_letters')
        .delete()
        .eq('id', letterToDelete)

      if (error) throw error

      toast({
        title: "Letter deleted",
        description: "The letter has been permanently deleted"
      })

      setLetters(prev => prev.filter(l => l.id !== letterToDelete))
    } catch (error: any) {
      console.error("Error deleting letter:", error)
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setDeleteDialogOpen(false)
      setLetterToDelete(null)
    }
  }

  const stats = {
    total: letters.length,
    drafts: letters.filter(l => l.status === 'draft').length,
    finalized: letters.filter(l => l.status === 'finalized').length,
    signed: letters.filter(l => l.status === 'signed').length,
  }

  return (
    <div className="container max-w-7xl py-8">
      <Tabs defaultValue="documents" className="w-full">
        {/* Breadcrumb and Tabs */}
        <div className="mb-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Icon name="chevron-right" className="h-4 w-4" />
            <span className="text-foreground font-medium">Documents & Contacts</span>
          </nav>

          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="contacts" onClick={() => loadContacts()}>Contacts</TabsTrigger>
          </TabsList>
        </div>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Legal Documents</h1>
            <p className="text-muted-foreground">Manage your generated legal documents</p>
          </div>
          <Button onClick={() => navigate('/letters/create')} className="gap-2">
            <Icon name="file-plus" className="w-4 h-4" />
            Create New Document
          </Button>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Icon name="file-text" className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">{stats.drafts}</p>
              </div>
              <Icon name="edit" className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Finalized</p>
                <p className="text-2xl font-bold">{stats.finalized}</p>
              </div>
              <Icon name="check" className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Signed</p>
                <p className="text-2xl font-bold">{stats.signed}</p>
              </div>
              <Icon name="edit" className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(LETTER_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Letters List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLetters.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Icon name="inbox" className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No documents found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {letters.length === 0
                  ? "Get started by creating your first legal document"
                  : "Try adjusting your filters"}
              </p>
              {letters.length === 0 && (
                <Button onClick={() => navigate('/letters/create')}>
                  Create Your First Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLetters.map((letter) => (
            <Card
              key={letter.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/letters/${letter.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{letter.title}</h3>
                      <Badge variant={STATUS_COLORS[letter.status]}>
                        {letter.status}
                      </Badge>
                      {letter.status === 'signed' && (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700">
                          <Icon name="check-circle" className="w-3 h-3 mr-1" />
                          Fully Executed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="file-text" className="w-4 h-4" />
                        {LETTER_TYPE_LABELS[letter.letter_type] || letter.letter_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="clock" className="w-4 h-4" />
                        {formatDistanceToNow(new Date(letter.created_at), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="zap" className="w-4 h-4" />
                        {letter.credits_used} credits
                      </span>
                    </div>
                    
                    {/* Show signature details for signed letters */}
                    {letter.status === 'signed' && letter.signature_request && (
                      <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <Icon name="users" className="w-4 h-4" />
                            {letter.signature_request.signed_count}/{letter.signature_request.recipients_count} signatures
                          </span>
                          {letter.signed_at && (
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                              <Icon name="calendar" className="w-4 h-4" />
                              Signed {formatDistanceToNow(new Date(letter.signed_at), { addSuffix: true })}
                            </span>
                          )}
                          {letter.signature_request.certificate_url && (
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                              <Icon name="file-check" className="w-4 h-4" />
                              Certificate available
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/letters/${letter.id}`)}
                    >
                      <Icon name="eye" className="w-4 h-4" />
                    </Button>
                    {letter.status === 'signed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/letters/${letter.id}?tab=signed`)}
                        className="text-emerald-600 hover:text-emerald-700 border-emerald-600"
                      >
                        <Icon name="file-check" className="w-4 h-4 mr-1" />
                        View Signed
                      </Button>
                    )}
                    {letter.status === 'signed' && letter.signature_request?.certificate_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a 
                          href={letter.signature_request.certificate_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          title="Download Certificate"
                        >
                          <Icon name="download" className="w-4 h-4 text-emerald-600" />
                        </a>
                      </Button>
                    )}
                    {letter.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(letter.id)}
                      >
                        <Icon name="trash" className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Letter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this letter? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Contacts</h1>
              <p className="text-muted-foreground">Manage your contact directory</p>
            </div>
            <Button onClick={handleAddNewContact} className="gap-2">
              <Icon name="user-plus" className="w-4 h-4" />
              Create Contact
            </Button>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <Input
                placeholder="Search contacts by name, email, or phone..."
                value={contactSearchQuery}
                onChange={(e) => setContactSearchQuery(e.target.value)}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Contacts Grid */}
          {filteredContacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={handleEditContact}
                  onDelete={handleDeleteContact}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Icon name="users" className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No contacts yet</p>
                <p className="text-muted-foreground mb-4">
                  {contactSearchQuery ? "No contacts match your search" : "Get started by creating your first contact"}
                </p>
                {!contactSearchQuery && (
                  <Button onClick={handleAddNewContact}>
                    <Icon name="user-plus" className="w-4 h-4 mr-2" />
                    Create Contact
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Contact Form Dialog */}
      <ContactForm
        open={contactFormOpen}
        onOpenChange={setContactFormOpen}
        contact={editingContact}
        onSuccess={() => {
          loadContacts()
          setContactFormOpen(false)
        }}
      />

      {/* Contact Delete Confirmation Dialog */}
      <AlertDialog open={contactDeleteDialogOpen} onOpenChange={setContactDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteContact}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
