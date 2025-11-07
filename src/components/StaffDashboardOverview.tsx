import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, MessageSquare, PenTool, Package } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface StaffDashboardOverviewProps {
  userId: string
  companyId: string | null
  onNavigateToSection: (section: string) => void
}

export function StaffDashboardOverview({ userId, companyId, onNavigateToSection }: StaffDashboardOverviewProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    recentLetters: [] as any[],
    recentConversations: [] as any[],
    recentSignatures: [] as any[],
    availableTemplates: [] as any[]
  })

  useEffect(() => {
    fetchDashboardData()
  }, [userId, companyId])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch recent letters
      const { data: letters } = await supabase
        .from('legal_letters')
        .select('id, title, letter_type, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch recent conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch recent signature requests
      const { data: signatures } = await supabase
        .from('signature_requests')
        .select('id, title, status, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch available templates
      const { data: templates } = await supabase
        .from('templates')
        .select('id, title, category, credit_cost')
        .eq('is_active', true)
        .order('download_count', { ascending: false })
        .limit(6)

      setStats({
        recentLetters: letters || [],
        recentConversations: conversations || [],
        recentSignatures: signatures || [],
        availableTemplates: templates || []
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome to Your Workspace</h2>
        <p className="text-muted-foreground">Here's what's happening with your legal documents</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Recent Letters */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Letters
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigateToSection('letters')}>
                View All
              </Button>
            </div>
            <CardDescription>Your latest legal documents</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentLetters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No letters yet. Start creating your first one!</p>
            ) : (
              <div className="space-y-3">
                {stats.recentLetters.map((letter) => (
                  <div key={letter.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{letter.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(letter.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      letter.status === 'finalized' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      letter.status === 'draft' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {letter.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Recent Chats
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigateToSection('chat')}>
                View All
              </Button>
            </div>
            <CardDescription>Your latest conversations</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentConversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conversations yet. Start chatting!</p>
            ) : (
              <div className="space-y-3">
                {stats.recentConversations.map((conv) => (
                  <div key={conv.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{conv.title || 'Untitled Conversation'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conv.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Signatures */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-primary" />
                Signature Requests
              </CardTitle>
            </div>
            <CardDescription>Documents awaiting signatures</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentSignatures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signature requests yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentSignatures.map((sig) => (
                  <div key={sig.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{sig.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sig.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sig.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      sig.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {sig.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Templates */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Popular Templates
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigateToSection('templates')}>
                Browse All
              </Button>
            </div>
            <CardDescription>Ready-to-use legal templates</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.availableTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates available.</p>
            ) : (
              <div className="space-y-3">
                {stats.availableTemplates.slice(0, 5).map((template) => (
                  <div key={template.id} className="flex items-start justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{template.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{template.category}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {template.credit_cost} credits
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Button variant="outline" onClick={() => onNavigateToSection('chat')} className="justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              Start Chat
            </Button>
            <Button variant="outline" onClick={() => onNavigateToSection('letters')} className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Create Document
            </Button>
            <Button variant="outline" onClick={() => onNavigateToSection('templates')} className="justify-start">
              <Package className="mr-2 h-4 w-4" />
              Browse Templates
            </Button>
            <Button variant="outline" onClick={() => onNavigateToSection('team')} className="justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              Team Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
