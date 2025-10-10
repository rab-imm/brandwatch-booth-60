import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Icon } from "@/components/ui/Icon"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface PermissionTemplate {
  id: string
  name: string
  description: string
  permissions: Record<string, boolean>
  created_at: string
}

const AVAILABLE_PERMISSIONS = [
  { key: 'can_create_letters', label: 'Create Letters', description: 'Create new legal letters' },
  { key: 'can_edit_letters', label: 'Edit Letters', description: 'Edit existing letters' },
  { key: 'can_delete_letters', label: 'Delete Letters', description: 'Delete letters' },
  { key: 'can_approve_letters', label: 'Approve Letters', description: 'Approve letters for finalization' },
  { key: 'can_view_all_letters', label: 'View All Letters', description: 'View all company letters' },
  { key: 'can_upload_documents', label: 'Upload Documents', description: 'Upload company documents' },
  { key: 'can_manage_templates', label: 'Manage Templates', description: 'Create and edit letter templates' },
  { key: 'can_view_analytics', label: 'View Analytics', description: 'Access usage analytics' },
  { key: 'can_manage_users', label: 'Manage Users', description: 'Invite and manage team members' },
  { key: 'can_manage_departments', label: 'Manage Departments', description: 'Create and manage departments' },
]

export const PermissionTemplateManager = () => {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {} as Record<string, boolean>
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('permission_templates')
        .select('*')
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load permission templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async () => {
    try {
      if (!formData.name) {
        toast.error('Please enter a template name')
        return
      }

      if (editingTemplate) {
        const { error } = await supabase
          .from('permission_templates')
          .update({
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions
          })
          .eq('id', editingTemplate.id)

        if (error) throw error
        toast.success('Permission template updated')
      } else {
        const { error } = await supabase
          .from('permission_templates')
          .insert({
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions
          })

        if (error) throw error
        toast.success('Permission template created')
      }

      setDialogOpen(false)
      setEditingTemplate(null)
      setFormData({ name: '', description: '', permissions: {} })
      fetchTemplates()
    } catch (error: any) {
      console.error('Error saving template:', error)
      toast.error(error.message || 'Failed to save template')
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const { error } = await supabase
        .from('permission_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      toast.success('Permission template deleted')
      fetchTemplates()
    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast.error(error.message || 'Failed to delete template')
    }
  }

  const openEditDialog = (template: PermissionTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      permissions: template.permissions
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingTemplate(null)
    setFormData({ name: '', description: '', permissions: {} })
    setDialogOpen(true)
  }

  const togglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }))
  }

  const countPermissions = (permissions: Record<string, boolean>) => {
    return Object.values(permissions).filter(Boolean).length
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Templates</CardTitle>
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
                <Icon name="shield" className="h-5 w-5" />
                Permission Templates
              </CardTitle>
              <CardDescription>
                Pre-defined permission sets for quick role assignment
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Icon name="plus" className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No templates yet. Create one to get started.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Badge variant="secondary">
                      {countPermissions(template.permissions)} permissions
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(template)} className="flex-1">
                      <Icon name="pencil" className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)}>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Update permission template' : 'Create a reusable permission template'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Viewer, Editor, Approver"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Input
                id="template-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this role"
              />
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="space-y-3">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <div key={permission.key} className="flex items-start space-x-3">
                    <Checkbox
                      id={permission.key}
                      checked={formData.permissions[permission.key] || false}
                      onCheckedChange={() => togglePermission(permission.key)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={permission.key}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {permission.label}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdate}>
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
