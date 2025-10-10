import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface LetterApproval {
  id: string
  letter_id: string
  status: string
  created_at: string
  legal_letters: {
    id: string
    title: string
    letter_type: string
    created_at: string
    profiles: {
      full_name: string
      email: string
    }
  }
}

interface LetterApprovalWorkflowProps {
  companyId: string
  isApprover?: boolean
}

export const LetterApprovalWorkflow = ({ companyId, isApprover = false }: LetterApprovalWorkflowProps) => {
  const [pendingApprovals, setPendingApprovals] = useState<LetterApproval[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPendingApprovals()

    // Set up realtime subscription
    const channel = supabase
      .channel('letter-approval-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'letter_approvals'
        },
        () => {
          fetchPendingApprovals()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId])

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true)
      
      // Get letters that belong to company users and are pending approval
      const { data: companyUserIds } = await supabase
        .from('user_company_roles')
        .select('user_id')
        .eq('company_id', companyId)

      if (!companyUserIds) return

      const userIds = companyUserIds.map(u => u.user_id)

      const { data, error } = await supabase
        .from('letter_approvals')
        .select(`
          id,
          letter_id,
          status,
          created_at,
          legal_letters!inner (
            id,
            title,
            letter_type,
            created_at,
            user_id
          )
        `)
        .eq('status', 'pending')
        .in('legal_letters.user_id', userIds)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch user profiles separately
      const letterUserIds = [...new Set(data?.map(a => (a.legal_letters as any).user_id) || [])]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', letterUserIds)

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])

      const approvalsWithProfiles = data?.map(approval => ({
        ...approval,
        legal_letters: {
          ...(approval.legal_letters as any),
          profiles: profileMap.get((approval.legal_letters as any).user_id)
        }
      })) as LetterApproval[] || []

      setPendingApprovals(approvalsWithProfiles)
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
      toast.error('Failed to load pending approvals')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (approvalId: string, letterId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('letter_approvals')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', approvalId)

      if (updateError) throw updateError

      // Update letter status
      const { error: letterError } = await supabase
        .from('legal_letters')
        .update({ status: 'approved' })
        .eq('id', letterId)

      if (letterError) throw letterError

      toast.success('Letter approved successfully')
      fetchPendingApprovals()
    } catch (error: any) {
      console.error('Error approving letter:', error)
      toast.error(error.message || 'Failed to approve letter')
    }
  }

  const handleReject = async (approvalId: string, letterId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('letter_approvals')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', approvalId)

      if (updateError) throw updateError

      // Update letter status
      const { error: letterError } = await supabase
        .from('legal_letters')
        .update({ status: 'draft' })
        .eq('id', letterId)

      if (letterError) throw letterError

      toast.success('Letter rejected - returned to draft')
      fetchPendingApprovals()
    } catch (error: any) {
      console.error('Error rejecting letter:', error)
      toast.error(error.message || 'Failed to reject letter')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Letter Approvals</CardTitle>
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
          <Icon name="check-circle" className="h-5 w-5" />
          Letter Approvals
          {pendingApprovals.length > 0 && (
            <Badge variant="destructive">{pendingApprovals.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isApprover 
            ? 'Review and approve team letters requiring your approval'
            : 'Track letters pending approval from managers'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {pendingApprovals.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Icon name="check-circle" className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{approval.legal_letters.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {approval.legal_letters.profiles?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{approval.legal_letters.profiles?.full_name || 'Unknown User'}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {approval.legal_letters.letter_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {isApprover && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleApprove(approval.id, approval.letter_id)}
                        className="flex-1"
                      >
                        <Icon name="check" className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleReject(approval.id, approval.letter_id)}
                        className="flex-1"
                      >
                        <Icon name="x" className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => window.open(`/letters/${approval.letter_id}`, '_blank')}
                      >
                        <Icon name="external-link" className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
