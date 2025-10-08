import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { IconCalendarEvent, IconBell, IconArchive } from "@tabler/icons-react";
import { format } from "date-fns";

interface DocumentExpiry {
  id: string;
  document_id: string;
  expiry_date: string;
  auto_remind: boolean;
  auto_archive: boolean;
  last_reminder_sent: string | null;
}

interface DocumentExpiryManagerProps {
  documentId: string;
}

export const DocumentExpiryManager = ({ documentId }: DocumentExpiryManagerProps) => {
  const [expiry, setExpiry] = useState<DocumentExpiry | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [autoRemind, setAutoRemind] = useState(true);
  const [autoArchive, setAutoArchive] = useState(false);

  useEffect(() => {
    loadExpiry();
  }, [documentId]);

  const loadExpiry = async () => {
    const { data, error } = await supabase
      .from("document_expiry_tracking")
      .select("*")
      .eq("document_id", documentId)
      .maybeSingle();

    if (!error && data) {
      setExpiry(data as DocumentExpiry);
      setExpiryDate(new Date(data.expiry_date));
      setAutoRemind(data.auto_remind);
      setAutoArchive(data.auto_archive);
    }
  };

  const handleSave = async () => {
    if (!expiryDate) {
      toast.error("Please select an expiry date");
      return;
    }

    setLoading(true);
    const payload = {
      document_id: documentId,
      expiry_date: expiryDate.toISOString(),
      auto_remind: autoRemind,
      auto_archive: autoArchive,
    };

    let error;
    if (expiry) {
      ({ error } = await supabase
        .from("document_expiry_tracking")
        .update(payload)
        .eq("id", expiry.id));
    } else {
      ({ error } = await supabase.from("document_expiry_tracking").insert(payload));
    }

    if (error) {
      toast.error("Failed to save expiry settings");
    } else {
      toast.success("Expiry settings saved");
      loadExpiry();
    }
    setLoading(false);
  };

  const handleSendReminder = async () => {
    setLoading(true);
    const { error } = await supabase.functions.invoke("send-expiry-reminder", {
      body: { document_id: documentId },
    });

    if (error) {
      toast.error("Failed to send reminder");
    } else {
      toast.success("Reminder sent successfully");
    }
    setLoading(false);
  };

  const getDaysUntilExpiry = () => {
    if (!expiryDate) return null;
    const today = new Date();
    const diff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysLeft = getDaysUntilExpiry();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCalendarEvent className="h-5 w-5" />
          Document Expiry Management
        </CardTitle>
        <CardDescription>Set expiry dates and configure reminders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {daysLeft !== null && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Days until expiry:</span>
              <Badge variant={daysLeft < 7 ? "destructive" : daysLeft < 30 ? "default" : "secondary"}>
                {daysLeft} days
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Expiry Date</Label>
          <Calendar
            mode="single"
            selected={expiryDate}
            onSelect={setExpiryDate}
            className="rounded-md border"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBell className="h-4 w-4" />
              <Label>Auto-Remind (7 days before)</Label>
            </div>
            <Switch checked={autoRemind} onCheckedChange={setAutoRemind} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconArchive className="h-4 w-4" />
              <Label>Auto-Archive on Expiry</Label>
            </div>
            <Switch checked={autoArchive} onCheckedChange={setAutoArchive} />
          </div>
        </div>

        {expiry?.last_reminder_sent && (
          <p className="text-sm text-muted-foreground">
            Last reminder sent: {format(new Date(expiry.last_reminder_sent), "PPP")}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading}>
            Save Settings
          </Button>
          <Button variant="outline" onClick={handleSendReminder} disabled={loading}>
            Send Reminder Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
