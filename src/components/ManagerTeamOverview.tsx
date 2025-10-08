import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface TeamMember {
  id: string
  user_id: string
  role: string
  used_credits: number
  max_credits_per_period: number
  profile?: {
    full_name: string
    email: string
  }
}

export const ManagerTeamOverview = () => {
  const { user, profile } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeamData()
  }, [user, profile])

  const fetchTeamData = async () => {
    if (!user || !profile?.current_company_id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_company_roles')
        .select(`
          id,
          user_id,
          role,
          used_credits,
          max_credits_per_period,
          profiles (
            full_name,
            email
          )
        `)
        .eq('company_id', profile.current_company_id)
        .neq('user_id', user.id) // Exclude self

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
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

  const totalCreditsUsed = teamMembers.reduce((sum, m) => sum + m.used_credits, 0)
  const totalCreditsAllocated = teamMembers.reduce((sum, m) => sum + m.max_credits_per_period, 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
          <CardDescription>Monitor your team's credit usage and activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Team Members</p>
              <p className="text-2xl font-bold">{teamMembers.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Credits Used</p>
              <p className="text-2xl font-bold">{totalCreditsUsed}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Credits Allocated</p>
              <p className="text-2xl font-bold">{totalCreditsAllocated}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Team Usage</span>
              <span>{((totalCreditsUsed / totalCreditsAllocated) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(totalCreditsUsed / totalCreditsAllocated) * 100} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Individual usage breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {(member.profile?.full_name || member.profile?.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.profile?.full_name || 'Unknown'}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {member.used_credits} / {member.max_credits_per_period}
                </p>
                <Progress 
                  value={(member.used_credits / member.max_credits_per_period) * 100} 
                  className="w-24 h-1.5 mt-1"
                />
              </div>
            </div>
          ))}
          {teamMembers.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No team members found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
