import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Icon } from "@/components/ui/Icon"
import { formatDistanceToNow } from "date-fns"

interface ActivityLog {
  id: string
  activity_type: string
  description: string
  created_at: string
  performed_by: string
  metadata?: any
  profiles?: {
    full_name: string
    email: string
  }
}

interface TeamActivityFeedProps {
  companyId: string
  limit?: number
}

export const TeamActivityFeed = ({ companyId, limit = 20 }: TeamActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
    
    // Set up realtime subscription for new activities
    const channel = supabase
      .channel('company-activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'company_activity_logs',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          setActivities(prev => [payload.new as ActivityLog, ...prev].slice(0, limit))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, limit])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_activity_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Fetch profile data separately
      const userIds = [...new Set(data?.map(a => a.performed_by) || [])]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds)

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])
      
      const activitiesWithProfiles = data?.map(activity => ({
        ...activity,
        profiles: profileMap.get(activity.performed_by)
      })) || []

      setActivities(activitiesWithProfiles)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'user_invited':
        return 'mail'
      case 'invitation_accepted':
        return 'user-plus'
      case 'user_removed':
        return 'user-minus'
      case 'credits_updated':
        return 'coins'
      case 'role_updated':
        return 'shield'
      case 'letter_created':
        return 'file-text'
      case 'document_uploaded':
        return 'upload'
      default:
        return 'activity'
    }
  }

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'user_invited':
      case 'invitation_accepted':
        return 'bg-green-500/10 text-green-500'
      case 'user_removed':
        return 'bg-red-500/10 text-red-500'
      case 'credits_updated':
        return 'bg-blue-500/10 text-blue-500'
      case 'role_updated':
        return 'bg-purple-500/10 text-purple-500'
      case 'letter_created':
      case 'document_uploaded':
        return 'bg-orange-500/10 text-orange-500'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Icon name="loader" className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="activity" className="h-5 w-5" />
          Team Activity
        </CardTitle>
        <CardDescription>
          Recent actions by your team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activity yet
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 items-start">
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.activity_type)}`}>
                    <Icon name={getActivityIcon(activity.activity_type)} className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {activity.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {activity.profiles?.full_name || 'Unknown User'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {activity.activity_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
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
