import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { IconUser } from "@tabler/icons-react";

export const UserImpersonation = () => {
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");

  const handleImpersonate = () => {
    if (!userId || !reason) {
      toast.error("Please fill all fields");
      return;
    }
    toast.success("Impersonation started");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUser className="h-5 w-5" />
          User Impersonation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" />
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for impersonation" rows={3} />
        <Button onClick={handleImpersonate}>Start Impersonation</Button>
      </CardContent>
    </Card>
  );
};
