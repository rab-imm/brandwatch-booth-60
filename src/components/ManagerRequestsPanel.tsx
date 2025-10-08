import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface LawyerRequest {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  created_at: string
  profile?: {
    full_name: string
    email: string
  }
}

export const ManagerRequestsPanel = () => {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState<LawyerRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [user, profile])

  const fetchRequests = async () => {
    if (!user || !profile?.current_company_id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('lawyer_requests')
        .select(`
          id,
          subject,
          description,
          status,
          priority,
          created_at,
          profiles (
            full_name,
            email
          )
        `)
        .eq('company_id', profile.current_company_id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default'
      case 'in_progress': return 'secondary'
      case 'completed': return 'outline'
      default: return 'default'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'alert-triangle'
      case 'normal': return 'info'
      case 'low': return 'circle'
      default: return 'info'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Icon name="loader" className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Lawyer Requests</CardTitle>
        <CardDescription>Recent requests from your team members</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon name={getPriorityIcon(request.priority)} className="h-4 w-4" />
                  <p className="font-medium">{request.subject}</p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {request.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{request.profile?.full_name || request.profile?.email}</span>
                  <span>•</span>
                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Badge variant={getStatusColor(request.status)}>
                {request.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="text-center py-8">
            <Icon name="inbox" className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No requests found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
