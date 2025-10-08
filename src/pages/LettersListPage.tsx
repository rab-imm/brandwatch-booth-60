import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
import { formatDistanceToNow } from "date-fns"

interface Letter {
  id: string
  title: string
  letter_type: string
  status: string
  created_at: string
  updated_at: string
  credits_used: number
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

  useEffect(() => {
    if (user) {
      fetchLetters()
    }
  }, [user])

  useEffect(() => {
    filterLetters()
  }, [letters, searchQuery, statusFilter, typeFilter])

  const fetchLetters = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('legal_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLetters(data || [])
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Legal Letters</h1>
          <p className="text-muted-foreground">Manage your generated legal letters</p>
        </div>
        <Button onClick={() => navigate('/letters/create')} className="gap-2">
          <Icon name="file-plus" className="w-4 h-4" />
          Create New Letter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Letters</p>
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
              <Icon name="check-circle" className="w-8 h-8 text-muted-foreground" />
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
              <Icon name="pen-tool" className="w-8 h-8 text-muted-foreground" />
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
                placeholder="Search letters..."
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
              <h3 className="font-semibold mb-2">No letters found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {letters.length === 0
                  ? "Get started by creating your first legal letter"
                  : "Try adjusting your filters"}
              </p>
              {letters.length === 0 && (
                <Button onClick={() => navigate('/letters/create')}>
                  Create Your First Letter
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
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="tag" className="w-4 h-4" />
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
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/letters/${letter.id}`)}
                    >
                      <Icon name="eye" className="w-4 h-4" />
                    </Button>
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
    </div>
  )
}
