import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@/components/ui/Icon"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Department {
  id: string
  name: string
  credit_allocation: number
  manager_id?: string
  parent_id?: string
  profiles?: {
    full_name: string
    email: string
  }
}

interface DepartmentCreditAllocationProps {
  companyId: string
}

export const DepartmentCreditAllocation = ({ companyId }: DepartmentCreditAllocationProps) => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [companyUsers, setCompanyUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    credit_allocation: 0,
    manager_id: '',
    parent_id: ''
  })

  useEffect(() => {
    fetchDepartments()
    fetchCompanyUsers()
  }, [companyId])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('name')

      if (error) throw error

      // Fetch manager profiles separately
      const managerIds = data?.map(d => d.manager_id).filter(Boolean) || []
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', managerIds)

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])
      
      const deptsWithProfiles = data?.map(dept => ({
        ...dept,
        profiles: dept.manager_id ? profileMap.get(dept.manager_id) : undefined
      })) || []

      setDepartments(deptsWithProfiles)
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanyUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_company_roles')
        .select('user_id, role')
        .eq('company_id', companyId)
        .in('role', ['company_admin', 'company_manager'])

      if (error) throw error

      // Fetch user profiles separately
      const userIds = data?.map(u => u.user_id) || []
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds)

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])
      
      const usersWithProfiles = data?.map(user => ({
        ...user,
        profiles: profileMap.get(user.user_id)
      })) || []

      setCompanyUsers(usersWithProfiles)
    } catch (error) {
      console.error('Error fetching company users:', error)
    }
  }

  const handleCreateOrUpdate = async () => {
    try {
      if (editingDept) {
        const { error } = await supabase
          .from('departments')
          .update({
            name: formData.name,
            credit_allocation: formData.credit_allocation,
            manager_id: formData.manager_id || null,
            parent_id: formData.parent_id || null
          })
          .eq('id', editingDept.id)

        if (error) throw error

        // Log activity
        await supabase.from('company_activity_logs').insert({
          company_id: companyId,
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          activity_type: 'department_updated',
          target_entity_id: editingDept.id,
          target_entity_type: 'department',
          description: `Updated department "${formData.name}"`
        })

        toast.success('Department updated successfully')
      } else {
        const { data: newDept, error } = await supabase
          .from('departments')
          .insert({
            company_id: companyId,
            name: formData.name,
            credit_allocation: formData.credit_allocation,
            manager_id: formData.manager_id || null,
            parent_id: formData.parent_id || null
          })
          .select()
          .single()

        if (error) throw error

        // Log activity
        await supabase.from('company_activity_logs').insert({
          company_id: companyId,
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          activity_type: 'department_created',
          target_entity_id: newDept.id,
          target_entity_type: 'department',
          description: `Created department "${formData.name}" with ${formData.credit_allocation} credits`
        })

        toast.success('Department created successfully')
      }

      setDialogOpen(false)
      setEditingDept(null)
      setFormData({ name: '', credit_allocation: 0, manager_id: '', parent_id: '' })
      fetchDepartments()
    } catch (error: any) {
      console.error('Error saving department:', error)
      toast.error(error.message || 'Failed to save department')
    }
  }

  const handleDelete = async (deptId: string, deptName: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', deptId)

      if (error) throw error

      // Log activity
      await supabase.from('company_activity_logs').insert({
        company_id: companyId,
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        activity_type: 'department_deleted',
        target_entity_id: deptId,
        target_entity_type: 'department',
        description: `Deleted department "${deptName}"`
      })

      toast.success('Department deleted successfully')
      fetchDepartments()
    } catch (error: any) {
      console.error('Error deleting department:', error)
      toast.error(error.message || 'Failed to delete department')
    }
  }

  const openEditDialog = (dept: Department) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      credit_allocation: dept.credit_allocation,
      manager_id: dept.manager_id || '',
      parent_id: dept.parent_id || ''
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingDept(null)
    setFormData({ name: '', credit_allocation: 0, manager_id: '', parent_id: '' })
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department Credit Allocation</CardTitle>
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="building" className="h-5 w-5" />
                Department Credit Allocation
              </CardTitle>
              <CardDescription>
                Manage credit budgets for different departments
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Icon name="plus" className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No departments yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{dept.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="coins" className="h-4 w-4" />
                        {dept.credit_allocation} credits
                      </span>
                      {dept.profiles && (
                        <span className="flex items-center gap-1">
                          <Icon name="user" className="h-4 w-4" />
                          {dept.profiles.full_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(dept)}>
                      <Icon name="pencil" className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(dept.id, dept.name)}>
                      <Icon name="trash" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
            <DialogDescription>
              {editingDept ? 'Update department details' : 'Add a new department with credit allocation'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Department Name</Label>
              <Input
                id="dept-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Engineering, Sales, HR..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-allocation">Monthly Credit Allocation</Label>
              <Input
                id="credit-allocation"
                type="number"
                value={formData.credit_allocation}
                onChange={(e) => setFormData({ ...formData, credit_allocation: Number(e.target.value) })}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Department Manager (Optional)</Label>
              <Select value={formData.manager_id} onValueChange={(value) => setFormData({ ...formData, manager_id: value })}>
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No manager</SelectItem>
                  {companyUsers.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.profiles?.full_name || user.profiles?.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Department (Optional)</Label>
              <Select value={formData.parent_id} onValueChange={(value) => setFormData({ ...formData, parent_id: value })}>
                <SelectTrigger id="parent">
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No parent</SelectItem>
                  {departments.filter(d => d.id !== editingDept?.id).map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdate}>
              {editingDept ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
