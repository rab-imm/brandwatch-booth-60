import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Icon } from "@/components/ui/Icon"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Activity {
  id: string
  action: string
  resource_type: string
  resource_id: string | null
  metadata: any
  created_at: string
}

const getActivityIcon = (resourceType: string) => {
  switch (resourceType) {
    case 'template': return 'file-text'
    case 'letter': return 'mail'
    case 'subscription': return 'credit-card'
    case 'credit': return 'coins'
    default: return 'activity'
  }
}

const getActivityColor = (action: string) => {
  if (action.includes('create') || action.includes('download')) return 'success'
  if (action.includes('update')) return 'default'
  if (action.includes('delete')) return 'destructive'
  return 'secondary'
}

export const ActivityTimeline = () => {
  const { session } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchActivities()
    }
  }, [session])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error("Failed to load activity timeline")
    } finally {
      setLoading(false)
    }
  }

  const formatActivityMessage = (activity: Activity) => {
    const action = activity.action.replace(/_/g, ' ')
    const resourceType = activity.resource_type.replace(/_/g, ' ')
    return `${action} ${resourceType}`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Icon name="loader" className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="activity" className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your recent actions and transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="inbox" className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full p-2 bg-primary/10">
                      <Icon 
                        name={getActivityIcon(activity.resource_type)} 
                        className="h-4 w-4 text-primary" 
                      />
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-px h-full bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium capitalize">
                        {formatActivityMessage(activity)}
                      </p>
                      <Badge variant={getActivityColor(activity.action) as any}>
                        {activity.action}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {Object.entries(activity.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
