import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Printer, CheckCircle, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

interface SignedDocumentViewerProps {
  letterId: string;
  letterTitle: string;
  letterContent: string;
}

interface SignatureField {
  id: string;
  field_type: string;
  field_label: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  field_value?: string;
  page_number?: number;
  completed_at?: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  signed_at: string;
  ip_address?: string;
}

interface SignatureRequest {
  id: string;
  title: string;
  completed_at: string;
}

export const SignedDocumentViewer = ({ 
  letterId, 
  letterTitle, 
  letterContent 
}: SignedDocumentViewerProps) => {
  const [signatureRequest, setSignatureRequest] = useState<SignatureRequest | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSignedDocument();
  }, [letterId]);

  const loadSignedDocument = async () => {
    try {
      // Get signature request (any status since letter is marked as signed)
      const { data: requestData, error: requestError } = await supabase
        .from("signature_requests")
        .select("*")
        .eq("letter_id", letterId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (requestError) throw requestError;
      if (!requestData) {
        toast({
          title: "No signed document found",
          description: "This letter has not been fully signed yet",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setSignatureRequest(requestData);

      // Get recipients
      const { data: recipientsData, error: recipientsError } = await supabase
        .from("signature_recipients")
        .select("*")
        .eq("signature_request_id", requestData.id)
        .eq("status", "signed")
        .order("signing_order", { ascending: true });

      if (recipientsError) throw recipientsError;
      setRecipients(recipientsData || []);

      // Get signature fields with values
      const { data: fieldsData, error: fieldsError } = await supabase
        .from("signature_field_positions")
        .select("*")
        .eq("signature_request_id", requestData.id);

      if (fieldsError) throw fieldsError;
      setSignatureFields(fieldsData || []);
    } catch (error: any) {
      console.error("Error loading signed document:", error);
      toast({
        title: "Failed to load signed document",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!signatureRequest) return;

    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-signed-document-pdf", {
        body: { signature_request_id: signatureRequest.id },
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([atob(data.pdfHtml)], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Your signed document is downloading",
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSignatureField = (field: SignatureField) => {
    const style = {
      position: 'absolute' as const,
      left: `${field.x_position}%`,
      top: `${field.y_position}%`,
      width: `${field.width}px`,
      height: `${field.height}px`,
      zIndex: 10,
    };

    switch (field.field_type) {
      case 'signature':
      case 'initial':
        return field.field_value ? (
          <div key={field.id} style={style} className="border-2 border-primary/30 bg-white/50 rounded">
            <img 
              src={field.field_value} 
              alt={field.field_label}
              className="w-full h-full object-contain"
            />
          </div>
        ) : null;

      case 'text':
        return field.field_value ? (
          <div key={field.id} style={style} className="border-b-2 border-primary/30 bg-white/50 px-2 flex items-center">
            <span className="text-sm font-medium">{field.field_value}</span>
          </div>
        ) : null;

      case 'date':
        return field.field_value ? (
          <div key={field.id} style={style} className="border-b-2 border-primary/30 bg-white/50 px-2 flex items-center">
            <span className="text-sm font-medium">
              {format(new Date(field.field_value), 'MMM dd, yyyy')}
            </span>
          </div>
        ) : null;

      case 'checkbox':
        const isChecked = field.field_value === 'true' || field.field_value === '1';
        return (
          <div key={field.id} style={style} className="border-2 border-primary/30 bg-white/50 rounded flex items-center justify-center">
            {isChecked && (
              <CheckCircle className="w-full h-full text-primary p-1" />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!signatureRequest) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No signed document available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <Card className="print:hidden">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="font-semibold">Verified Signed Document</h3>
                <p className="text-sm text-muted-foreground">
                  Completed {format(new Date(signatureRequest.completed_at), 'PPP')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownloadPDF} disabled={downloading}>
                {downloading ? (
                  <>Downloading...</>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signed Document */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{letterTitle}</CardTitle>
            <Badge className="bg-emerald-600">Fully Executed</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {/* Document Content with Signature Overlays */}
          <div className="relative">
            <div className="bg-white border rounded-lg p-8 min-h-[800px]">
              <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                {letterContent}
              </pre>
            </div>

            {/* Signature Field Overlays */}
            {signatureFields.map(field => renderSignatureField(field))}
          </div>

          {/* Verification Section */}
          <div className="mt-8 pt-8 border-t">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Digital Signature Verification
            </h4>
            <div className="space-y-4">
              {recipients.map((recipient, index) => (
                <div 
                  key={recipient.id}
                  className="border rounded-lg p-4 bg-muted/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-muted-foreground">{recipient.email}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Signed on {format(new Date(recipient.signed_at), 'PPP')} at {format(new Date(recipient.signed_at), 'pp')}
                      </p>
                      {recipient.ip_address && (
                        <p className="text-xs text-muted-foreground">
                          IP: {recipient.ip_address}
                        </p>
                      )}
                    </div>
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              ))}
            </div>

            {/* Verification ID */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Document ID: <span className="font-mono">{signatureRequest.id}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This document has been digitally signed and tamper-evident. Any modifications will invalidate the signatures.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
