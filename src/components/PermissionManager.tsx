import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { IconShield, IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
  created_at: string;
}

const AVAILABLE_PERMISSIONS = [
  { key: "view_letters", label: "View Letters" },
  { key: "create_letters", label: "Create Letters" },
  { key: "edit_letters", label: "Edit Letters" },
  { key: "delete_letters", label: "Delete Letters" },
  { key: "assign_letters", label: "Assign Letters" },
  { key: "view_templates", label: "View Templates" },
  { key: "create_templates", label: "Create Templates" },
  { key: "manage_team", label: "Manage Team" },
  { key: "view_analytics", label: "View Analytics" },
  { key: "manage_credits", label: "Manage Credits" },
];

export const PermissionManager = () => {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: {} as Record<string, boolean>,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from("permission_templates")
      .select("*")
      .order("name");

    if (!error && data) {
      setTemplates(data as PermissionTemplate[]);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Please enter a template name");
      return;
    }

    setLoading(true);
    const payload = {
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
    };

    let error;
    if (editingTemplate) {
      ({ error } = await supabase
        .from("permission_templates")
        .update(payload)
        .eq("id", editingTemplate.id));
    } else {
      ({ error } = await supabase.from("permission_templates").insert(payload));
    }

    if (error) {
      toast.error("Failed to save template");
    } else {
      toast.success(editingTemplate ? "Template updated" : "Template created");
      setDialogOpen(false);
      setEditingTemplate(null);
      setFormData({ name: "", description: "", permissions: {} });
      loadTemplates();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    const { error } = await supabase
      .from("permission_templates")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete template");
    } else {
      toast.success("Template deleted");
      loadTemplates();
    }
  };

  const openEditDialog = (template: PermissionTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      permissions: template.permissions,
    });
    setDialogOpen(true);
  };

  const togglePermission = (key: string) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key],
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5" />
              Permission Templates
            </CardTitle>
            <CardDescription>Create and manage permission sets</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingTemplate(null);
                  setFormData({ name: "", description: "", permissions: {} });
                }}
              >
                <IconPlus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Edit Template" : "Create Template"}
                </DialogTitle>
                <DialogDescription>
                  Define a set of permissions for a role
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Team Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe this permission set..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-3 border rounded-lg p-4">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <div key={perm.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={perm.key}
                          checked={formData.permissions[perm.key] || false}
                          onCheckedChange={() => togglePermission(perm.key)}
                        />
                        <label
                          htmlFor={perm.key}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSave} disabled={loading} className="w-full">
                  {editingTemplate ? "Update" : "Create"} Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Object.values(template.permissions).filter(Boolean).length}{" "}
                  permissions enabled
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(template)}
                >
                  <IconEdit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
