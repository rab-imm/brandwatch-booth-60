import { useState, useEffect, useRef } from "react";
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
import { Send, GripVertical } from "lucide-react";

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
  
  // Drag state
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  const handleUpdateField = (fieldId: string, updates: Partial<SignatureField>) => {
    setFields(fields.map(f => 
      f.id === fieldId ? { ...f, ...updates } : f
    ));
  };

  const handleFieldMouseDown = (e: React.MouseEvent, field: SignatureField) => {
    e.stopPropagation(); // Prevent triggering page click
    
    if (!containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const fieldElement = e.currentTarget.getBoundingClientRect();
    
    // Calculate offset from mouse to field's top-left corner
    const offsetX = ((e.clientX - fieldElement.left) / container.width) * 100;
    const offsetY = ((e.clientY - fieldElement.top) / container.height) * 100;
    
    setDraggedField(field.id);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleFieldMouseMove = (e: React.MouseEvent) => {
    if (!draggedField || !containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const field = fields.find(f => f.id === draggedField);
    if (!field) return;
    
    // Calculate new position as percentage
    const mouseX = e.clientX - container.left;
    const mouseY = e.clientY - container.top;
    
    const percentX = (mouseX / container.width) * 100;
    const percentY = (mouseY / container.height) * 100;
    
    // Apply offset and ensure field stays within bounds
    const fieldWidthPercent = (field.width / container.width) * 100;
    const fieldHeightPercent = (field.height / container.height) * 100;
    
    const newX = Math.max(0, Math.min(percentX - dragOffset.x, 100 - fieldWidthPercent));
    const newY = Math.max(0, Math.min(percentY - dragOffset.y, 100 - fieldHeightPercent));
    
    handleUpdateField(draggedField, { x: newX, y: newY });
  };

  const handleFieldMouseUp = () => {
    setDraggedField(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Add document-level mouse up listener to handle drag ending outside field
  useEffect(() => {
    const handleDocumentMouseUp = () => {
      if (draggedField) {
        handleFieldMouseUp();
      }
    };

    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [draggedField]);

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
        {pageFields.map((field) => {
          const isDragging = draggedField === field.id;
          
          return (
            <div
              key={field.id}
              className={`absolute border-2 border-primary bg-primary/10 pointer-events-auto cursor-grab active:cursor-grabbing transition-shadow ${
                isDragging ? 'shadow-lg ring-2 ring-primary/50 opacity-80' : 'hover:shadow-md'
              }`}
              style={{
                left: `${field.x}%`,
                top: `${field.y}%`,
                width: `${field.width}px`,
                height: `${field.height}px`,
              }}
              onMouseDown={(e) => handleFieldMouseDown(e, field)}
            >
              <div className="text-xs font-medium p-1 bg-primary text-primary-foreground flex items-center gap-1">
                <GripVertical className="h-3 w-3" />
                {field.type}
              </div>
            </div>
          );
        })}
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
              <div 
                ref={containerRef}
                onMouseMove={handleFieldMouseMove}
                onMouseUp={handleFieldMouseUp}
              >
                <PDFDocumentViewer
                  content={letterContent}
                  onPageClick={handlePageClick}
                  overlayContent={renderFieldOverlay}
                />
              </div>
            </CardContent>
          </Card>
        </div>

          <div className="sticky top-4 self-start">
            <ScrollArea className="h-[calc(100vh-8rem)] w-full">
              <div className="space-y-4 pr-4 pb-4">
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
    </div>
  );
};
