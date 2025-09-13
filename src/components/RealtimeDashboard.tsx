import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ActivityLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id?: string
  metadata: Record<string, any>
  created_at: string
}

interface RealtimeUpdate {
  id: string
  type: 'message' | 'document' | 'request' | 'template'
  title: string
  description: string
  timestamp: string
  user_id?: string
}

export const RealtimeDashboard = () => {
  const { user, profile } = useAuth()
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeUpdate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchActivityLogs()
      setupRealtimeSubscriptions()
    }
  }, [user])

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setActivityLogs((data || []) as ActivityLog[])
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscriptions = () => {
    // Subscribe to multiple tables for real-time updates
    const messageChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newUpdate: RealtimeUpdate = {
            id: payload.new.id,
            type: 'message',
            title: 'New Message',
            description: `New chat message received`,
            timestamp: payload.new.created_at,
            user_id: payload.new.user_id
          }
          setRealtimeUpdates(prev => [newUpdate, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    const documentChannel = supabase
      .channel('documents-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          const eventType = payload.eventType
          const doc = payload.new || payload.old
          
          if (doc && typeof doc === 'object' && 'id' in doc) {
            const documentData = doc as any
            const newUpdate: RealtimeUpdate = {
              id: documentData.id,
              type: 'document',
              title: `Document ${eventType.toLowerCase()}`,
              description: `Document "${documentData.title || 'Unknown'}" was ${eventType.toLowerCase()}`,
              timestamp: new Date().toISOString(),
              user_id: documentData.uploaded_by
            }
            setRealtimeUpdates(prev => [newUpdate, ...prev.slice(0, 49)])
          }
        }
      )
      .subscribe()

    const requestChannel = supabase
      .channel('requests-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lawyer_requests' },
        (payload) => {
          const newUpdate: RealtimeUpdate = {
            id: payload.new.id,
            type: 'request',
            title: 'New Lawyer Request',
            description: `New request: ${payload.new.subject}`,
            timestamp: payload.new.created_at,
            user_id: payload.new.user_id
          }
          setRealtimeUpdates(prev => [newUpdate, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    const templateChannel = supabase
      .channel('templates-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'template_downloads' },
        (payload) => {
          const newUpdate: RealtimeUpdate = {
            id: payload.new.id,
            type: 'template',
            title: 'Template Downloaded',
            description: `Template purchased for AED ${payload.new.price_paid_aed}`,
            timestamp: payload.new.downloaded_at,
            user_id: payload.new.user_id
          }
          setRealtimeUpdates(prev => [newUpdate, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(documentChannel)
      supabase.removeChannel(requestChannel)
      supabase.removeChannel(templateChannel)
    }
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('create')) return 'plus'
    if (action.includes('update')) return 'edit'
    if (action.includes('delete')) return 'trash'
    if (action.includes('download')) return 'download'
    if (action.includes('upload')) return 'upload'
    return 'activity'
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'message': return 'message-circle'
      case 'document': return 'file-text'
      case 'request': return 'alert-circle'
      case 'template': return 'download'
      default: return 'bell'
    }
  }

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'message': return 'text-blue-600'
      case 'document': return 'text-green-600'
      case 'request': return 'text-orange-600'
      case 'template': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  if (!user || (profile?.user_role !== 'super_admin' && profile?.user_role !== 'company_admin')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-destructive">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            You don't have permission to view the realtime dashboard.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="loader" className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Real-time Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor live activity and system updates in real-time
        </p>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Icon name="activity" className="h-4 w-4" />
            Live Updates
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Icon name="list" className="h-4 w-4" />
            Activity Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="radio" className="h-5 w-5" />
                Live System Updates
              </CardTitle>
              <CardDescription>
                Real-time updates from across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {realtimeUpdates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icon name="radio" className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No live updates yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Updates will appear here as they happen
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {realtimeUpdates.map((update) => (
                      <div key={`${update.type}-${update.id}`} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Icon 
                          name={getUpdateIcon(update.type)} 
                          className={`h-5 w-5 mt-0.5 ${getUpdateColor(update.type)}`} 
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{update.title}</p>
                            <Badge variant="outline" className="text-xs">
                              {update.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {update.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(update.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="list" className="h-5 w-5" />
                Activity Logs
              </CardTitle>
              <CardDescription>
                Detailed audit trail of system activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {activityLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Icon name="list" className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No activity logs found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Icon 
                          name={getActivityIcon(log.action)} 
                          className="h-4 w-4 mt-1 text-muted-foreground" 
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{log.action}</p>
                            <Badge variant="secondary" className="text-xs">
                              {log.resource_type}
                            </Badge>
                          </div>
                          {Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <details className="cursor-pointer">
                                <summary>View details</summary>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}