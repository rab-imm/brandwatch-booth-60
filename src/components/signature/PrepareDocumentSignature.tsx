import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PDFDocumentViewer } from "./PDFDocumentViewer";
import { SignatureFieldPlacer, SignatureField } from "./SignatureFieldPlacer";
import { RecipientManager, Recipient } from "./RecipientManager";
import { Send, Save } from "lucide-react";

interface PrepareDocumentSignatureProps {
  letterId: string;
  letterContent: string;
  letterTitle: string;
}

export const PrepareDocumentSignature = ({
  letterId,
  letterContent,
  letterTitle,
}: PrepareDocumentSignatureProps) => {
  const [title, setTitle] = useState(`Signature Request: ${letterTitle}`);
  const [message, setMessage] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [allowEditing, setAllowEditing] = useState(false);
  const signingOrderEnabled = false;
  const webhookUrl = "";
  const enableWebhook = false;
  
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>();
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [selectedFieldType, setSelectedFieldType] = useState<SignatureField["type"]>("signature");
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddRecipient = (recipient: Omit<Recipient, "id">) => {
    const newRecipient = {
      ...recipient,
      id: crypto.randomUUID(),
    };
    setRecipients([...recipients, newRecipient]);
    if (!selectedRecipient) {
      setSelectedRecipient(newRecipient.email);
    }
  };

  const handleRemoveRecipient = (recipientId: string) => {
    const recipient = recipients.find((r) => r.id === recipientId);
    setRecipients(recipients.filter((r) => r.id !== recipientId));
    setFields(fields.filter((f) => f.recipientEmail !== recipient?.email));
    if (selectedRecipient === recipient?.email) {
      setSelectedRecipient(recipients[0]?.email);
    }
  };

  const handleAddField = (field: Omit<SignatureField, "id">) => {
    const newField = {
      ...field,
      id: crypto.randomUUID(),
      recipientEmail: selectedRecipient || field.recipientEmail,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
  };

  const handlePageClick = (pageNumber: number, x: number, y: number) => {
    if (!selectedRecipient) {
      toast({
        title: "No recipient selected",
        description: "Please select a recipient before placing fields",
        variant: "destructive",
      });
      return;
    }

    // Determine field dimensions based on type
    const fieldDimensions = {
      signature: { width: 200, height: 60 },
      initial: { width: 80, height: 60 },
      date: { width: 120, height: 40 },
      text: { width: 200, height: 40 },
      checkbox: { width: 24, height: 24 },
    };

    const dims = fieldDimensions[selectedFieldType];

    handleAddField({
      type: selectedFieldType,
      page: pageNumber,
      x,
      y,
      width: dims.width,
      height: dims.height,
      recipientEmail: selectedRecipient,
      required: true,
    });
  };

  const renderFieldOverlay = (pageNumber: number) => {
    const pageFields = fields.filter((f) => f.page === pageNumber);
    
    return (
      <>
        {pageFields.map((field) => (
          <div
            key={field.id}
            className="absolute border-2 border-primary bg-primary/10 pointer-events-auto cursor-move"
            style={{
              left: `${field.x}%`,
              top: `${field.y}%`,
              width: `${field.width}px`,
              height: `${field.height}px`,
            }}
          >
            <div className="text-xs font-medium p-1 bg-primary text-primary-foreground">
              {field.type}
            </div>
          </div>
        ))}
      </>
    );
  };

  const handleSendRequest = async () => {
    if (recipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one recipient",
        variant: "destructive",
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: "No fields placed",
        description: "Please place at least one signature field",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("create-signature-request", {
        body: {
          letter_id: letterId,
          title,
          message,
          recipients: recipients.map((r) => ({
            email: r.email,
            name: r.name,
            role: r.role,
          })),
          fields: fields.map((f) => ({
            type: f.type,
            page: f.page,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
            recipientEmail: f.recipientEmail,
            label: f.label,
            placeholder: f.placeholder,
            required: f.required,
          })),
          expires_in_days: expiresInDays,
          allow_editing: allowEditing,
          signing_order_enabled: signingOrderEnabled,
          webhook_url: enableWebhook ? webhookUrl : null,
          webhook_events: enableWebhook ? ['completed', 'recipient_signed'] : null,
        },
      });

      if (error) throw error;

      toast({
        title: "Signature request sent",
        description: "Recipients will receive an email with signing instructions",
      });

      navigate("/letters");
    } catch (error: any) {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>Click to place signature fields</CardDescription>
            </CardHeader>
            <CardContent>
              <PDFDocumentViewer
                content={letterContent}
                onPageClick={handlePageClick}
                overlayContent={renderFieldOverlay}
              />
            </CardContent>
          </Card>
        </div>

        <ScrollArea className="h-[calc(100vh-2rem)] sticky top-4">
          <div className="space-y-4 pr-4">
            <Card>
              <CardHeader>
                <CardTitle>Request Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Request Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message to Recipients</Label>
                  <Textarea
                    id="message"
                    placeholder="Please review and sign this document..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires">Expires In (Days)</Label>
                  <Input
                    id="expires"
                    type="number"
                    min="1"
                    max="365"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allow-editing">Allow Document Editing</Label>
                  <Switch
                    id="allow-editing"
                    checked={allowEditing}
                    onCheckedChange={setAllowEditing}
                  />
                </div>

              </CardContent>
            </Card>

            <RecipientManager
              recipients={recipients}
              onAddRecipient={handleAddRecipient}
              onRemoveRecipient={handleRemoveRecipient}
              onSelectRecipient={setSelectedRecipient}
              selectedRecipient={selectedRecipient}
            />

            <SignatureFieldPlacer
              fields={fields}
              currentRecipient={selectedRecipient}
              selectedFieldType={selectedFieldType}
              onFieldTypeChange={setSelectedFieldType}
              onAddField={handleAddField}
              onRemoveField={handleRemoveField}
            />

            <Button
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Signature Request
            </Button>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
