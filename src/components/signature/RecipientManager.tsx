import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface Recipient {
  id: string;
  name: string;
  email: string;
  role: string;
  order?: number;
}

interface RecipientManagerProps {
  recipients: Recipient[];
  onAddRecipient: (recipient: Omit<Recipient, "id">) => void;
  onRemoveRecipient: (recipientId: string) => void;
  onSelectRecipient: (email: string) => void;
  selectedRecipient?: string;
}

export const RecipientManager = ({
  recipients,
  onAddRecipient,
  onRemoveRecipient,
  onSelectRecipient,
  selectedRecipient,
}: RecipientManagerProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleAddRecipient = () => {
    if (!name.trim() || !email.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both name and email",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (recipients.some((r) => r.email === email)) {
      toast({
        title: "Duplicate recipient",
        description: "This recipient already exists",
        variant: "destructive",
      });
      return;
    }

    onAddRecipient({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "signer",
      order: recipients.length + 1,
    });

    setName("");
    setEmail("");
    
    toast({
      title: "Recipient added",
      description: `${name} has been added to the signature request`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recipients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="recipient-name">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="recipient-name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="recipient-email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Button onClick={handleAddRecipient} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Recipient
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Added Recipients ({recipients.length})</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recipients.map((recipient) => (
              <div
                key={recipient.id}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedRecipient === recipient.email
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelectRecipient(recipient.email)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{recipient.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{recipient.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    #{recipient.order}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecipient(recipient.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {recipients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recipients added yet
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
