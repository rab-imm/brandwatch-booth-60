import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { IconBuilding, IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";

interface Department {
  id: string;
  name: string;
  parent_id: string | null;
  manager_id: string | null;
  credit_allocation: number;
  created_at: string;
}

export const DepartmentManager = () => {
  const { profile } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    parent_id: "",
    manager_id: "",
    credit_allocation: 0,
  });

  useEffect(() => {
    loadDepartments();
  }, [profile]);

  const loadDepartments = async () => {
    if (!profile?.current_company_id) return;

    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("company_id", profile.current_company_id)
      .order("name");

    if (!error && data) {
      setDepartments(data);
    }
  };

  const handleSave = async () => {
    if (!profile?.current_company_id || !formData.name) return;

    setLoading(true);
    const payload = {
      company_id: profile.current_company_id,
      name: formData.name,
      parent_id: formData.parent_id || null,
      manager_id: formData.manager_id || null,
      credit_allocation: formData.credit_allocation,
    };

    let error;
    if (editingDept) {
      ({ error } = await supabase
        .from("departments")
        .update(payload)
        .eq("id", editingDept.id));
    } else {
      ({ error } = await supabase.from("departments").insert(payload));
    }

    if (error) {
      toast.error("Failed to save department");
    } else {
      toast.success(editingDept ? "Department updated" : "Department created");
      setDialogOpen(false);
      setEditingDept(null);
      setFormData({ name: "", parent_id: "", manager_id: "", credit_allocation: 0 });
      loadDepartments();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;

    const { error } = await supabase.from("departments").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete department");
    } else {
      toast.success("Department deleted");
      loadDepartments();
    }
  };

  const openEditDialog = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      parent_id: dept.parent_id || "",
      manager_id: dept.manager_id || "",
      credit_allocation: dept.credit_allocation,
    });
    setDialogOpen(true);
  };

  const renderDepartmentTree = (parentId: string | null = null, level = 0) => {
    return departments
      .filter((dept) => dept.parent_id === parentId)
      .map((dept) => (
        <div key={dept.id} style={{ marginLeft: `${level * 20}px` }}>
          <div className="flex items-center justify-between p-3 border rounded-lg mb-2">
            <div className="flex items-center gap-3">
              <IconBuilding className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{dept.name}</p>
                <p className="text-sm text-muted-foreground">
                  Credits: {dept.credit_allocation}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(dept)}
              >
                <IconEdit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(dept.id)}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {renderDepartmentTree(dept.id, level + 1)}
        </div>
      ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Department Management</CardTitle>
            <CardDescription>Manage your organization structure</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingDept(null);
                setFormData({ name: "", parent_id: "", manager_id: "", credit_allocation: 0 });
              }}>
                <IconPlus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDept ? "Edit Department" : "Add Department"}
                </DialogTitle>
                <DialogDescription>
                  Configure department details and credit allocation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Department Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Legal Department"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent Department</Label>
                  <Select
                    value={formData.parent_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, parent_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (Top level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (Top level)</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Credit Allocation</Label>
                  <Input
                    type="number"
                    value={formData.credit_allocation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credit_allocation: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <Button onClick={handleSave} disabled={loading} className="w-full">
                  {editingDept ? "Update" : "Create"} Department
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">{renderDepartmentTree()}</div>
      </CardContent>
    </Card>
  );
};
