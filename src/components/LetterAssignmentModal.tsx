import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { IconCalendar, IconUser } from "@tabler/icons-react";

interface LetterAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letterId: string;
  companyId: string;
}

interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
}

export const LetterAssignmentModal = ({
  open,
  onOpenChange,
  letterId,
  companyId,
}: LetterAssignmentModalProps) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState<string>("normal");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      loadTeamMembers();
    }
  }, [open, companyId]);

  const loadTeamMembers = async () => {
    const { data, error } = await supabase
      .from("user_company_roles")
      .select("user_id, profiles(full_name, email)")
      .eq("company_id", companyId);

    if (!error && data) {
      setTeamMembers(
        data.map((item: any) => ({
          user_id: item.user_id,
          full_name: item.profiles.full_name,
          email: item.profiles.email,
        }))
      );
    }
  };

  const handleAssign = async () => {
    if (!selectedUser || !dueDate) {
      toast.error("Please select a user and due date");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("letter_assignments").insert({
      letter_id: letterId,
      assigned_to: selectedUser,
      assigned_by: profile?.user_id,
      due_date: dueDate.toISOString(),
      priority,
      notes,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to assign letter");
    } else {
      toast.success("Letter assigned successfully");
      onOpenChange(false);
      setSelectedUser("");
      setDueDate(undefined);
      setPriority("normal");
      setNotes("");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Letter</DialogTitle>
          <DialogDescription>
            Assign this letter to a team member for review or action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Team Member</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    <div className="flex items-center gap-2">
                      <IconUser className="h-4 w-4" />
                      {member.full_name} ({member.email})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <IconCalendar className="h-4 w-4 mr-2" />
                  {dueDate ? format(dueDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Add any notes or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleAssign} disabled={loading} className="w-full">
            Assign Letter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
