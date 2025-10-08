import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { IconUsers, IconPlus } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function TeamWorkspace() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [letters, setLetters] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.current_company_id) {
      fetchTeamData()
    }
  }, [profile])

  const fetchTeamData = async () => {
    try {
      // Fetch team letters
      const { data: lettersData } = await supabase
        .from('legal_letters')
        .select('*')
        .eq('company_id', profile?.current_company_id)
        .order('created_at', { ascending: false })

      setLetters(lettersData || [])

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('letter_assignments')
        .select('*, legal_letters(title), profiles!letter_assignments_assigned_to_fkey(full_name)')
        .order('created_at', { ascending: false })

      setAssignments(assignmentsData || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      'pending': 'secondary',
      'in_progress': 'default',
      'completed': 'outline'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const variants: any = {
      'urgent': 'destructive',
      'high': 'default',
      'normal': 'secondary',
      'low': 'outline'
    }
    return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          <div className="text-center">Loading team workspace...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUsers className="h-5 w-5" />
              Team Workspace
            </CardTitle>
            <CardDescription>
              Collaborate on legal letters with your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <IconPlus className="h-4 w-4 mr-2" />
              Assign Letter
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Letters</CardTitle>
              <CardDescription>All company legal letters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {letters.map((letter) => (
                  <div key={letter.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{letter.title}</p>
                      <p className="text-sm text-muted-foreground">{letter.letter_type}</p>
                    </div>
                    <Badge>{letter.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>Track team member tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Letter</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{assignment.legal_letters?.title || 'N/A'}</TableCell>
                      <TableCell>{assignment.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>{getPriorityBadge(assignment.priority)}</TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}